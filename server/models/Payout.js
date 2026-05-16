const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'paid'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date, default: null },
  adminNote: { type: String, default: null },
  transactionRef: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Payout', payoutSchema);