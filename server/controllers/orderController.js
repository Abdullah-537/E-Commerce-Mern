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
    
    // Build order items HTML for email
    await order.populate('items.productId', 'name images');
    let itemsHtml = '';
    order.items.forEach(item => {
      const imgUrl = item.productId?.images?.[0] || 'https://via.placeholder.com/60';
      itemsHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">
            <img src="${imgUrl}" alt="${item.productName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;" />
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">
            <strong>${item.productName}</strong><br/>
            <span style="color: #888;">Qty: ${item.quantity}</span>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;">
            <strong>PKR ${(item.price * item.quantity).toLocaleString()}</strong>
          </td>
        </tr>
      `;
    });

    const emailHtml = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; background-color: #f4f7f6;">
        <div style="background-color: #1a202c; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">Shop<span style="color: #3182ce;">Zone</span></h1>
          <p style="color: #a0aec0; margin-top: 10px; font-size: 16px;">Order Confirmation</p>
        </div>
        <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #2d3748; margin-top: 0; text-align: center; font-size: 24px;">Thank you for your order! 🎉</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; text-align: center;">Hi ${user.name || 'Valued Customer'},</p>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; text-align: center;">We've received your order and our vendors are getting it ready for shipment.</p>
          
          <div style="margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #ebf8ff 0%, #e6fffa 100%); border-radius: 8px; border-left: 4px solid #3182ce;">
            <p style="margin: 0 0 10px 0; color: #2b6cb0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;"><strong>Order Reference</strong></p>
            <p style="margin: 0; color: #2d3748; font-size: 20px; font-weight: bold;">#${order._id.toString().slice(-8).toUpperCase()}</p>
            <p style="margin: 10px 0 0 0; color: #2d3748; font-size: 18px;">Total: <strong>PKR ${order.totalAmount.toLocaleString()}</strong></p>
          </div>

          <h3 style="color: #2d3748; border-bottom: 2px solid #edf2f7; padding-bottom: 10px; margin-top: 30px;">Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            ${itemsHtml}
          </table>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/orders/${order._id}/track" style="display: inline-block; padding: 14px 30px; font-size: 16px; font-weight: bold; color: #ffffff; background-color: #3182ce; border-radius: 6px; text-decoration: none; box-shadow: 0 4px 6px rgba(49, 130, 206, 0.25); transition: background-color 0.3s;">View Order Status</a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #a0aec0; font-size: 12px;">
          <p style="margin: 0;">&copy; 2026 ShopZone. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Need help? Reply to this email.</p>
        </div>
      </div>
    `;

    // Send customer confirmation email (await so Render doesn't kill it)
    try {
      await sendEmail(user.email, `Order Confirmed #${order._id.toString().slice(-8).toUpperCase()} - ShopZone`, emailHtml);
      console.log('[ORDER] Customer email sent to:', user.email);
    } catch (emailErr) {
      console.error('[ORDER] Customer email FAILED:', emailErr.message);
    }

    const { createNotification } = require('../utils/notificationHelper');
    try {
      await createNotification({
        userId: customerId,
        title: 'Order Confirmed',
        message: `Your order #${order._id.toString().slice(-8).toUpperCase()} has been confirmed.`,
        type: 'order',
        link: `/orders/${order._id}/track`
      });
    } catch (e) { console.error('[ORDER] Notification failed:', e.message); }

    // Notify vendors in background (await so Render doesn't kill it)
    const Vendor = require('../models/Vendor');
    const vendorIds = [...new Set(order.items.map(i => i.vendorId.toString()))];
    for (const vId of vendorIds) {
      try {
        const vendorRecord = await Vendor.findById(vId).populate('userId', 'email name');
        if (!vendorRecord) continue;

        try {
          await createNotification({
            userId: vendorRecord.userId._id || vendorRecord.userId,
            title: 'New Order Received',
            message: `You have received a new order #${order._id.toString().slice(-8).toUpperCase()}.`,
            type: 'order',
            link: `/vendor/orders/${order._id}`
          });
        } catch (notifErr) { console.error('[ORDER] Vendor notification failed:', notifErr.message); }

        // Build vendor specific email items
        const vendorItems = order.items.filter(i => i.vendorId.toString() === vId);
        let vendorItemsHtml = '';
        let vendorEarningTotal = 0;
        
        vendorItems.forEach(item => {
          const imgUrl = item.productImage || 'https://via.placeholder.com/60';
          vendorEarningTotal += item.vendorEarning;
          vendorItemsHtml += `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">
                <img src="${imgUrl}" alt="${item.productName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;" />
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">
                <strong>${item.productName}</strong><br/>
                <span style="color: #888;">Qty: ${item.quantity}</span>
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;">
                <strong>PKR ${(item.vendorEarning).toLocaleString()}</strong>
              </td>
            </tr>
          `;
        });

        const vendorEmailHtml = `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; background-color: #f4f7f6;">
            <div style="background-color: #1a202c; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Order Received! 🛍️</h1>
            </div>
            <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <p style="color: #4a5568; font-size: 16px;">Hello <strong>${vendorRecord.businessName}</strong>,</p>
              <p style="color: #4a5568; font-size: 16px;">Great news! Your product has just been ordered by <strong>${user.name || 'a customer'}</strong> on ShopZone.</p>
              
              <div style="margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%); border-radius: 8px; border-left: 4px solid #38a169;">
                <p style="margin: 0 0 10px 0; color: #276749; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;"><strong>Order ID: #${order._id.toString().slice(-8).toUpperCase()}</strong></p>
                <p style="margin: 0; color: #2d3748; font-size: 18px;">Your Earnings: <strong>PKR ${vendorEarningTotal.toLocaleString()}</strong></p>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                ${vendorItemsHtml}
              </table>
              
              <div style="text-align: center; margin-top: 40px;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/vendor/orders/${order._id}" style="display: inline-block; padding: 14px 30px; font-size: 16px; font-weight: bold; color: #ffffff; background-color: #38a169; border-radius: 6px; text-decoration: none;">Process Order</a>
              </div>
            </div>
          </div>
        `;

        const targetEmail = vendorRecord.businessEmail || vendorRecord.userId?.email;
        if (targetEmail) {
          try {
            await sendEmail(targetEmail, `New Order Received #${order._id.toString().slice(-8).toUpperCase()} - ShopZone`, vendorEmailHtml);
            console.log('[ORDER] Vendor email sent to:', targetEmail);
          } catch (vendorEmailErr) {
            console.error('[ORDER] Vendor email FAILED:', vendorEmailErr.message);
          }
        }
      } catch (err) {
        console.error('[ORDER] Vendor processing failed:', err.message);
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
    const orders = await Order.find({ customerId: req.user._id })
      .populate('addressId')
      .sort({ createdAt: -1 });
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
      let itemsHtml = '';
      order.items.forEach(item => {
        const imgUrl = item.productId?.images?.[0] || 'https://via.placeholder.com/60';
        itemsHtml += `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">
              <img src="${imgUrl}" alt="${item.productName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;" />
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">
              <strong>${item.productName}</strong><br/>
              <span style="color: #888;">Qty: ${item.quantity}</span>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;">
              <strong>PKR ${(item.price * item.quantity).toLocaleString()}</strong>
            </td>
          </tr>
        `;
      });

      let statusMessage = '';
      let headerColor = '#4a90e2';
      let title = `Order ${status.toUpperCase()}`;
      
      if (status === 'shipped') {
         statusMessage = `Great news! Your order is on its way.`;
      } else if (status === 'delivered') {
         statusMessage = `Your order has been delivered! We hope you love your products.`;
         headerColor = '#28a745';
         title = 'Order Delivered! 🎉';
      } else if (status === 'cancelled') {
         const cancelReason = req.body.reason || 'No specific reason provided.';
         statusMessage = `Your order has been cancelled. Reason: ${cancelReason}`;
         headerColor = '#dc3545';
         title = 'Order Cancelled';
      } else {
         statusMessage = `Your order status has been updated to: <strong>${status.toUpperCase()}</strong>`;
      }

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px; background-color: #f9f9f9;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: ${headerColor}; margin: 0;">ShopZone</h1>
          </div>
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #333333; margin-top: 0; text-align: center;">${title}</h2>
            <p style="color: #555555; font-size: 16px; line-height: 1.5; text-align: center;">${statusMessage}</p>
            
            <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
              <p style="margin: 0; color: #333;"><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
              <p style="margin: 5px 0 0 0; color: #333;"><strong>Total Amount:</strong> PKR ${order.totalAmount.toLocaleString()}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              ${itemsHtml}
            </table>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/orders/${order._id}/track" style="display: inline-block; padding: 12px 25px; font-size: 16px; font-weight: bold; color: #ffffff; background-color: ${headerColor}; border-radius: 5px; text-decoration: none;">Track Order</a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999999; font-size: 12px;">
            <p>&copy; 2026 ShopZone. All rights reserved.</p>
          </div>
        </div>
      `;

      try {
        await sendEmail(user.email, `Order ${status.toUpperCase()} - ShopZone`, emailHtml);
      } catch (err) {
        console.error('Failed to send status update email:', err);
      }

      const { createNotification } = require('../utils/notificationHelper');
      await createNotification({
        userId: user._id,
        title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your order #${order._id.toString().slice(-8).toUpperCase()} has been ${status}.`,
        type: 'order',
        link: `/orders/${order._id}/track`
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
