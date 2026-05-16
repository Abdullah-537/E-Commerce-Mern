const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Stats routes - all admin only
router.get('/stats/overview', protect, roleMiddleware('admin'), adminController.getOverview);
router.get('/stats/revenue', protect, roleMiddleware('admin'), adminController.getRevenue);
router.get('/stats/top-products', protect, roleMiddleware('admin'), adminController.getTopProducts);
router.get('/stats/top-vendors', protect, roleMiddleware('admin'), adminController.getTopVendors);

// Commission settings
router.get('/commission-settings', protect, roleMiddleware('admin'), adminController.getCommissionSettings);
router.put('/commission-settings', protect, roleMiddleware('admin'), adminController.updateCommissionSettings);

module.exports = router;