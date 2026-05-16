const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/', protect, cartController.getCart);
router.post('/', protect, cartController.addItem);
router.patch('/:productId', protect, cartController.updateQuantity);
router.delete('/:productId', protect, cartController.removeItem);
router.delete('/clear', protect, cartController.clearCart);

module.exports = router;
