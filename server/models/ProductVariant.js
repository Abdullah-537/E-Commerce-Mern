const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  attributes: { type: mongoose.Schema.Types.Mixed, required: true },
  price: { type: Number, default: null },
  stock: { type: Number, default: 0 },
  sku: { type: String, unique: true, sparse: true },
});

module.exports = mongoose.model('ProductVariant', productVariantSchema);