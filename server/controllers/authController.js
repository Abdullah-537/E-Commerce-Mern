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
    let { name, email, password, phone, role = 'customer' } = req.body;
    email = email?.trim().toLowerCase();

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        return next(ApiError.conflict('Email already registered'));
      }
      // If user exists but not verified, we could resend OTP, but for simplicity, let's just delete the unverified user or overwrite.
      await User.deleteOne({ email });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      role: role === 'vendor' ? 'vendor' : 'customer',
      isVerified: false,
      otp,
      otpExpiry,
    });

    // Send email
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4a90e2; margin: 0;">ShopZone</h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #333333; margin-top: 0;">Welcome to ShopZone!</h2>
          <p style="color: #555555; font-size: 16px; line-height: 1.5;">We are thrilled to have you. Please use the verification code below to complete your registration:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; padding: 15px 30px; font-size: 24px; font-weight: bold; color: #ffffff; background-color: #4a90e2; border-radius: 5px; letter-spacing: 2px;">${otp}</span>
          </div>
          <p style="color: #777777; font-size: 14px; text-align: center;">This code will expire in <strong>10 minutes</strong>.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999999; font-size: 12px;">
          <p>&copy; 2026 ShopZone. All rights reserved.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail(user.email, 'ShopZone - Verify your email', message);
    } catch (err) {
      console.error('Email send error:', err);
      // Even if email fails, we continue (useful for testing with missing credentials)
    }

    const response = new ApiResponse(201, {
      email: user.email,
    }, 'Registration successful. Please check your email for the OTP.');

    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// VERIFY OTP
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    console.log(`[VERIFY OTP] Attempting to verify. Email from request: '${email}', OTP from request: '${otp}'`);

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[VERIFY OTP] User not found for email: '${email}'`);
      return next(ApiError.notFound('User not found'));
    }
    console.log(`[VERIFY OTP] Found user. _id: ${user._id}, isVerified: ${user.isVerified}, db_otp: '${user.otp}', db_otpExpiry: ${user.otpExpiry}, now: ${new Date().toISOString()}`);

    if (user.isVerified) {
      console.log('[VERIFY OTP] Failed: User already verified');
      return next(ApiError.badRequest('User is already verified'));
    }

    if (String(user.otp).trim() !== String(otp).trim()) {
      console.log(`[VERIFY OTP] Failed: OTP mismatch. Expected '${String(user.otp).trim()}', got '${String(otp).trim()}'`);
      return next(ApiError.badRequest('Invalid OTP'));
    }

    if (new Date(user.otpExpiry).getTime() < Date.now()) {
      console.log(`[VERIFY OTP] Failed: OTP expired. Expiry was ${new Date(user.otpExpiry).toISOString()}`);
      return next(ApiError.badRequest('OTP has expired'));
    }

    console.log('[VERIFY OTP] Success! User verified.');

    // Verify user
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    
    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Hash refresh token and save
    const hashedRefresh = await bcrypt.hash(refreshToken, 12);
    user.refreshToken = hashedRefresh;
    await user.save();

    setRefreshCookie(res, refreshToken);

    const response = new ApiResponse(200, {
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      accessToken,
    }, 'Email verified and logged in successfully');

    res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

// LOGIN
exports.login = async (req, res, next) => {
  try {
    let { email, password } = req.body;
    console.log('Login attempt:', { email, passwordLength: password?.length });
    password = password?.trim();
    email = email?.trim().toLowerCase();

    // Find user (case-insensitive)
    const user = await User.findOne({ email: new RegExp('^' + email + '$', 'i') });
    if (!user) {
      console.log('Login failed: user not found');
      return next(ApiError.unauthorized('Invalid credentials: user not found'));
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log('Login failed: password mismatch');
      return next(ApiError.unauthorized('Invalid credentials: password mismatch'));
    }

    if (!user.isVerified) {
      console.log('Login failed: user not verified');
      return next(ApiError.forbidden('Please verify your email address to login.'));
    }

    // Check if vendor is approved
    if (user.role === 'vendor') {
      const vendor = await Vendor.findOne({ userId: user._id });
      if (!vendor || vendor.status === 'banned') {
        return next(ApiError.forbidden('Vendor account is banned or not approved'));
      }
      // Allow pending vendors to login so they can view their status in the dashboard
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4a90e2; margin: 0;">ShopZone</h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #333333; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #555555; font-size: 16px; line-height: 1.5;">We received a request to reset your password. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 15px 30px; font-size: 16px; font-weight: bold; color: #ffffff; background-color: #4a90e2; border-radius: 5px; text-decoration: none;">Reset Password</a>
          </div>
          <p style="color: #777777; font-size: 14px; text-align: center;">This link will expire in <strong>10 minutes</strong>.</p>
          <p style="color: #777777; font-size: 12px; text-align: center; margin-top: 20px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999999; font-size: 12px;">
          <p>&copy; 2026 ShopZone. All rights reserved.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail(user.email, 'ShopZone Password Reset', message);
    } catch (err) {
      // Email send failed silently
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