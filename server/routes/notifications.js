const express = require('express');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get notifications
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (!['OWNER', 'ADMIN', 'STAFF'].includes(req.user.role)) {
      filter.$or = [{ user: req.user._id }, { user: null }];
    }
    const notifications = await Notification.find(filter).sort('-createdAt').limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unread count
router.get('/unread', auth, async (req, res) => {
  try {
    const filter = { isRead: false };
    if (!['OWNER', 'ADMIN', 'STAFF'].includes(req.user.role)) {
      filter.$or = [{ user: req.user._id }, { user: null }];
    }
    const count = await Notification.countDocuments(filter);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all as read
router.put('/read-all', auth, async (req, res) => {
  try {
    const filter = { isRead: false };
    if (!['OWNER', 'ADMIN', 'STAFF'].includes(req.user.role)) {
      filter.$or = [{ user: req.user._id }, { user: null }];
    }
    await Notification.updateMany(filter, { isRead: true });
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
