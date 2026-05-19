const Review = require('../models/Review');
const Vendor = require('../models/Vendor');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

exports.getVendorReviews = async (req, res, next) => {
  try {
    const { filter } = req.query;
    
    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) return next(ApiError.notFound('Vendor not found'));

    const query = { vendorId: vendor._id };

    if (filter === '5') query.rating = 5;
    else if (filter === '4') query.rating = 4;
    else if (filter === '3') query.rating = 3;
    else if (filter === 'flagged') query.isFlagged = true;

    const reviews = await Review.find(query)
      .populate('productId', 'name images')
      .populate('customerId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, reviews, 'Reviews retrieved successfully'));
  } catch (error) {
    next(error);
  }
};
