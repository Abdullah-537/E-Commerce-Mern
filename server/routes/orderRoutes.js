const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Customer: create order
router.post('/', protect, orderController.createOrder);

// Customer: verify OTP
router.post('/verify-otp', protect, orderController.verifyOTP);

// Customer: resend OTP
router.post('/resend-otp', protect, orderController.resendOTP);

// Customer: my orders
router.get('/my-orders', protect, orderController.getMyOrders);

// Customer/vendor/admin: order detail
router.get('/:id', protect, orderController.getOrderById);

// Admin: all orders
router.get('/', protect, roleMiddleware('admin'), orderController.getAllOrders);

// Vendor: vendor orders
router.get('/vendor/orders', protect, roleMiddleware('vendor'), orderController.getVendorOrders);

// Admin: update order status
router.put('/:id/status', protect, roleMiddleware('admin'), orderController.updateStatus);

// Vendor: update fulfillment
router.put('/:id/fulfillment', protect, roleMiddleware('vendor'), orderController.updateFulfillment);

module.exports = router;
