const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const vendorController = require('../controllers/vendorController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public: vendor storefront
router.get('/store/:slug', vendorController.getStorefront);

// Vendor registration
router.post('/register', [
  body('businessName').trim().isLength({ min: 3, max: 100 }),
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('bankName').notEmpty(),
  body('accountNumber').isLength({ min: 6 }),
], vendorController.register);

// All routes below require auth
router.use(protect);

// Vendor: get own profile
router.get('/profile', roleMiddleware('vendor'), vendorController.getProfile);

// Vendor: update own profile
router.put('/profile', roleMiddleware('vendor'), vendorController.updateProfile);

// Admin: get all vendors
router.get('/', roleMiddleware('admin'), vendorController.getAllVendors);

// Admin: get single vendor
router.get('/:id', roleMiddleware('admin', 'vendor'), vendorController.getVendorById);

// Admin: approve vendor
router.put('/:id/approve', roleMiddleware('admin'), vendorController.approveVendor);

// Admin: ban vendor
router.put('/:id/ban', roleMiddleware('admin'), vendorController.banVendor);

// Admin: set commission rate
router.put('/:id/commission', roleMiddleware('admin'), vendorController.setCommission);

// Vendor: get earnings
router.get('/:id/earnings', roleMiddleware('admin', 'vendor'), vendorController.getEarnings);

module.exports = router;