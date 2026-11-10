const express = require('express');
const Subscription = require('../models/Subscription');
const { auth, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// ─── Helper: admins manage any subscription, customers only their own ───────
function subAccessFilter(req) {
  const isAdminLike = ['OWNER', 'ADMIN', 'STAFF'].includes(req.user.role) || req.user.id === 'admin-fixed';
  if (isAdminLike) return { _id: req.params.id };
  return { _id: req.params.id, user: req.user._id };
}

// Get user subscriptions
router.get('/my', auth, async (req, res) => {
  try {
    const subs = await Subscription.find({ user: req.user._id }).populate('product').sort('-createdAt');
    res.json(subs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all subscriptions (OWNER, ADMIN, STAFF)
router.get('/', auth, authorizeRoles('OWNER', 'ADMIN', 'STAFF'), async (req, res) => {
  try {
    const subs = await Subscription.find().populate('user', 'name phone').populate('product').sort('-createdAt');
    res.json(subs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create subscription (Customer/Owner/Staff)
router.post('/', auth, async (req, res) => {
  try {
    const { product, planType, dailyQuantity, weeklyPlan, pricePerUnit, user } = req.body;

    if (!product) {
      return res.status(400).json({ message: 'Product is required' });
    }
    if (!planType || !['daily', 'weekly', 'custom'].includes(planType)) {
      return res.status(400).json({ message: 'Plan type must be daily, weekly or custom' });
    }
    if (pricePerUnit == null || isNaN(Number(pricePerUnit)) || Number(pricePerUnit) < 0) {
      return res.status(400).json({ message: 'A valid price per unit is required' });
    }

    // Admins/staff can create a subscription on behalf of a customer
    const isAdminLike = ['OWNER', 'ADMIN', 'STAFF'].includes(req.user.role);
    const targetUserId = (isAdminLike && user) ? user : req.user._id;
    if (targetUserId === 'admin-fixed') {
      return res.status(400).json({ message: 'Select a customer to subscribe' });
    }

    const sub = new Subscription({
      user: targetUserId,
      product,
      planType,
      dailyQuantity: Number(dailyQuantity) || 1,
      weeklyPlan,
      pricePerUnit: Number(pricePerUnit),
      nextDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    await sub.save();
    res.status(201).json(sub);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join('; ') });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product or user id' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Pause subscription (owner or admin)
router.put('/:id/pause', auth, async (req, res) => {
  try {
    const sub = await Subscription.findOneAndUpdate(
      subAccessFilter(req),
      { status: 'paused' },
      { new: true, runValidators: true }
    );
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    res.json(sub);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid subscription id' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Resume subscription (owner or admin)
router.put('/:id/resume', auth, async (req, res) => {
  try {
    const sub = await Subscription.findOneAndUpdate(
      subAccessFilter(req),
      { status: 'active', nextDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      { new: true, runValidators: true }
    );
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    res.json(sub);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid subscription id' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Cancel subscription (owner or admin)
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const sub = await Subscription.findOneAndUpdate(
      subAccessFilter(req),
      { status: 'cancelled', endDate: new Date() },
      { new: true, runValidators: true }
    );
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    res.json(sub);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid subscription id' });
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
