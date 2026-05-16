const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const ApiError = require('../utils/ApiError');

// GET CART
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ customerId: req.user._id }).populate('items.productId');

    if (!cart) {
      cart = await Cart.create({ customerId: req.user._id, items: [] });
    }

    // Filter out inactive products
    cart.items = cart.items.filter(item => item.productId && item.productId.isActive);

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

// ADD ITEM
exports.addItem = async (req, res, next) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return next(ApiError.badRequest('Product not available'));
    }

    let cart = await Cart.findOne({ customerId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ customerId: req.user._id, items: [] });
    }

    // Check existing item
    const existingIndex = cart.items.findIndex(
      item => item.productId.toString() === productId &&
             (variantId ? item.variantId?.toString() === variantId : !item.variantId)
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, variantId: variantId || null, quantity });
    }

    await cart.save();
    await cart.populate('items.productId');

    res.status(200).json({ success: true, data: cart, message: 'Item added to cart' });
  } catch (error) {
    next(error);
  }
};

// UPDATE QUANTITY
exports.updateQuantity = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    const cart = await Cart.findOne({ customerId: req.user._id });
    if (!cart) {
      return next(ApiError.notFound('Cart not found'));
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex === -1) {
      return next(ApiError.notFound('Item not in cart'));
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.productId');

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

// REMOVE ITEM
exports.removeItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ customerId: req.user._id });
    if (!cart) {
      return next(ApiError.notFound('Cart not found'));
    }

    cart.items = cart.items.filter(item => item.productId.toString() !== req.params.productId);
    await cart.save();
    await cart.populate('items.productId');

    res.status(200).json({ success: true, data: cart, message: 'Item removed' });
  } catch (error) {
    next(error);
  }
};

// CLEAR CART
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { customerId: req.user._id },
      { items: [] },
      { new: true }
    );

    res.status(200).json({ success: true, data: cart, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};