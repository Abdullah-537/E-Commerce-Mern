const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.put('/profile/password', protect, userController.updatePassword);
router.post('/addresses', protect, roleMiddleware('customer', 'vendor', 'admin'), userController.addAddress);
router.get('/addresses', protect, roleMiddleware('customer', 'vendor', 'admin'), userController.getAddresses);
router.put('/addresses/:id', protect, roleMiddleware('customer', 'vendor', 'admin'), userController.updateAddress);
router.delete('/addresses/:id', protect, roleMiddleware('customer', 'vendor', 'admin'), userController.deleteAddress);

router.get('/favorite-stores', protect, roleMiddleware('customer', 'vendor', 'admin'), userController.getFavoriteStores);
router.post('/favorite-stores/:id', protect, roleMiddleware('customer', 'vendor', 'admin'), userController.addFavoriteStore);
router.delete('/favorite-stores/:id', protect, roleMiddleware('customer', 'vendor', 'admin'), userController.removeFavoriteStore);

// Admin operations on users
router.get('/:id', protect, roleMiddleware('admin'), userController.getUserById);
router.put('/:id/ban', protect, roleMiddleware('admin'), userController.banUser);
router.put('/:id/verify', protect, roleMiddleware('admin'), userController.verifyUser);

module.exports = router;