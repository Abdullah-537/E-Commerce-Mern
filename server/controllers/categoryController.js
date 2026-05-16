const slugify = require('slugify');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');

// GET CATEGORIES (public)
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });

    // Build tree structure
    const categoryMap = {};
    const roots = [];

    categories.forEach(cat => {
      categoryMap[cat._id] = { ...cat.toObject(), children: [] };
    });

    categories.forEach(cat => {
      if (cat.parentId) {
        if (categoryMap[cat.parentId]) {
          categoryMap[cat.parentId].children.push(categoryMap[cat._id]);
        }
      } else {
        roots.push(categoryMap[cat._id]);
      }
    });

    res.status(200).json({ success: true, data: roots });
  } catch (error) {
    next(error);
  }
};

// CREATE CATEGORY (admin)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, parentId, imageUrl } = req.body;

    const slug = slugify(name, { lower: true, strict: true });

    let finalImage = imageUrl || null;
    if (imageUrl && imageUrl.startsWith('data:image')) {
      const { uploadImage } = require('../utils/cloudinary');
      finalImage = await uploadImage(imageUrl, 'shopzone/categories');
    }

    const category = await Category.create({
      name,
      slug,
      parentId: parentId || null,
      imageUrl: finalImage,
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// UPDATE CATEGORY (admin)
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, parentId, imageUrl, isActive } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(ApiError.notFound('Category not found'));
    }

    if (name) {
      category.name = name;
      category.slug = slugify(name, { lower: true, strict: true });
    }
    if (parentId !== undefined) category.parentId = parentId;
    if (imageUrl !== undefined) {
      if (imageUrl && imageUrl.startsWith('data:image')) {
        const { uploadImage } = require('../utils/cloudinary');
        category.imageUrl = await uploadImage(imageUrl, 'shopzone/categories');
      } else {
        category.imageUrl = imageUrl;
      }
    }
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// DELETE CATEGORY (admin)
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return next(ApiError.notFound('Category not found'));
    }

    // Check for children
    const children = await Category.countDocuments({ parentId: category._id });
    if (children > 0) {
      return next(ApiError.badRequest('Cannot delete category with subcategories'));
    }

    // Soft delete
    category.isActive = false;
    await category.save();

    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};