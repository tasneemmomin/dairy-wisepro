const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },

  // Phone kept as optional (legacy / admin may set it)
  phone: { type: String, trim: true, sparse: true },

  role: { type: String, enum: ['OWNER', 'ADMIN', 'STAFF', 'DELIVERY', 'CUSTOMER'], default: 'CUSTOMER' },
  whatsappNotifications: { type: Boolean, default: true },
  milkQuantity: { type: Number, default: 0 },
  preferredDeliveryTime: { type: String, enum: ['Morning', 'Evening', 'Both'], default: 'Morning' },
  route: { type: String, default: 'Default' },
  subscriptionStatus: { type: String, enum: ['Active', 'Paused', 'Inactive'], default: 'Inactive' },
  outstandingBalance: { type: Number, default: 0 },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    lat: Number,
    lng: Number
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare plain password with hashed
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
