const express = require('express');
const Subscription = require('../models/Subscription');
const { auth, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

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
    const targetUserId = (['OWNER', 'ADMIN', 'STAFF'].includes(req.user.role) && user) ? user : req.user._id;
    
    const sub = new Subscription({
      user: targetUserId,
      product,
      planType,
      dailyQuantity,
      weeklyPlan,
      pricePerUnit,
      nextDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    await sub.save();
    res.status(201).json(sub);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


// Pause subscription
router.put('/:id/pause', auth, async (req, res) => {
  try {
    const sub = await Subscription.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'paused' },
      { new: true }
    );
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    res.json(sub);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Resume subscription
router.put('/:id/resume', auth, async (req, res) => {
  try {
    const sub = await Subscription.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'active', nextDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      { new: true }
    );
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    res.json(sub);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel subscription
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const sub = await Subscription.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'cancelled' },
      { new: true }
    );
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    res.json(sub);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
