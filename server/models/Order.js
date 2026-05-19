const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', default: null },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  productName: { type: String, required: true },
  productImage: { type: String, default: null },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  commissionRate: { type: Number, required: true },
  commissionAmount: { type: Number, required: true },
  vendorEarning: { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'refund_requested', 'refund_approved'],
    default: 'pending',
  },
  otpVerified: { type: Boolean, default: false },
  paymentMethod: {
    type: String,
    enum: ['cod', 'card', 'jazzcash', 'easypaisa'],
    default: 'cod',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 150 },
  totalAmount: { type: Number, required: true },
  totalCommission: { type: Number, default: 0 },
  trackingNumber: { type: String, default: null },
  notes: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);