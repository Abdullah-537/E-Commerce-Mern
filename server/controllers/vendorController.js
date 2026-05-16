const bcrypt = require('bcryptjs');
const slugify = require('slugify');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Order = require('../models/Order');
const Commission = require('../models/Commission');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// REGISTER VENDOR
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, businessName, businessEmail, businessPhone, bankName, accountNumber, accountTitle } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(ApiError.conflict('Email already registered'));
    }

    // Create user
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      role: 'vendor',
    });

    // Create vendor with pending status
    const slug = slugify(businessName, { lower: true, strict: true }) + '-' + Date.now();
    const commissionRate = parseInt(process.env.COMMISSION_RATE) || 10;

    const vendor = await Vendor.create({
      userId: user._id,
      businessName,
      slug,
      businessEmail,
      businessPhone,
      bankName,
      accountNumber,
      accountTitle,
      status: 'pending',
      commissionRate,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    const hashedRefresh = await bcrypt.hash(refreshToken, 12);
    user.refreshToken = hashedRefresh;
    await user.save();

    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Vendor registration submitted. Pending approval.',
      data: {
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
        vendor: { _id: vendor._id, businessName: vendor.businessName, status: vendor.status },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET VENDOR PROFILE (vendor only)
exports.getProfile = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return next(ApiError.notFound('Vendor profile not found'));
    }
    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

// UPDATE VENDOR PROFILE (vendor only)
exports.updateProfile = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return next(ApiError.notFound('Vendor not found'));
    }

    const { businessName, description, businessEmail, businessPhone, returnPolicy, shippingPolicy, isOpen } = req.body;

    if (businessName) {
      vendor.businessName = businessName;
      vendor.slug = slugify(businessName, { lower: true, strict: true }) + '-' + Date.now();
    }
    if (description) vendor.description = description;
    if (businessEmail) vendor.businessEmail = businessEmail;
    if (businessPhone) vendor.businessPhone = businessPhone;
    if (returnPolicy) vendor.returnPolicy = returnPolicy;
    if (shippingPolicy) vendor.shippingPolicy = shippingPolicy;
    if (isOpen !== undefined) vendor.isOpen = isOpen;

    await vendor.save();
    res.status(200).json({ success: true, data: vendor, message: 'Profile updated' });
  } catch (error) {
    next(error);
  }
};

// GET ALL VENDORS (admin)
exports.getAllVendors = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const vendors = await Vendor.find(filter).populate('userId', 'name email phone').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: vendors });
  } catch (error) {
    next(error);
  }
};

// GET VENDOR BY ID (admin or vendor)
exports.getVendorById = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('userId', 'name email phone avatar');
    if (!vendor) {
      return next(ApiError.notFound('Vendor not found'));
    }

    // Vendor can only view their own profile
    if (req.user.role === 'vendor') {
      const myVendor = await Vendor.findOne({ userId: req.user._id });
      if (myVendor._id.toString() !== req.params.id) {
        return next(ApiError.forbidden('Access denied'));
      }
    }

    // Get stats
    const orderCount = await Order.countDocuments({ 'items.vendorId': vendor._id });
    const totalSales = await Commission.aggregate([
      { $match: { vendorId: vendor._id, status: 'settled' } },
      { $group: { _id: null, total: { $sum: '$grossAmount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...vendor.toObject(),
        stats: {
          productCount: 0, // Will be derived from products
          orderCount,
          totalSales: totalSales[0]?.total || 0,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// APPROVE VENDOR (admin)
exports.approveVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return next(ApiError.notFound('Vendor not found'));
    }

    vendor.status = 'approved';
    await vendor.save();

    res.status(200).json({ success: true, data: vendor, message: 'Vendor approved' });
  } catch (error) {
    next(error);
  }
};

// BAN VENDOR (admin)
exports.banVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return next(ApiError.notFound('Vendor not found'));
    }

    vendor.status = 'banned';
    await vendor.save();

    res.status(200).json({ success: true, message: 'Vendor banned' });
  } catch (error) {
    next(error);
  }
};

// SET COMMISSION (admin)
exports.setCommission = async (req, res, next) => {
  try {
    const { commissionRate } = req.body;
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return next(ApiError.notFound('Vendor not found'));
    }

    vendor.commissionRate = commissionRate;
    await vendor.save();

    res.status(200).json({ success: true, data: vendor, message: 'Commission rate updated' });
  } catch (error) {
    next(error);
  }
};

// GET EARNINGS (vendor or admin)
exports.getEarnings = async (req, res, next) => {
  try {
    const vendorId = req.params.id;

    // Verify access
    if (req.user.role === 'vendor') {
      const myVendor = await Vendor.findOne({ userId: req.user._id });
      if (myVendor._id.toString() !== vendorId) {
        return next(ApiError.forbidden('Access denied'));
      }
    }

    const commissions = await Commission.find({ vendorId }).sort({ createdAt: -1 });
    const totalEarnings = commissions.reduce((sum, c) => sum + c.netAmount, 0);
    const pendingCommission = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionAmount, 0);
    const settledCommission = commissions.filter(c => c.status === 'settled').reduce((sum, c) => sum + c.commissionAmount, 0);

    res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        pendingCommission,
        settledCommission,
        availableBalance: (await Vendor.findById(vendorId))?.availableBalance || 0,
        history: commissions,
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET STOREFRONT (public)
exports.getStorefront = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ slug: req.params.slug, status: 'approved', isOpen: true });
    if (!vendor) {
      return next(ApiError.notFound('Store not found'));
    }

    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};