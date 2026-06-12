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
    let { name, email, password, phone, businessName, businessEmail, businessPhone, bankName, accountNumber, accountTitle } = req.body;
    email = email?.trim().toLowerCase();
    businessEmail = businessEmail?.trim().toLowerCase();

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        return next(ApiError.conflict('Email already registered'));
      }
      await User.deleteOne({ email });
      await Vendor.deleteOne({ userId: existingUser._id });
    }

    // Create user
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      role: 'vendor',
      isVerified: false,
      otp,
      otpExpiry,
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

    // Send email
    const sendEmail = require('../utils/sendEmail');
    const message = `
      <h2>Welcome to ShopZone Vendor Portal!</h2>
      <p>Your verification code is: <strong>${otp}</strong></p>
      <p>This code will expire in 10 minutes.</p>
    `;
    await sendEmail(user.email, 'ShopZone - Verify Your Vendor Account', message);

    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@shopzone.pk';
    const adminMessage = `
      <h2>New Vendor Registration</h2>
      <p>A new vendor has registered and is awaiting approval.</p>
      <p><strong>Business Name:</strong> ${businessName}</p>
      <p><strong>Email:</strong> ${businessEmail}</p>
    `;
    await sendEmail(adminEmail, 'New Vendor Registration - ShopZone', adminMessage);

    const { createNotification } = require('../utils/notificationHelper');
    await createNotification({
      title: 'New Vendor Registration',
      message: `${businessName} has registered and is awaiting approval.`,
      type: 'vendor',
      link: '/admin/vendors'
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for the OTP.',
      data: { email: user.email },
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

    const { businessName, description, businessEmail, businessPhone, returnPolicy, shippingPolicy, isOpen, logo, banner } = req.body;

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
    if (logo !== undefined) vendor.logo = logo;
    if (banner !== undefined) vendor.banner = banner;

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

    const { createNotification } = require('../utils/notificationHelper');
    await createNotification({
      userId: vendor.userId,
      title: 'Vendor Account Approved',
      message: `Congratulations! Your vendor account ${vendor.businessName} has been approved. You can now start adding products.`,
      type: 'vendor',
      link: '/vendor'
    });

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

    const { createNotification } = require('../utils/notificationHelper');
    await createNotification({
      userId: vendor.userId,
      title: 'Vendor Account Banned',
      message: `Your vendor account ${vendor.businessName} has been banned. Please contact support.`,
      type: 'vendor',
      link: '/contact'
    });

    res.status(200).json({ success: true, message: 'Vendor banned' });
  } catch (error) {
    next(error);
  }
};

// REJECT VENDOR (admin)
exports.rejectVendor = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const vendor = await Vendor.findById(req.params.id).populate('userId');
    if (!vendor) {
      return next(ApiError.notFound('Vendor not found'));
    }

    if (!reason) {
      return next(ApiError.badRequest('Rejection reason is required'));
    }

    vendor.status = 'rejected';
    await vendor.save();

    const sendEmail = require('../utils/sendEmail');
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #d9534f; margin: 0;">ShopZone</h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #333333; margin-top: 0;">Application Update</h2>
          <p style="color: #555555; font-size: 16px; line-height: 1.5;">We have reviewed your vendor application for <strong>${vendor.businessName}</strong>. Unfortunately, your application has been rejected.</p>
          <div style="margin: 30px 0; padding: 15px; background-color: #f8d7da; border-left: 4px solid #d9534f; color: #721c24;">
            <strong>Reason:</strong> ${reason}
          </div>
          <p style="color: #777777; font-size: 14px;">If you have any questions or wish to appeal this decision, please contact our support team.</p>
        </div>
      </div>
    `;
    await sendEmail(vendor.userId.email, 'Vendor Application Update - ShopZone', message);

    const { createNotification } = require('../utils/notificationHelper');
    await createNotification({
      userId: vendor.userId._id,
      title: 'Vendor Application Rejected',
      message: `Your vendor application for ${vendor.businessName} was rejected. Reason: ${reason}`,
      type: 'vendor',
      link: '/contact'
    });

    res.status(200).json({ success: true, message: 'Vendor rejected' });
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

    const commissions = await Commission.find({ vendorId })
      .populate('orderId', 'items createdAt _id')
      .sort({ createdAt: -1 });
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
    const isObjectId = require('mongoose').Types.ObjectId.isValid(req.params.slug);
    const query = { status: 'approved' };
    
    if (isObjectId) {
      query.$or = [{ slug: req.params.slug }, { _id: req.params.slug }];
    } else {
      query.slug = req.params.slug;
    }

    const vendor = await Vendor.findOne(query);
    if (!vendor) {
      return next(ApiError.notFound('Store not found'));
    }

    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

// GET VENDOR BY ID (public - for vendor store page)
exports.getPublicVendorById = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('userId', 'name avatar');
    if (!vendor || vendor.status !== 'approved') {
      return next(ApiError.notFound('Vendor not found'));
    }

    res.status(200).json({
      success: true,
      data: {
        _id: vendor._id,
        businessName: vendor.businessName,
        description: vendor.description,
        logo: vendor.logo,
        businessAddress: vendor.businessAddress,
        rating: vendor.rating,
        ratingCount: vendor.ratingCount,
        isOpen: vendor.isOpen,
      }
    });
  } catch (error) {
    next(error);
  }
};

// RATE VENDOR (customer)
exports.rateVendor = async (req, res, next) => {
  try {
    const { rating } = req.body;
    const vendorId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
      return next(ApiError.badRequest('Rating must be between 1 and 5'));
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return next(ApiError.notFound('Vendor not found'));
    }

    // Must have ordered and received from this vendor
    const hasOrder = await Order.findOne({
      customerId: req.user._id,
      'items.vendorId': vendor._id,
      status: 'delivered'
    });

    if (!hasOrder) {
      return next(ApiError.forbidden('You must have purchased and received an item from this vendor to leave a rating.'));
    }

    // Check if already rated
    const existingRatingIndex = vendor.ratings.findIndex(r => r.customerId.toString() === req.user._id.toString());
    
    if (existingRatingIndex >= 0) {
      return next(ApiError.conflict('You have already submitted a rating for this vendor.'));
    }

    // Add rating
    vendor.ratings.push({ customerId: req.user._id, rating });

    // Recalculate average
    const totalRating = vendor.ratings.reduce((sum, r) => sum + r.rating, 0);
    vendor.rating = parseFloat((totalRating / vendor.ratings.length).toFixed(1));
    vendor.reviewCount = vendor.ratings.length;

    await vendor.save();

    res.status(200).json({ success: true, message: 'Rating submitted successfully', data: { rating: vendor.rating, reviewCount: vendor.reviewCount } });
  } catch (error) {
    next(error);
  }
};

// REPORT VENDOR (customer)
exports.reportVendor = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const vendorId = req.params.id;

    if (!reason || reason.trim() === '') {
      return next(ApiError.badRequest('Reason is required'));
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return next(ApiError.notFound('Vendor not found'));
    }

    const Complaint = require('../models/Complaint');
    const complaint = await Complaint.create({
      customerId: req.user._id,
      vendorId: vendor._id,
      reason,
    });

    // Notify admin
    const sendEmail = require('../utils/sendEmail');
    await sendEmail(process.env.ADMIN_EMAIL || 'admin@shopzone.pk', 'New Vendor Complaint', `A customer has reported vendor ${vendor.businessName}. Reason: ${reason}`);
    
    const { createNotification } = require('../utils/notificationHelper');
    await createNotification({
      title: 'New Vendor Complaint',
      message: `A customer has reported vendor ${vendor.businessName}.`,
      type: 'complaint',
      link: '/admin/complaints'
    });

    res.status(201).json({ success: true, message: 'Vendor reported successfully', data: complaint });
  } catch (error) {
    next(error);
  }
};