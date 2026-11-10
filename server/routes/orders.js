const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const { auth, authorizeRoles } = require('../middleware/auth');
const WhatsAppService = require('../utils/whatsapp');
const router = express.Router();

// ─── Helper: restore stock for an order's items (on cancel/reject/fail) ─────
async function restoreStock(items) {
  for (const item of items) {
    if (!item.product) continue; // product may be unpopulated ObjectId
    await Product.updateOne(
      { _id: item.product },
      { $inc: { stock: item.quantity } }
    );
  }
}

// ─── Create order ────────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, notes } = req.body;

    // The fixed admin account has no DB record — orders must belong to a real user
    if (req.user.id === 'admin-fixed' || req.user._id === 'admin-fixed') {
      return res.status(400).json({ message: 'Agency accounts cannot place shop orders. Login as a customer to order.' });
    }

    // ── Validate payload ────────────────────────────────────────────────────
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }
    for (const item of items) {
      if (!item.product) {
        return res.status(400).json({ message: 'Every item needs a product id' });
      }
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 999) {
        return res.status(400).json({ message: 'Item quantity must be a whole number between 1 and 999' });
      }
      item.quantity = qty;
    }

    // ── Phase 1: verify stock for ALL items before touching anything ────────
    const orderItems = [];
    let totalAmount = 0;
    const decremented = []; // products we already reserved (for rollback)

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        // release anything reserved so far
        for (const d of decremented) {
          await Product.updateOne({ _id: d._id }, { $inc: { stock: d.qty } });
        }
        return res.status(404).json({ message: `Product not found` });
      }
      if (!product.isAvailable) {
        for (const d of decremented) {
          await Product.updateOne({ _id: d._id }, { $inc: { stock: d.qty } });
        }
        return res.status(400).json({ message: `${product.name} is currently unavailable` });
      }
      if (product.stock < item.quantity) {
        for (const d of decremented) {
          await Product.updateOne({ _id: d._id }, { $inc: { stock: d.qty } });
        }
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Only ${product.stock} left.`
        });
      }

      // ── Phase 2: atomically reserve stock (safe under concurrency) ───────
      const result = await Product.updateOne(
        { _id: product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );
      if (result.modifiedCount !== 1) {
        for (const d of decremented) {
          await Product.updateOne({ _id: d._id }, { $inc: { stock: d.qty } });
        }
        return res.status(409).json({
          message: `Stock for ${product.name} just changed. Please review your cart and retry.`
        });
      }
      decremented.push({ _id: product._id, qty: item.quantity });

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image
      });

      totalAmount += product.price * item.quantity;

      // Check low stock (after reservation)
      if (product.stock - item.quantity <= product.lowStockThreshold) {
        const notif = await Notification.create({
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${product.name} stock is low (${Math.max(product.stock - item.quantity, 0)} remaining)`,
          data: { productId: product._id }
        });
        req.app.get('io')?.emit('notification', notif);
      }
    }

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      deliveryAddress: deliveryAddress || req.user.address,
      paymentMethod: ['cod', 'qr_code'].includes(paymentMethod) ? paymentMethod : 'cod',
      notes
    });

    try {
      await order.save();
    } catch (saveErr) {
      // Order failed to persist — return reserved stock
      for (const d of decremented) {
        await Product.updateOne({ _id: d._id }, { $inc: { stock: d.qty } });
      }
      throw saveErr;
    }

    // Send notification
    const notif = await Notification.create({
      type: 'new_order',
      title: 'New Order',
      message: `New order #${order._id.toString().slice(-6)} placed - Rs.${totalAmount}`,
      data: { orderId: order._id }
    });
    req.app.get('io')?.emit('notification', notif);
    req.app.get('io')?.emit('new_order', order);

    res.status(201).json(order);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join('; ') });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid id format in order items' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Get user orders
router.get('/my', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('items.product').sort('-createdAt');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all orders (OWNER, ADMIN, STAFF)
router.get('/', auth, authorizeRoles('OWNER', 'ADMIN', 'STAFF'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter).populate('user', 'name phone').populate('items.product').sort('-createdAt');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Customer cancels own order — only while still pending (not yet confirmed).
// Once an admin confirms (payment verified), only the agency can cancel
// (perishable goods are already being prepared); the customer gets a refund
// by contacting the agency, handled via the admin status route.
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = ['OWNER', 'ADMIN', 'STAFF'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only cancel your own orders' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    // Confirmed/processing/paid orders can only be cancelled by the agency
    if (!isAdmin && order.status !== 'pending') {
      return res.status(400).json({
        message: `Cannot cancel a ${order.status.replace('_', ' ')} order. Contact the agency for a refund.`
      });
    }

    // Business rules: cannot cancel once it's on the way or delivered
    const cancellable = ['pending', 'confirmed', 'processing'];
    if (!cancellable.includes(order.status)) {
      return res.status(400).json({
        message: `Cannot cancel an order that is ${order.status.replace('_', ' ')}. Contact the agency.`
      });
    }

    // If the money was verified/paid, flag a refund follow-up instead of marking failed
    if (order.paymentStatus === 'paid') {
      order.status = 'cancelled';
      order.notes = `${order.notes || ''} | Paid order cancelled — refund owed to customer`.trim();
    } else {
      order.status = 'cancelled';
    }
    await order.save();

    // Return reserved stock back to inventory
    await restoreStock(order.items);

    const notif = await Notification.create({
      type: 'general',
      title: 'Order Cancelled',
      message: `Order #${order._id.toString().slice(-6)} was cancelled${order.paymentStatus === 'paid' ? ' (refund pending)' : ''}`,
      user: order.user,
      data: { orderId: order._id }
    });
    req.app.get('io')?.emit('notification', notif);

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid order id' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Update order status (OWNER, ADMIN, STAFF, DELIVERY)
router.put('/:id/status', auth, authorizeRoles('OWNER', 'ADMIN', 'STAFF', 'DELIVERY'), async (req, res) => {
  try {
    const { status, deliveryAgent } = req.body;
    const allowed = ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled', 'failed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${allowed.join(', ')}` });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, ...(deliveryAgent ? { deliveryAgent } : {}) },
      { new: true, runValidators: true }
    ).populate('user', 'name phone whatsappNotifications');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Restock when an admin deliberately cancels / fails an order
    if (['cancelled', 'failed'].includes(status)) {
      await restoreStock(order.items);
    }

    if (status === 'out_for_delivery') {
      const notif = await Notification.create({
        type: 'delivery_assigned',
        title: 'Delivery Update',
        message: `Order #${order._id.toString().slice(-6)} is out for delivery`,
        user: order.user._id,
        data: { orderId: order._id }
      });
      req.app.get('io')?.emit('notification', notif);
      req.app.get('io')?.to(String(order.user._id)).emit('order_update', order);

      // WhatsApp notification
      if (order.user && order.user.whatsappNotifications) {
        WhatsAppService.sendNotification(order.user.phone, {
          type: 'OUT_FOR_DELIVERY',
          orderId: order._id
        });
      }
    }

    res.json(order);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid order id' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Get order by id
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name phone').populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Check if user is owner of the order or has elevated role
    if (order.user?._id?.toString() !== req.user._id?.toString() && !['OWNER', 'ADMIN', 'STAFF', 'DELIVERY'].includes(req.user.role)) {
       return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(order);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid order id' });
    }
    res.status(500).json({ message: error.message });
  }
});

// ✅ Update payment status — ADMIN ONLY for final states.
// Customers must go through /payments (QR proof flow) instead of self-marking paid,
// otherwise the whole verification business flow can be bypassed.
router.patch('/:id/payment', auth, async (req, res) => {
  try {
    const { paymentStatus, paymentMethod } = req.body;
    const allowed = ['pending', 'pending_verification', 'paid', 'failed'];
    if (!allowed.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = ['OWNER', 'ADMIN', 'STAFF'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Customers may only move their order into the "awaiting admin verification"
    // state; only admins can mark an order truly PAID or FAILED.
    if (!isAdmin && paymentStatus !== 'pending_verification') {
      return res.status(403).json({
        message: 'Customers can only submit payment for verification. Final payment status is set by the agency after review.'
      });
    }

    order.paymentStatus = paymentStatus;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (paymentStatus === 'paid' && order.status === 'pending') {
      order.status = 'confirmed'; // Auto-confirm on payment
    }
    await order.save();

    // Notify admin via socket
    const notif = await Notification.create({
      type: 'payment_received',
      title: 'Payment Received',
      message: `Payment for Order #${order._id.toString().slice(-6)} confirmed — Rs.${order.totalAmount}`,
      data: { orderId: order._id }
    });
    req.app.get('io')?.emit('notification', notif);

    res.json({ message: 'Payment status updated', order });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid order id' });
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
