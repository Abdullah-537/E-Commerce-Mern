const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ customerId: req.user._id }).populate('items.productId');

    if (!wishlist) {
      wishlist = await Wishlist.create({ customerId: req.user._id, items: [] });
    }

    wishlist.items = wishlist.items.filter(item => item.productId && item.productId.isActive);

    res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    next(error);
  }
};

exports.addItem = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return next(ApiError.badRequest('Product not available'));
    }

    let wishlist = await Wishlist.findOne({ customerId: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ customerId: req.user._id, items: [] });
    }

    const exists = wishlist.items.some(item => item.productId.toString() === productId);
    if (exists) {
      return next(ApiError.conflict('Product already in wishlist'));
    }

    wishlist.items.push({ productId, addedAt: Date.now() });
    await wishlist.save();
    await wishlist.populate('items.productId');

    res.status(200).json({ success: true, data: wishlist, message: 'Added to wishlist' });
  } catch (error) {
    next(error);
  }
};

exports.removeItem = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ customerId: req.user._id });
    if (!wishlist) {
      return next(ApiError.notFound('Wishlist not found'));
    }

    wishlist.items = wishlist.items.filter(item => item.productId.toString() !== req.params.productId);
    await wishlist.save();
    await wishlist.populate('items.productId');

    res.status(200).json({ success: true, data: wishlist, message: 'Removed from wishlist' });
  } catch (error) {
    next(error);
  }
};