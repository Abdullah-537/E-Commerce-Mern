const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');

exports.createCoupon = async (req, res, next) => {
  try {
    const { code, type, vendorId, discountType, discountValue, minOrderAmount, usageLimit, expiresAt } = req.body;

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      type: type || 'platform',
      vendorId: vendorId || null,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      usageLimit,
      expiresAt: new Date(expiresAt),
    });

    res.status(201).json({ success: true, data: coupon, message: 'Coupon created' });
  } catch (error) {
    next(error);
  }
};

exports.getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
};

exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return next(ApiError.notFound('Invalid coupon'));
    }

    if (new Date(coupon.expiresAt) < new Date()) {
      return next(ApiError.badRequest('Coupon expired'));
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return next(ApiError.badRequest('Coupon usage limit reached'));
    }

    if (subtotal < coupon.minOrderAmount) {
      return next(ApiError.badRequest(`Minimum order amount: PKR ${coupon.minOrderAmount}`));
    }

    const discount = coupon.discountType === 'percentage'
      ? subtotal * (coupon.discountValue / 100)
      : coupon.discountValue;

    res.status(200).json({
      success: true,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount: Math.min(discount, subtotal),
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return next(ApiError.notFound('Coupon not found'));
    }
    res.status(200).json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};