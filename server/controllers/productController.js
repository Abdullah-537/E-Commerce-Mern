const slugify = require('slugify');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Vendor = require('../models/Vendor');
const Review = require('../models/Review');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// GET PRODUCTS (public)
exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, vendor, minPrice, maxPrice, rating, sort, page = 1, limit = 20 } = req.query;

    const filter = { isActive: true, status: 'published' };
    if (category) filter.categoryId = category;
    if (vendor) filter.vendorId = vendor;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (rating) filter.rating = { $gte: parseFloat(rating) };

    let query = Product.find(filter);

    if (search) {
      query = Product.find({ $text: { search }, isActive: true });
    }

    // Sorting
    if (sort === 'price_asc') query.sort({ price: 1 });
    else if (sort === 'price_desc') query.sort({ price: -1 });
    else if (sort === 'rating') query.sort({ rating: -1 });
    else if (sort === 'newest') query.sort({ createdAt: -1 });
    else query.sort({ createdAt: -1 });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await query.skip(skip).limit(parseInt(limit)).populate('vendorId', 'businessName slug').populate('categoryId', 'name');
    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: products,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE PRODUCT (public)
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendorId', 'businessName slug logo')
      .populate('categoryId', 'name');

    if (!product || !product.isActive) {
      return next(ApiError.notFound('Product not found'));
    }

    // Get variant combinations
    const combinations = await ProductVariant.find({ productId: product._id });

    res.status(200).json({ success: true, data: { ...product.toObject(), combinations } });
  } catch (error) {
    next(error);
  }
};

// GET VENDOR PRODUCTS (public)
exports.getVendorProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = { vendorId: req.params.vendorId, isActive: true };

    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: products,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// GET MY PRODUCTS (vendor only — includes drafts)
exports.getMyProducts = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return next(ApiError.notFound('Vendor profile not found'));
    }

    const { page = 1, limit = 50, status } = req.query;
    const filter = { vendorId: vendor._id };
    if (status) filter.status = status;

    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: products,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// CREATE PRODUCT (vendor/admin)
exports.createProduct = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor || vendor.status !== 'approved') {
      return next(ApiError.forbidden('Only approved vendors can add products'));
    }

    const { name, description, categoryId, price, salePrice, saleEndsAt, images, stock, hasVariants, tags, variants, status = 'published' } = req.body;

    // Upload images to Cloudinary if they are base64
    const { uploadImage } = require('../utils/cloudinary');
    const uploadedImages = [];
    if (images && images.length > 0) {
      for (const img of images) {
        if (img.startsWith('data:image')) {
          const url = await uploadImage(img, 'shopzone/products');
          uploadedImages.push(url);
        } else {
          uploadedImages.push(img);
        }
      }
    }

    // Generate unique slug
    const baseSlug = slugify(name, { lower: true, strict: true });
    const slug = `${baseSlug}-${Date.now()}`;

    // Handle variant flat array and images
    let productVariantsArray = [];
    if (req.body.productVariants && req.body.productVariants.length > 0) {
      for (const v of req.body.productVariants) {
        let imageUrl = v.image || '';
        if (imageUrl.startsWith('data:image')) {
          imageUrl = await uploadImage(imageUrl, 'shopzone/variants');
        }
        productVariantsArray.push({
          name: v.name,
          value: v.value,
          image: imageUrl
        });
      }
    }

    const product = await Product.create({
      vendorId: vendor._id,
      name,
      slug,
      description,
      categoryId,
      price,
      salePrice,
      saleEndsAt,
      images: uploadedImages,
      stock: stock || 0,
      hasVariants: hasVariants || false,
      variants: productVariantsArray,
      tags: tags || [],
      status: status || 'published',
    });

    // Create variants if any
    if (variants && variants.length > 0) {
      for (const v of variants) {
        const variantData = {
          productId: product._id,
          attributes: v.attributes,
          price: v.price || price,
          stock: v.stock || 0,
        };
        if (v.sku) variantData.sku = v.sku;
        await ProductVariant.create(variantData);
      }
    }

    const { createNotification } = require('../utils/notificationHelper');
    const User = require('../models/User');
    
    // Find users who have favorited this vendor
    const followers = await User.find({ favoriteStores: vendor._id });
    for (const follower of followers) {
      await createNotification({
        userId: follower._id,
        title: 'New Product from ' + vendor.businessName,
        message: `${vendor.businessName} just added a new product: ${product.name}!`,
        type: 'product',
        link: `/product/${product._id}`
      });
    }

    res.status(201).json({ success: true, data: product, message: 'Product created' });
  } catch (error) {
    next(error);
  }
};

// UPDATE PRODUCT (vendor own / admin)
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(ApiError.notFound('Product not found'));
    }

    // Check ownership (or admin)
    const vendor = await Vendor.findOne({ userId: req.user._id });
    const isOwner = vendor && product.vendorId.toString() === vendor._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(ApiError.forbidden('Not authorized'));
    }

    const { uploadImage } = require('../utils/cloudinary');
    
    const allowedUpdates = ['name', 'description', 'categoryId', 'price', 'salePrice', 'saleEndsAt', 'images', 'stock', 'isActive', 'tags', 'isFeatured', 'status', 'hasVariants'];
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        if (field === 'images') {
          const uploadedImages = [];
          for (const img of req.body.images) {
            if (img.startsWith('data:image')) {
              const url = await uploadImage(img, 'shopzone/products');
              uploadedImages.push(url);
            } else {
              uploadedImages.push(img);
            }
          }
          product.images = uploadedImages;
        } else {
          product[field] = req.body[field];
        }
      }
    }

    if (req.body.name) {
      product.slug = slugify(req.body.name, { lower: true, strict: true }) + '-' + Date.now();
    }

    // Handle embedded variants (names, values, images)
    if (req.body.productVariants !== undefined) {
      let productVariantsArray = [];
      for (const v of req.body.productVariants) {
        let imageUrl = v.image || '';
        if (imageUrl.startsWith('data:image')) {
          imageUrl = await uploadImage(imageUrl, 'shopzone/variants');
        }
        productVariantsArray.push({
          name: v.name,
          value: v.value,
          image: imageUrl
        });
      }
      product.variants = productVariantsArray;
    }

    await product.save();

    // Recreate combinations in ProductVariant
    if (req.body.variants && req.body.hasVariants) {
      await ProductVariant.deleteMany({ productId: product._id });
      for (const v of req.body.variants) {
        const variantData = {
          productId: product._id,
          attributes: v.attributes,
          price: v.price || product.price,
          stock: v.stock || 0,
        };
        if (v.sku) variantData.sku = v.sku;
        await ProductVariant.create(variantData);
      }
    } else if (req.body.hasVariants === false) {
      await ProductVariant.deleteMany({ productId: product._id });
    }
    res.status(200).json({ success: true, data: product, message: 'Product updated' });
  } catch (error) {
    next(error);
  }
};

// DELETE PRODUCT (vendor own / admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(ApiError.notFound('Product not found'));
    }

    const vendor = await Vendor.findOne({ userId: req.user._id });
    const isOwner = vendor && product.vendorId.toString() === vendor._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(ApiError.forbidden('Not authorized'));
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

// GET REVIEWS (public)
exports.getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ productId: req.params.id, isFlagged: false })
      .populate('customerId', 'name avatar')
      .sort({ createdAt: -1 });

    const mongoose = require('mongoose');
    const stats = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(req.params.id) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } }
    ]);

    res.status(200).json({ success: true, data: reviews, stats });
  } catch (error) {
    next(error);
  }
};

// ADD REVIEW (customer)
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(ApiError.notFound('Product not found'));
    }

    // Check if verified purchase (has completed order with this product)
    const hasOrder = await Order.findOne({
      customerId: req.user._id,
      'items.productId': product._id,
      status: 'delivered',
    });

    if (!hasOrder) {
      return next(ApiError.forbidden('You must have purchased and received this product to leave a review.'));
    }

    // Check for duplicate review
    const existing = await Review.findOne({ customerId: req.user._id, productId: product._id });
    if (existing) {
      return next(ApiError.conflict('You have already reviewed this product'));
    }

    const review = await Review.create({
      customerId: req.user._id,
      productId: product._id,
      vendorId: product.vendorId,
      rating,
      comment,
      isVerifiedPurchase: !!hasOrder,
    });

    // Update product rating
    const reviews = await Review.find({ productId: product._id });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    product.rating = parseFloat(avgRating.toFixed(1));
    product.reviewCount = reviews.length;
    await product.save();

    const { createNotification } = require('../utils/notificationHelper');
    const Vendor = require('../models/Vendor');
    const vendorRecord = await Vendor.findById(product.vendorId);
    if (vendorRecord) {
      await createNotification({
        userId: vendorRecord.userId,
        title: 'New Product Review',
        message: `Someone left a ${rating}-star review on your product ${product.name}.`,
        type: 'review',
        link: `/product/${product._id}`
      });
    }

    res.status(201).json({ success: true, data: review, message: 'Review added' });
  } catch (error) {
    next(error);
  }
};