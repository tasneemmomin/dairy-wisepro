const express = require('express');
const DeliveryLog = require('../models/DeliveryLog');
const User = require('../models/User');
const mongoose = require('mongoose');
const { auth, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// Get daily delivery list (Delivery boy / Owner)
router.get('/daily', auth, authorizeRoles('OWNER', 'ADMIN', 'STAFF', 'DELIVERY'), async (req, res) => {
  try {
    const { date } = req.query;
    const searchDate = date ? new Date(date) : new Date();
    searchDate.setHours(0,0,0,0);
    
    // Find customers in the route assigned to the delivery boy
    // For now, get all active customers
    const customers = await User.find({ 
      role: 'CUSTOMER', 
      subscriptionStatus: 'Active' 
    });
    
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Log delivery status
router.post('/log', auth, authorizeRoles('OWNER', 'ADMIN', 'DELIVERY'), async (req, res) => {
  try {
    const { customerId, status, products, notes } = req.body;
    
    if (!customerId) {
      return res.status(400).json({ message: 'customerId is required' });
    }
    if (!['Pending', 'Delivered', 'Missed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'status must be Pending, Delivered, Missed or Cancelled' });
    }

    // Only record a delivery agent if we have a real DB user id
    // (the fixed admin account has no DB record, and an invalid id would fail casting)
    const deliveryBoyValid = mongoose.isValidObjectId(req.user._id);

    const log = new DeliveryLog({
      customer: customerId,
      ...(deliveryBoyValid ? { deliveryBoy: req.user._id } : {}),
      status,
      products,
      notes
    });
    
    await log.save();
    res.status(201).json(log);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid customer id' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Get delivery highlights (Owner)
router.get('/stats', auth, authorizeRoles('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const logs = await DeliveryLog.find({ date: { $gte: today } });
    const deliveredCount = logs.filter(l => l.status === 'Delivered').length;
    const missedCount = logs.filter(l => l.status === 'Missed').length;
    
    res.json({ deliveredCount, missedCount, totalToday: logs.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
