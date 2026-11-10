const express = require('express');
const Vendor = require('../models/Vendor');
const { auth, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// Get all vendors
router.get('/', auth, authorizeRoles('OWNER', 'ADMIN', 'STAFF'), async (req, res) => {
  try {
    const vendors = await Vendor.find().sort('-createdAt');
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create vendor
router.post('/', auth, authorizeRoles('OWNER', 'ADMIN', 'STAFF'), async (req, res) => {
  try {
    const vendor = new Vendor(req.body);
    await vendor.save();
    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update vendor
router.put('/:id', auth, authorizeRoles('OWNER', 'ADMIN', 'STAFF'), async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid vendor id' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join('; ') });
    }
    res.status(500).json({ message: error.message });
  }
});

// Delete vendor
router.delete('/:id', auth, authorizeRoles('OWNER', 'ADMIN', 'STAFF'), async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json({ message: 'Vendor deleted' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid vendor id' });
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
