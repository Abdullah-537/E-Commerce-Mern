const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  globalCommissionRate: {
    type: Number,
    default: 10,
    min: 0,
    max: 100
  }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
