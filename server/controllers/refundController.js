const mongoose = require('mongoose');
const Refund = require('../models/Refund');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const sendEmail = require('../utils/sendEmail');
const ApiError = require('../utils/ApiError');

exports.requestRefund = async (req, res, next) => {
  try {
    const { orderId, reason } = req.body;
    const customerId = req.user._id;

    const order = await Order.findById(orderId);
    if (!order) {
      return next(ApiError.notFound('Order not found'));
    }

    if (order.customerId.toString() !== customerId.toString()) {
      return next(ApiError.forbidden('Not authorized'));
    }

    if (order.status !== 'delivered') {
      return next(ApiError.badRequest('Can only refund delivered orders'));
    }

    // Check if delivered within 7 days
    const deliveredAt = new Date(order.updatedAt);
    const daysSinceDelivery = (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7) {
      return next(ApiError.badRequest('Refund window expired (7 days)'));
    }

    // Find vendor from first item
    const vendorId = order.items[0]?.vendorId;
    if (!vendorId) {
      return next(ApiError.badRequest('Invalid order'));
    }

    const refund = await Refund.create({
      orderId,
      customerId,
      vendorId,
      reason,
      amount: order.totalAmount,
    });

    res.status(201).json({ success: true, data: refund, message: 'Refund requested' });
  } catch (error) {
    next(error);
  }
};

exports.getAllRefunds = async (req, res, next) => {
  try {
    const refunds = await Refund.find().populate('orderId customerId vendorId').sort({ requestedAt: -1 });
    res.status(200).json({ success: true, data: refunds });
  } catch (error) {
    next(error);
  }
};

exports.getVendorRefunds = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return next(ApiError.notFound('Vendor not found'));
    }

    const refunds = await Refund.find({ vendorId: vendor._id })
      .populate('orderId customerId')
      .sort({ requestedAt: -1 });

    res.status(200).json({ success: true, data: refunds });
  } catch (error) {
    next(error);
  }
};

exports.approveRefund = async (req, res, next) => {
  try {
    const { adminNote } = req.body;
    const refund = await Refund.findById(req.params.id);

    if (!refund) {
      return next(ApiError.notFound('Refund not found'));
    }

    refund.status = 'approved';
    refund.adminNote = adminNote;
    refund.resolvedAt = Date.now();
    await refund.save();

    // Update order
    await Order.findByIdAndUpdate(refund.orderId, { paymentStatus: 'refunded' });

    // Notify customer
    const User = require('../models/User');
    const user = await User.findById(refund.customerId);
    if (user) {
      await sendEmail(user.email, 'Refund Approved - ShopZone', `<p>Your refund of PKR ${refund.amount} has been approved.</p>`);
    }

    res.status(200).json({ success: true, data: refund, message: 'Refund approved' });
  } catch (error) {
    next(error);
  }
};

exports.rejectRefund = async (req, res, next) => {
  try {
    const { adminNote } = req.body;
    const refund = await Refund.findById(req.params.id);

    if (!refund) {
      return next(ApiError.notFound('Refund not found'));
    }

    refund.status = 'rejected';
    refund.adminNote = adminNote;
    refund.resolvedAt = Date.now();
    await refund.save();

    res.status(200).json({ success: true, data: refund, message: 'Refund rejected' });
  } catch (error) {
    next(error);
  }
};