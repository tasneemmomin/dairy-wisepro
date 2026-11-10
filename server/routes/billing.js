const express = require('express');
const Bill = require('../models/Bill');
const Order = require('../models/Order');
const User = require('../models/User');
const { auth, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

/**
 * Generate monthly bills for all customers based on that calendar month's
 * real delivered/confirmed orders (not a fake flat estimate). Idempotent:
 * re-generating the same month updates existing bills instead of duplicating.
 */
router.post('/generate-all', auth, authorizeRoles('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { month, year } = req.body;
    const m = Number(month), y = Number(year);

    if (!Number.isInteger(m) || m < 1 || m > 12) {
      return res.status(400).json({ message: 'month must be 1-12' });
    }
    if (!Number.isInteger(y) || y < 2020 || y > 2100) {
      return res.status(400).json({ message: 'year must be a valid year' });
    }
    if (y > new Date().getFullYear() || (y === new Date().getFullYear() && m > new Date().getMonth() + 1)) {
      return res.status(400).json({ message: 'Cannot bill a future month' });
    }

    const periodStart = new Date(y, m - 1, 1);
    const periodEnd = new Date(y, m, 1);

    // Aggregate the real order data per customer for that billing period
    const customerTotals = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: periodStart, $lt: periodEnd },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: '$user',
          totalAmount: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    const customers = await User.find({
      _id: { $in: customerTotals.map(c => c._id) },
      role: 'CUSTOMER'
    }).select('name');

    const customerMap = new Map(customers.map(c => [String(c._id), c]));

    const bills = [];
    let updated = 0;

    for (const ct of customerTotals) {
      const customer = customerMap.get(String(ct._id));
      if (!customer || ct.totalAmount <= 0) continue;

      // Due by the 10th of the FOLLOWING month
      const dueDate = new Date(y, m, 10);

      const existing = await Bill.findOne({ customer: ct._id, month: m, year: y });
      if (existing) {
        // Amounts changed since last generation → refresh, keep paid info
        existing.totalAmount = ct.totalAmount;
        if (existing.paidAmount >= existing.totalAmount) {
          existing.status = 'Paid';
        } else if (existing.paidAmount > 0) {
          existing.status = 'Partially Paid';
        } else {
          existing.status = 'Unpaid';
        }
        existing.items = [{ date: periodEnd, productName: `${ct.orderCount} order(s) — ${new Date(y, m - 1).toLocaleString('default', { month: 'long' })} summary`, quantity: ct.orderCount, price: 0, subtotal: ct.totalAmount }];
        await existing.save();
        bills.push(existing);
        updated++;
      } else {
        const bill = new Bill({
          customer: ct._id,
          month: m,
          year: y,
          totalAmount: ct.totalAmount,
          status: 'Unpaid',
          dueDate,
          items: [{ date: periodEnd, productName: `${ct.orderCount} order(s) — ${new Date(y, m - 1).toLocaleString('default', { month: 'long' })} summary`, quantity: ct.orderCount, price: 0, subtotal: ct.totalAmount }]
        });
        await bill.save();
        bills.push(bill);
      }
    }

    res.status(201).json({
      message: `Generated ${bills.length - updated} new bills, updated ${updated} existing bills for ${new Date(y, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      bills
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── NOTE: '/my' must be defined BEFORE '/:id' ───────────────────────────────

// Get user's own bills
router.get('/my', auth, async (req, res) => {
  try {
    const bills = await Bill.find({ customer: req.user._id }).sort('-year -month');
    res.json(bills);
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

// Update bill status (Owner/Admin)
router.put('/:id', auth, authorizeRoles('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { status, paidAmount } = req.body;

    const allowed = ['Paid', 'Partially Paid', 'Unpaid'];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });
    }
    if (paidAmount != null && (isNaN(Number(paidAmount)) || Number(paidAmount) < 0)) {
      return res.status(400).json({ message: 'paidAmount must be a positive number' });
    }

    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    if (status) bill.status = status;
    if (paidAmount != null) bill.paidAmount = Number(paidAmount);

    // Keep status consistent with amounts
    if (bill.paidAmount >= bill.totalAmount) {
      bill.status = 'Paid';
    } else if (bill.paidAmount > 0) {
      bill.status = 'Partially Paid';
    }

    await bill.save();
    res.json(bill);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid bill id' });
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
