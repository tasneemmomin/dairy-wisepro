const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  currentStock: { type: Number, default: 0 },
  minStock: { type: Number, default: 10 },
  maxStock: { type: Number, default: 500 },
  lastRestocked: Date,
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  dailyUsage: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Inventory', inventorySchema);
