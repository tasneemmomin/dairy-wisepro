const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  totalRevenue: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  newCustomers: { type: Number, default: 0 },
  topProducts: [{ product: String, quantity: Number, revenue: Number }],
  demandData: { predicted: Number, actual: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Analytics', analyticsSchema);
