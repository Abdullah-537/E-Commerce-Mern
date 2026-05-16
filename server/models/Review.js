const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  isVerifiedPurchase: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
}, { timestamps: true });

reviewSchema.index({ customerId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);