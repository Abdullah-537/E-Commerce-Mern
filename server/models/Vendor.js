const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  businessName: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  logo: { type: String, default: null },
  banner: { type: String, default: null },
  description: { type: String, default: '' },
  businessEmail: { type: String, default: null },
  businessPhone: { type: String, default: null },
  status: { type: String, enum: ['pending', 'approved', 'banned', 'rejected'], default: 'pending' },
  commissionRate: { type: Number, default: 10 },
  totalEarnings: { type: Number, default: 0 },
  availableBalance: { type: Number, default: 0 },
  bankName: { type: String, default: null },
  accountNumber: { type: String, default: null },
  accountTitle: { type: String, default: null },
  returnPolicy: { type: String, default: 'Returns accepted within 30 days of delivery.' },
  shippingPolicy: { type: String, default: 'Standard delivery 3-5 business days.' },
  isOpen: { type: Boolean, default: true },
  ratings: [{
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: Number
  }],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);