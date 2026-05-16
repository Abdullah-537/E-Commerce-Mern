const Payout = require('../models/Payout');
const Vendor = require('../models/Vendor');
const ApiError = require('../utils/ApiError');

exports.requestPayout = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return next(ApiError.notFound('Vendor not found'));
    }

    if (vendor.availableBalance < 500) {
      return next(ApiError.badRequest('Minimum payout is PKR 500'));
    }

    // Check for pending payout
    const pending = await Payout.findOne({ vendorId: vendor._id, status: 'pending' });
    if (pending) {
      return next(ApiError.conflict('Already has a pending payout'));
    }

    const payout = await Payout.create({
      vendorId: vendor._id,
      amount: vendor.availableBalance,
    });

    // Reset vendor balance
    vendor.availableBalance = 0;
    await vendor.save();

    res.status(201).json({ success: true, data: payout, message: 'Payout requested' });
  } catch (error) {
    next(error);
  }
};

exports.getMyPayouts = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return next(ApiError.notFound('Vendor not found'));
    }

    const payouts = await Payout.find({ vendorId: vendor._id }).sort({ requestedAt: -1 });
    res.status(200).json({ success: true, data: payouts });
  } catch (error) {
    next(error);
  }
};

exports.getAllPayouts = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const payouts = await Payout.find(filter)
      .populate('vendorId', 'businessName')
      .sort({ requestedAt: -1 });

    res.status(200).json({ success: true, data: payouts });
  } catch (error) {
    next(error);
  }
};

exports.approvePayout = async (req, res, next) => {
  try {
    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return next(ApiError.notFound('Payout not found'));
    }

    payout.status = 'approved';
    await payout.save();

    res.status(200).json({ success: true, data: payout, message: 'Payout approved' });
  } catch (error) {
    next(error);
  }
};

exports.markPaid = async (req, res, next) => {
  try {
    const { transactionRef } = req.body;
    const payout = await Payout.findById(req.params.id);

    if (!payout) {
      return next(ApiError.notFound('Payout not found'));
    }

    if (!transactionRef) {
      return next(ApiError.badRequest('Transaction reference required'));
    }

    payout.status = 'paid';
    payout.transactionRef = transactionRef;
    payout.processedAt = Date.now();
    await payout.save();

    res.status(200).json({ success: true, data: payout, message: 'Payout marked as paid' });
  } catch (error) {
    next(error);
  }
};