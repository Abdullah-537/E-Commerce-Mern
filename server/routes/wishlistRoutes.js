const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/', protect, wishlistController.getWishlist);
router.post('/', protect, wishlistController.addItem);
router.delete('/:productId', protect, wishlistController.removeItem);

module.exports = router;
