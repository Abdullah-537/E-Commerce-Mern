const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  isRead: { type: Boolean, default: false },
  type: { type: String, enum: ['system', 'order', 'vendor', 'product', 'review', 'complaint'], default: 'system' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
