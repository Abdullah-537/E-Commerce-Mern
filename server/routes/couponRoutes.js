const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/', protect, roleMiddleware('admin'), couponController.createCoupon);
router.get('/', protect, roleMiddleware('admin'), couponController.getAllCoupons);
router.post('/validate', protect, couponController.validateCoupon);
router.delete('/:id', protect, roleMiddleware('admin'), couponController.deleteCoupon);

module.exports = router;