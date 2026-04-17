const mongoose = require('mongoose');

const dayPlanSchema = new mongoose.Schema({
  day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
  quantity: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true }
});

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  planType: { type: String, enum: ['daily', 'weekly', 'custom'], default: 'daily' },
  dailyQuantity: { type: Number, default: 1 },
  weeklyPlan: [dayPlanSchema],
  pricePerUnit: { type: Number, required: true },
  status: { type: String, enum: ['active', 'paused', 'cancelled'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  nextDelivery: Date,
  totalBilled: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
