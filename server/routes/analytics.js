const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { auth, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// Dashboard stats
router.get('/dashboard', auth, authorizeRoles('OWNER', 'ADMIN', 'STAFF'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [
      totalOrders,
      todayOrders,
      totalCustomers,
      totalProducts,
      monthRevenue,
      lastMonthRevenue,
      pendingOrders,
      recentOrders,
      lowStockProducts
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ role: 'CUSTOMER' }),
      Product.countDocuments(),
      Order.aggregate([
        { $match: { createdAt: { $gte: thisMonth }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: lastMonth, $lt: thisMonth }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.countDocuments({ status: 'pending' }),
      Order.find().populate('user', 'name phone').sort('-createdAt').limit(5),
      Product.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }).limit(10)
    ]);

    const currentRevenue = monthRevenue[0]?.total || 0;
    const prevRevenue = lastMonthRevenue[0]?.total || 0;
    const revenueGrowth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : 0;

    res.json({
      totalOrders,
      todayOrders,
      totalCustomers,
      totalProducts,
      monthRevenue: currentRevenue,
      revenueGrowth,
      pendingOrders,
      recentOrders,
      lowStockProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Revenue chart data (last 12 months)
router.get('/revenue-chart', auth, authorizeRoles('OWNER', 'ADMIN', 'STAFF'), async (req, res) => {
  try {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    const data = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const labels = months.map(m => {
      const d = new Date(m.year, m.month - 1);
      return d.toLocaleString('default', { month: 'short', year: '2-digit' });
    });

    const revenue = months.map(m => {
      const found = data.find(d => d._id.year === m.year && d._id.month === m.month);
      return found ? found.revenue : 0;
    });

    const orders = months.map(m => {
      const found = data.find(d => d._id.year === m.year && d._id.month === m.month);
      return found ? found.orders : 0;
    });

    res.json({ labels, revenue, orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Top products
router.get('/top-products', auth, authorizeRoles('OWNER', 'ADMIN', 'STAFF'), async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);
    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Customer growth
router.get('/customer-growth', auth, authorizeRoles('OWNER', 'ADMIN', 'STAFF'), async (req, res) => {
  try {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    const data = await User.aggregate([
      { $match: { role: 'CUSTOMER' } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const labels = months.map(m => {
      const d = new Date(m.year, m.month - 1);
      return d.toLocaleString('default', { month: 'short' });
    });

    const counts = months.map(m => {
      const found = data.find(d => d._id.year === m.year && d._id.month === m.month);
      return found ? found.count : 0;
    });

    res.json({ labels, counts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

