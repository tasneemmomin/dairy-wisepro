const mongoose = require('mongoose');

const deliveryLogSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pending', 'Delivered', 'Missed', 'Cancelled'], default: 'Pending' },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    unit: String
  }],
  notes: String,
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DeliveryLog', deliveryLogSchema);
