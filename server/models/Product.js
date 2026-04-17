const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ['milk', 'paneer', 'curd', 'butter', 'ghee', 'buttermilk', 'cheese', 'other'] },
  description: { type: String },
  price: { type: Number, required: true },
  unit: { type: String, default: 'per liter' },
  stock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  image: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);
