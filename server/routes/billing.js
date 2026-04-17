const express = require('express');
const Bill = require('../models/Bill');
const User = require('../models/User');
const { auth, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// Generate monthly bills for all active customers
router.post('/generate-all', auth, authorizeRoles('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { month, year } = req.body;
    const customers = await User.find({ role: 'CUSTOMER', subscriptionStatus: 'Active' });
    
    const bills = [];
    for (const customer of customers) {
      // Very basic logic: milk quantity * 30 days * avg price (60)
      // In a real app, this would sum up daily delivery logs
      const totalAmount = customer.milkQuantity * 30 * 60; 
      
      const bill = new Bill({
        customer: customer._id,
        month,
        year,
        totalAmount,
        dueDate: new Date(year, month, 10) // Due by 10th of next month
      });
      await bill.save();
      bills.push(bill);
    }
    
    res.status(201).json({ message: `Generated ${bills.length} bills`, bills });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all bills (Owner/Admin/Staff)
router.get('/', auth, authorizeRoles('OWNER', 'ADMIN', 'STAFF'), async (req, res) => {
  try {
    const bills = await Bill.find().populate('customer', 'name phone').sort('-year -month');
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's own bills
router.get('/my', auth, async (req, res) => {
  try {
    const bills = await Bill.find({ customer: req.user._id }).sort('-year -month');
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update bill status (Owner/Admin)
router.put('/:id', auth, authorizeRoles('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const bill = await Bill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
