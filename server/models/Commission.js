const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  grossAmount: { type: Number, required: true },
  commissionRate: { type: Number, required: true },
  commissionAmount: { type: Number, required: true },
  netAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'settled'], default: 'pending' },
  settledAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Commission', commissionSchema);