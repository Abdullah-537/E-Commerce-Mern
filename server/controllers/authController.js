const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// Helper: set cookie
const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// REGISTER
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role = 'customer' } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(ApiError.conflict('Email already registered'));
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      role: role === 'vendor' ? 'vendor' : 'customer',
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Hash refresh token and save
    const hashedRefresh = await bcrypt.hash(refreshToken, 12);
    user.refreshToken = hashedRefresh;
    await user.save();

    setRefreshCookie(res, refreshToken);

    const response = new ApiResponse(201, {
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      accessToken,
    }, 'Registration successful');

    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// LOGIN
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return next(ApiError.unauthorized('Invalid credentials'));
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return next(ApiError.unauthorized('Invalid credentials'));
    }

    // Check if vendor is approved
    if (user.role === 'vendor') {
      const vendor = await Vendor.findOne({ userId: user._id });
      if (!vendor || vendor.status === 'banned') {
        return next(ApiError.forbidden('Vendor account is banned or not approved'));
      }
      if (vendor.status === 'pending') {
        return next(ApiError.forbidden('Vendor account is pending approval'));
      }
    }

    if (!user.isActive) {
      return next(ApiError.forbidden('Account is deactivated'));
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Hash and save refresh token
    const hashedRefresh = await bcrypt.hash(refreshToken, 12);
    user.refreshToken = hashedRefresh;
    await user.save();

    setRefreshCookie(res, refreshToken);

    // Get vendor info if vendor
    let vendorInfo = null;
    if (user.role === 'vendor') {
      vendorInfo = await Vendor.findOne({ userId: user._id });
    }

    const response = new ApiResponse(200, {
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar },
      vendor: vendorInfo,
      accessToken,
    }, 'Login successful');

    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// LOGOUT
exports.logout = async (req, res, next) => {
  try {
    req.user.refreshToken = null;
    await req.user.save();

    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out' });
  } catch (error) {
    next(error);
  }
};

// REFRESH TOKEN
exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return next(ApiError.unauthorized('No refresh token'));
    }

    // Find user with this token
    const user = await User.findOne({
      refreshToken: { $ne: null }
    }).or([]);

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (e) {
      return next(ApiError.unauthorized('Invalid refresh token'));
    }

    const foundUser = await User.findById(decoded.userId);
    if (!foundUser || !foundUser.refreshToken) {
      return next(ApiError.unauthorized('User not found or logged out'));
    }

    // Verify stored hash
    const isValid = await bcrypt.compare(token, foundUser.refreshToken);
    if (!isValid) {
      return next(ApiError.unauthorized('Invalid refresh token'));
    }

    // Generate new access token
    const accessToken = generateAccessToken(foundUser._id, foundUser.role);

    res.status(200).json({ accessToken });
  } catch (error) {
    next(error);
  }
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: 'If email exists, reset link sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const message = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link expires in 10 minutes.</p>
    `;

    try {
      await sendEmail(user.email, 'ShopZone Password Reset', message);
    } catch (err) {
      console.log('Email send failed:', err.message);
    }

    res.status(200).json({ message: 'If email exists, reset link sent' });
  } catch (error) {
    next(error);
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return next(ApiError.badRequest('Invalid or expired token'));
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

// FIREBASE LOGIN
exports.firebaseLogin = async (req, res, next) => {
  try {
    const { token, role = 'customer' } = req.body;
    if (!token) {
      return next(ApiError.badRequest('No Firebase token provided'));
    }

    const admin = require('../utils/firebase');
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { email, name, picture, uid } = decodedToken;

    let user = await User.findOne({ email });
    if (!user) {
      // Register them
      user = await User.create({
        name: name || 'Google User',
        email,
        passwordHash: uid, // Use uid as a fallback hash
        googleId: uid,
        avatar: picture || null,
        role: role === 'vendor' ? 'vendor' : 'customer',
        isVerified: true
      });
    } else {
      // Update avatar from Google if not already set
      if (picture && !user.avatar) {
        user.avatar = picture;
      }
      if (uid && !user.googleId) {
        user.googleId = uid;
      }
      await user.save();
    }

    // Check if vendor is approved
    if (user.role === 'vendor') {
      const vendor = await Vendor.findOne({ userId: user._id });
      if (vendor && vendor.status === 'banned') {
        return next(ApiError.forbidden('Vendor account is banned'));
      }
    }

    if (!user.isActive) {
      return next(ApiError.forbidden('Account is deactivated'));
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Hash and save refresh token
    const hashedRefresh = await bcrypt.hash(refreshToken, 12);
    user.refreshToken = hashedRefresh;
    await user.save();

    setRefreshCookie(res, refreshToken);

    let vendorInfo = null;
    if (user.role === 'vendor') {
      vendorInfo = await Vendor.findOne({ userId: user._id });
    }

    const response = new ApiResponse(200, {
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar },
      vendor: vendorInfo,
      accessToken,
    }, 'Firebase Login successful');

    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};