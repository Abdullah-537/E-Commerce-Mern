const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.post('/addresses', protect, roleMiddleware('customer', 'vendor', 'admin'), userController.addAddress);
router.get('/addresses', protect, roleMiddleware('customer', 'vendor', 'admin'), userController.getAddresses);
router.put('/addresses/:id', protect, roleMiddleware('customer', 'vendor', 'admin'), userController.updateAddress);
router.delete('/addresses/:id', protect, roleMiddleware('customer', 'vendor', 'admin'), userController.deleteAddress);

router.get('/favorite-stores', protect, roleMiddleware('customer', 'vendor', 'admin'), userController.getFavoriteStores);
router.post('/favorite-stores/:id', protect, roleMiddleware('customer', 'vendor', 'admin'), userController.addFavoriteStore);
router.delete('/favorite-stores/:id', protect, roleMiddleware('customer', 'vendor', 'admin'), userController.removeFavoriteStore);

module.exports = router;