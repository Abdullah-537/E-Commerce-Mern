const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/vendor', protect, roleMiddleware('vendor'), reviewController.getVendorReviews);

module.exports = router;
