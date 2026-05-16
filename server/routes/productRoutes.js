const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public: list products with filters
router.get('/', productController.getProducts);

// Vendor: get my products (includes drafts) — MUST be before /:id
router.get('/my-products', protect, roleMiddleware('vendor'), productController.getMyProducts);

// Public: products by vendor
router.get('/vendor/:vendorId', productController.getVendorProducts);

// Public: single product
router.get('/:id', productController.getProduct);

// Public: reviews for product
router.get('/:id/reviews', productController.getProductReviews);

// Vendor: create product
router.post('/', protect, roleMiddleware('vendor', 'admin'), productController.createProduct);

// Vendor/Admin: update product
router.put('/:id', protect, roleMiddleware('vendor', 'admin'), productController.updateProduct);

// Vendor/Admin: delete product
router.delete('/:id', protect, roleMiddleware('vendor', 'admin'), productController.deleteProduct);

// Customer: add review
router.post('/:id/reviews', protect, roleMiddleware('customer'), productController.addReview);

module.exports = router;