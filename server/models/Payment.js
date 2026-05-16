const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  method: { type: String, enum: ['cod', 'card', 'jazzcash', 'easypaisa'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transactionId: { type: String, default: null },
  amount: { type: Number, required: true },
  paidAt: { type: Date, default: null },
});

module.exports = mongoose.model('Payment', paymentSchema);