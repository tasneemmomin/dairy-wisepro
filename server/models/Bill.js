const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['Paid', 'Partially Paid', 'Unpaid'], default: 'Unpaid' },
  items: [{
    date: Date,
    productName: String,
    quantity: Number,
    price: Number,
    subtotal: Number
  }],
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bill', billSchema);
