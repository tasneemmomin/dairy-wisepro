const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const { auth, authorizeRoles } = require('../middleware/auth');
const WhatsAppService = require('../utils/whatsapp');
const router = express.Router();

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, notes } = req.body;

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.product}` });
      if (product.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${product.name}` });

      product.stock -= item.quantity;
      await product.save();

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image
      });

      totalAmount += product.price * item.quantity;

      // Check low stock
      if (product.stock <= product.lowStockThreshold) {
        const notif = new Notification({
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${product.name} stock is low (${product.stock} remaining)`,
          data: { productId: product._id }
        });
        await notif.save();
        req.app.get('io')?.emit('notification', notif);
      }
    }

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      deliveryAddress: deliveryAddress || req.user.address,
      paymentMethod: paymentMethod || 'cod',
      notes
    });

    await order.save();

    // Send notification
    const notif = new Notification({
      type: 'new_order',
      title: 'New Order',
      message: `New order #${order._id.toString().slice(-6)} placed - Rs.${totalAmount}`,
      data: { orderId: order._id }
    });
    await notif.save();
    req.app.get('io')?.emit('notification', notif);
    req.app.get('io')?.emit('new_order', order);

    res.status(201).json(order);
  } catch (error) {
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

// Update order status (OWNER, ADMIN, STAFF, DELIVERY)
router.put('/:id/status', auth, authorizeRoles('OWNER', 'ADMIN', 'STAFF', 'DELIVERY'), async (req, res) => {
  try {
    const { status, deliveryAgent } = req.body;
    const update = { status };
    if (deliveryAgent) update.deliveryAgent = deliveryAgent;

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true }).populate('user', 'name phone whatsappNotifications');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (status === 'out_for_delivery') {
      const notif = new Notification({
        type: 'delivery_assigned',
        title: 'Delivery Update',
        message: `Order #${order._id.toString().slice(-6)} is out for delivery`,
        user: order.user._id,
        data: { orderId: order._id }
      });
      await notif.save();
      req.app.get('io')?.emit('notification', notif);
      
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
    res.status(500).json({ message: error.message });
  }
});

// Get order by id
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name phone').populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // Check if user is owner of the order or has elevated role
    if (order.user._id.toString() !== req.user._id.toString() && !['OWNER', 'ADMIN', 'STAFF', 'DELIVERY'].includes(req.user.role)) {
       return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Update payment status (customer can mark their own order as paid)
router.patch('/:id/payment', auth, async (req, res) => {
  try {
    const { paymentStatus, paymentMethod } = req.body;
    const allowed = ['pending', 'pending_verification', 'paid', 'failed'];
    if (!allowed.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only the order owner or admin can update payment
    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = ['OWNER', 'ADMIN', 'STAFF'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    order.paymentStatus = paymentStatus;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (paymentStatus === 'paid' && order.status === 'pending') {
      order.status = 'confirmed'; // Auto-confirm on payment
    }
    await order.save();

    // Notify admin via socket
    const notif = new Notification({
      type: 'payment_received',
      title: 'Payment Received',
      message: `Payment for Order #${order._id.toString().slice(-6)} confirmed — Rs.${order.totalAmount}`,
      data: { orderId: order._id }
    });
    await notif.save();
    req.app.get('io')?.emit('notification', notif);

    res.json({ message: 'Payment status updated', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
