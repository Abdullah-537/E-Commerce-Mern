const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public: get all categories
router.get('/', categoryController.getCategories);

// Admin: create category
router.post('/', protect, roleMiddleware('admin'), [
  body('name').trim().notEmpty(),
], categoryController.createCategory);

// Admin: update category
router.put('/:id', protect, roleMiddleware('admin'), categoryController.updateCategory);

// Admin: delete category
router.delete('/:id', protect, roleMiddleware('admin'), categoryController.deleteCategory);

module.exports = router;