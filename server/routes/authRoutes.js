const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Validation rules
const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password min 8 characters'),
  body('phone').optional().matches(/^(\+92|03)\d{9}$/).withMessage('Invalid Pakistan phone format'),
];

const loginValidation = [
  body('email').isEmail(),
  body('password').notEmpty(),
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/verify-otp', authController.verifyOtp);
router.post('/login', loginValidation, authController.login);
router.post('/logout', protect, authController.logout);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Firebase OAuth Login
router.post('/firebase', authController.firebaseLogin);

module.exports = router;