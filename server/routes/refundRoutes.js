const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refundController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/', protect, roleMiddleware('customer'), refundController.requestRefund);
router.get('/', protect, roleMiddleware('admin'), refundController.getAllRefunds);
router.get('/vendor', protect, roleMiddleware('vendor'), refundController.getVendorRefunds);
router.put('/:id/approve', protect, roleMiddleware('admin', 'vendor'), refundController.approveRefund);
router.put('/:id/reject', protect, roleMiddleware('admin', 'vendor'), refundController.rejectRefund);
router.put('/:id/mark-refunded', protect, roleMiddleware('admin'), refundController.markRefunded);

module.exports = router;