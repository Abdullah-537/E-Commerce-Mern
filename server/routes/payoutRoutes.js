const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/payoutController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/request', protect, roleMiddleware('vendor'), payoutController.requestPayout);
router.get('/my-payouts', protect, roleMiddleware('vendor'), payoutController.getMyPayouts);
router.get('/', protect, roleMiddleware('admin'), payoutController.getAllPayouts);
router.put('/:id/approve', protect, roleMiddleware('admin'), payoutController.approvePayout);
router.put('/:id/mark-paid', protect, roleMiddleware('admin'), payoutController.markPaid);

module.exports = router;