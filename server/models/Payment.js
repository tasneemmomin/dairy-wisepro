const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  
  // QR Code payment system
  qrCode: { type: String }, // Base64 or URL of QR code image
  paymentMethod: { type: String, enum: ['qr_code', 'cod'], default: 'qr_code' },
  
  // Payment status flow
  utr: { type: String, default: null }, // Required for verifying UPI
  referenceNumber: { type: String, default: null },
  screenshot: { type: String, default: null }, // Base64 image
  
  status: {
    type: String,
    enum: ['pending', 'verified_by_user', 'approved_by_admin', 'rejected_by_admin', 'completed'],
    default: 'pending'
  },
  
  // User marks as paid
  userClaimedPaid: { type: Boolean, default: false },
  userClaimedAt: { type: Date, default: null },
  
  // Admin verification
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verificationNotes: { type: String, default: null },
  verifiedAt: { type: Date, default: null },
  
  // Rejection reason
  rejectionReason: { type: String, default: null },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

paymentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
