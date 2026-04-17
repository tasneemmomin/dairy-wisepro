const express = require('express');
const DeliveryLog = require('../models/DeliveryLog');
const User = require('../models/User');
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
    
    const log = new DeliveryLog({
      customer: customerId,
      deliveryBoy: req.user._id,
      status,
      products,
      notes
    });
    
    await log.save();
    res.status(201).json(log);
  } catch (error) {
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
