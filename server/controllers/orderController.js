const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Coupon = require('../models/Coupon');
const Vendor = require('../models/Vendor');
const OTP = require('../models/OTP');
const Commission = require('../models/Commission');
const calcCommission = require('../utils/calcCommission');
const generateOTP = require('../utils/generateOTP');
const sendWhatsApp = require('../utils/sendWhatsApp');
const sendEmail = require('../utils/sendEmail');
const ApiError = require('../utils/ApiError');

// CREATE ORDER (customer)
exports.createOrder = async (req, res, next) => {
  try {
    const { addressId, paymentMethod = 'cod', couponCode } = req.body;
    const customerId = req.user._id;

    // Get cart
    const cart = await Cart.findOne({ customerId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return next(ApiError.badRequest('Cart is empty'));
    }

    // Check stock for each item
    for (const item of cart.items) {
      const product = item.productId;
      if (!product || !product.isActive) {
        return next(ApiError.badRequest(`Product no longer available: ${product?.name}`));
      }

      let availableStock = product.stock;
      if (item.variantId) {
        const variant = await ProductVariant.findById(item.variantId);
        if (!variant) {
          return next(ApiError.badRequest('Variant not found'));
        }
        availableStock = variant.stock;
      }

      if (availableStock < item.quantity) {
        return next(ApiError.badRequest(`Insufficient stock for ${product.name}`));
      }
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];
    let totalCommission = 0;

    for (const item of cart.items) {
      const product = item.productId;
      const price = product.salePrice || product.price;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      // Get vendor commission rate
      const vendor = await Vendor.findById(product.vendorId);
      
      const Setting = require('../models/Setting');
      let globalRate = 10;
      try {
        const settings = await Setting.findOne();
        if (settings) globalRate = settings.globalCommissionRate;
      } catch (e) {}
      
      const rate = vendor?.commissionRate || globalRate;
      const { commissionAmount, vendorEarning } = calcCommission(price, item.quantity, rate);

      orderItems.push({
        productId: product._id,
        variantId: item.variantId,
        vendorId: product.vendorId,
        productName: product.name,
        productImage: product.images[0] || null,
        price,
        quantity: item.quantity,
        commissionRate: rate,
        commissionAmount,
        vendorEarning,
      });

      totalCommission += commissionAmount;
    }

    // Apply coupon
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true, type: 'platform' });
      if (coupon && (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit)) {
        if (subtotal >= coupon.minOrderAmount) {
          discount = coupon.discountType === 'percentage'
            ? subtotal * (coupon.discountValue / 100)
            : coupon.discountValue;
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    }

    const shippingFee = 150;
    const totalAmount = subtotal - discount + shippingFee;

    // Create order
    const order = await Order.create({
      customerId,
      addressId,
      couponId: null, // Store coupon ID if used
      items: orderItems,
      status: 'pending',
      otpVerified: false,
      paymentMethod,
      paymentStatus: 'pending',
      subtotal,
      discount,
      shippingFee,
      totalAmount,
      totalCommission,
    });

    // Create payment
    await Payment.create({
      orderId: order._id,
      method: paymentMethod,
      status: 'pending',
      amount: totalAmount,
    });

    // Decrement stock
    for (const item of cart.items) {
      if (item.variantId) {
        await ProductVariant.findByIdAndUpdate(item.variantId, { $inc: { stock: -item.quantity } });
      } else {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
      }
    }

    // NOTE: Cart is NOT cleared here. It will be cleared after OTP verification.

    // Fetch address to get the phone number for OTP
    const Address = require('../models/Address');
    const shippingAddress = await Address.findById(addressId);
    const destinationPhone = shippingAddress?.phone || req.user.phone || '+923001234567';

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

    await OTP.create({
      customerId,
      orderId: order._id,
      phone: destinationPhone,
      code: otpCode,
      expiresAt,
    });



    // Build professional WhatsApp message with product details
    const orderIdShort = order._id.toString().slice(-8).toUpperCase();
    const deliveryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const addressLine = shippingAddress 
      ? `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.province} ${shippingAddress.postalCode || ''}`
      : 'Your saved address';

    // Build product lines with variant info
    const productLines = [];
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      let line = `${i + 1}. *${item.productName}*`;
      
      // Add variant attributes if present
      if (item.variantId) {
        const variant = await ProductVariant.findById(item.variantId);
        if (variant?.attributes) {
          const attrs = Object.entries(variant.attributes)
            .map(([key, val]) => `${key}: ${val}`)
            .join(' | ');
          line += `\n   🏷️ ${attrs}`;
        }
      }
      
      line += `\n   Qty: ${item.quantity} × PKR ${item.price.toLocaleString()} = PKR ${(item.price * item.quantity).toLocaleString()}`;
      productLines.push(line);
    }

    const whatsappMessage = `🛒 *ShopZone — Order Confirmation*

Hello ${shippingAddress?.fullName || req.user.name}! 👋

Your order has been placed successfully. Please verify it using the OTP below:

🔐 *Your OTP: ${otpCode}*
⏳ Valid for 3 minutes only

━━━━━━━━━━━━━━━━━━
📦 *Order Details*
━━━━━━━━━━━━━━━━━━
🆔 Order ID: #${orderIdShort}

${productLines.join('\n\n')}

━━━━━━━━━━━━━━━━━━
💰 *Price Breakdown*
━━━━━━━━━━━━━━━━━━
Subtotal: PKR ${subtotal.toLocaleString()}${discount > 0 ? `\n🏷️ Discount: -PKR ${discount.toLocaleString()}` : ''}
🚚 Shipping: PKR ${shippingFee.toLocaleString()}
💵 *Total: PKR ${totalAmount.toLocaleString()}*

📍 *Delivery Address*
${shippingAddress?.fullName || req.user.name}
${addressLine}
📞 ${destinationPhone}

🗓️ *Estimated Delivery*
${deliveryDate}

💳 Payment: ${paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod.toUpperCase()}

━━━━━━━━━━━━━━━━━━
⚠️ Do NOT share this OTP with anyone.
Thank you for shopping with ShopZone! 🎉`;

    // Send OTP via WhatsApp
    await sendWhatsApp(destinationPhone, whatsappMessage);

    res.status(201).json({
      success: true,
      data: { orderId: order._id },
      message: 'Order created. OTP sent to your WhatsApp.',
    });
  } catch (error) {
    next(error);
  }
};

// VERIFY OTP (customer)
exports.verifyOTP = async (req, res, next) => {
  try {
    const { orderId, code } = req.body;
    const customerId = req.user._id;

    const otp = await OTP.findOne({ customerId, orderId, used: false }).sort({ createdAt: -1 });

    if (!otp) {
      return next(ApiError.badRequest('OTP not found'));
    }

    if (otp.expiresAt < new Date()) {
      return next(ApiError.badRequest('OTP expired'));
    }

    if (otp.attempts >= 3) {
      return next(ApiError.badRequest('Too many attempts. Request a new OTP.'));
    }

    otp.attempts += 1;

    if (otp.code !== code) {
      await otp.save();
      return next(ApiError.badRequest('Invalid OTP'));
    }

    // Mark OTP as used
    otp.used = true;
    await otp.save();

    // Update order
    const order = await Order.findById(orderId);
    order.otpVerified = true;
    order.status = 'processing';
    await order.save();

    // Now clear the customer's cart since order is confirmed
    const Cart = require('../models/Cart');
    await Cart.findOneAndDelete({ customerId: customerId });

    // Create Commission records
    for (const item of order.items) {
      await Commission.create({
        orderId: order._id,
        vendorId: item.vendorId,
        grossAmount: item.price * item.quantity,
        commissionRate: item.commissionRate,
        commissionAmount: item.commissionAmount,
        netAmount: item.vendorEarning,
        status: 'pending',
      });
    }

    // Send confirmation email
    const user = req.user;
    await sendEmail(
      user.email,
      'Order Confirmed - ShopZone',
      `<h2>Your order #${order._id} is confirmed!</h2><p>We're preparing it for shipment.</p>`
    );

    const { createNotification } = require('../utils/notificationHelper');
    // Notify customer
    await createNotification({
      userId: customerId,
      title: 'Order Confirmed',
      message: `Your order #${order._id.toString().slice(-8).toUpperCase()} has been confirmed.`,
      type: 'order',
      link: `/order/${order._id}`
    });

    // Notify vendors
    const Vendor = require('../models/Vendor');
    const vendorIds = [...new Set(order.items.map(i => i.vendorId.toString()))];
    for (const vId of vendorIds) {
      const vendorRecord = await Vendor.findById(vId);
      if (vendorRecord) {
        await createNotification({
          userId: vendorRecord.userId,
          title: 'New Order Received',
          message: `You have received a new order #${order._id.toString().slice(-8).toUpperCase()}.`,
          type: 'order',
          link: `/vendor/orders/${order._id}`
        });
      }
    }

    res.status(200).json({ success: true, data: { orderId: order._id }, message: 'Order confirmed!' });
  } catch (error) {
    next(error);
  }
};

// RESEND OTP (customer)
exports.resendOTP = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const customerId = req.user._id;

    const lastOTP = await OTP.findOne({ customerId, orderId }).sort({ createdAt: -1 });

    if (lastOTP) {
      const timeSinceLastSent = Date.now() - new Date(lastOTP.lastSentAt).getTime();
      if (timeSinceLastSent < 60000) {
        return next(ApiError.tooMany('Please wait 60 seconds before resending'));
      }
      lastOTP.used = true;
      await lastOTP.save();
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    await OTP.create({
      customerId,
      orderId,
      phone: req.user.phone || '+923001234567',
      code: otpCode,
      expiresAt,
      lastSentAt: Date.now(),
    });

    await sendWhatsApp(
      req.user.phone || '+923001234567',
      `Your ShopZone order OTP: ${otpCode}. Valid 3 min. Do not share.`
    );

    res.status(200).json({ success: true, message: 'New OTP sent' });
  } catch (error) {
    next(error);
  }
};

// GET MY ORDERS (customer)
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// GET ORDER BY ID (customer/vendor/admin)
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('addressId')
      .populate('items.vendorId', 'businessName email phone userId');

    if (!order) {
      return next(ApiError.notFound('Order not found'));
    }

    // Check access
    const isCustomer = order.customerId?._id?.toString() === req.user._id.toString();
    let isVendor = false;
    if (req.user.role === 'vendor') {
      const Vendor = require('../models/Vendor');
      const vendorRecord = await Vendor.findOne({ userId: req.user._id });
      if (vendorRecord) {
        isVendor = order.items.some(i => i.vendorId?._id?.toString() === vendorRecord._id.toString() || i.vendorId?.toString() === vendorRecord._id.toString());
      }
    }
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return next(ApiError.forbidden('Access denied'));
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// GET ALL ORDERS (admin)
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// GET VENDOR ORDERS (vendor)
exports.getVendorOrders = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return next(ApiError.notFound('Vendor not found'));
    }

    const orders = await Order.find({ 'items.vendorId': vendor._id })
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 });

    // Filter to only this vendor's items
    const filtered = orders.map(order => ({
      ...order.toObject(),
      items: order.items.filter(i => i.vendorId.toString() === vendor._id.toString()),
    }));

    res.status(200).json({ success: true, data: filtered });
  } catch (error) {
    next(error);
  }
};

// UPDATE STATUS (admin)
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(ApiError.notFound('Order not found'));
    }

    if (req.user.role === 'vendor' && status !== 'cancelled') {
      return next(ApiError.forbidden('Vendors can only cancel orders'));
    }

    // Removed strict transitions so Admin can freely update statuses if needed
    // The previous allowedTransitions blocked direct updates from pending to shipped, etc.

    if (order.status === 'delivered') {
      return next(ApiError.badRequest('Order is already delivered and cannot be modified directly'));
    }

    order.status = status;

    // Handle delivery - credit vendor
    if (status === 'delivered') {
      order.paymentStatus = 'paid';
      for (const item of order.items) {
        const vendor = await Vendor.findById(item.vendorId);
        if (vendor) {
          vendor.availableBalance += item.vendorEarning;
          vendor.totalEarnings += item.vendorEarning;
          await vendor.save();
        }
      }

      // Settle commissions
      await Commission.updateMany({ orderId: order._id }, { status: 'settled', settledAt: Date.now() });
    }

    // Handle cancellation - restore stock
    if (status === 'cancelled' && order.otpVerified) {
      for (const item of order.items) {
        if (item.variantId) {
          await ProductVariant.findByIdAndUpdate(item.variantId, { $inc: { stock: item.quantity } });
        } else {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
        }
      }

      // Reverse vendor balance
      for (const item of order.items) {
        const vendor = await Vendor.findById(item.vendorId);
        if (vendor) {
          vendor.availableBalance -= item.vendorEarning;
          vendor.totalEarnings -= item.vendorEarning;
          await vendor.save();
        }
      }
    }

    await order.save();

    // Send email notification
    const user = await require('../models/User').findById(order.customerId);
    if (user) {
      await order.populate('items.productId', 'name images');
      let message = `<p>Your order status has been updated to: <strong>${status.toUpperCase()}</strong></p>`;
      
      if (status === 'shipped') {
         message += `<p>Great news! Your order is on its way. Track your package soon.</p>`;
      } else if (status === 'delivered') {
         message += `<p>Your order has been delivered! We hope you love your products.</p>`;
      } else if (status === 'cancelled') {
         const cancelReason = req.body.reason || 'No specific reason provided.';
         message += `<p>Your order has been cancelled.</p><p>Reason: ${cancelReason}</p>`;
      }

      message += `<h3>Order Items:</h3><ul>`;
      order.items.forEach(item => {
        const productName = item.productId ? item.productId.name : 'Unknown Product';
        message += `<li>${productName} - Qty: ${item.quantity} (PKR ${item.price})</li>`;
      });
      message += `</ul><p>Total Amount: PKR ${order.totalAmount}</p>`;

      await sendEmail(user.email, `Order ${status.toUpperCase()} - ShopZone`, message);

      const { createNotification } = require('../utils/notificationHelper');
      await createNotification({
        userId: user._id,
        title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your order #${order._id.toString().slice(-8).toUpperCase()} has been ${status}.`,
        type: 'order',
        link: `/order/${order._id}`
      });
    }

    res.status(200).json({ success: true, data: order, message: 'Order status updated' });
  } catch (error) {
    next(error);
  }
};

// UPDATE FULFILLMENT (admin)
exports.updateFulfillment = async (req, res, next) => {
  try {
    const { trackingNumber } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(ApiError.notFound('Order not found'));
    }

    // Check if can ship
    if (!['processing', 'shipped'].includes(order.status)) {
      return next(ApiError.badRequest('Order cannot be shipped in current status'));
    }

    // Update all items with tracking
    order.items = order.items.map(item => {
      return { ...item, trackingNumber };
    });

    order.status = 'shipped';
    order.trackingNumber = trackingNumber;

    await order.save();

    res.status(200).json({ success: true, data: order, message: 'Fulfillment updated by Admin' });
  } catch (error) {
    next(error);
  }
};
