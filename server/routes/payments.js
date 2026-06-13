const express = require('express');
const QRCode = require('qrcode');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { auth, authorizeRoles } = require('../middleware/auth');
const WhatsAppService = require('../utils/whatsapp');
const router = express.Router();

// UPI ID of Vasantdada Agency (Admin can change this via env)
const UPI_ID = process.env.UPI_ID || '9975882125@okbizaxis';

/**
 * Payment Flow:
 * 1. Customer places order → Order created with status "pending"
 * 2. Generate QR Code → Show to customer for payment
 * 3. Customer "I have paid" → Payment status = "verified_by_user"
 * 4. Admin Dashboard → Review pending payments
 * 5. Admin "Approve" → Order status = "confirmed", Payment = "approved_by_admin"
 * 6. Admin "Reject" → Order status = "failed", Payment = "rejected_by_admin"
 *
 * IMPORTANT: Fixed routes that match literal path segments (/generate-qr, /pending/all, /order/:id)
 * MUST be defined BEFORE parameterised routes (/:paymentId) to prevent Express
 * from swallowing them as parameter values.
 */

// ─── 1. Generate QR Code for Payment ────────────────────────────────────────
router.post('/generate-qr', auth, async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ message: 'Order ID and amount are required' });
    }

    // Find order
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Check if user owns this order (skip check for admin)
    const isAdmin = req.user?.id === 'admin-fixed' || req.user?._id === 'admin-fixed';
    if (!isAdmin) {
      const orderUserId = order.user?.toString();
      const requestUserId = req.user?._id?.toString();
      if (orderUserId !== requestUserId) {
        return res.status(403).json({ message: 'You can only view your own orders' });
      }
    }

    // Check if payment already exists
    let payment = await Payment.findOne({ order: orderId });

    if (!payment) {
      // Create payment record
      payment = new Payment({
        order: orderId,
        user: isAdmin ? order.user : req.user._id,
        amount: amount,
        paymentMethod: 'qr_code'
      });

      // Generate UPI QR Code
      const upiString = `upi://pay?pa=${UPI_ID}&pn=Vasantdada%20Agency&am=${amount}&tr=${orderId}`;
      const qrCodeImage = await QRCode.toDataURL(upiString);

      payment.qrCode = qrCodeImage;
      await payment.save();
    }

    // Generate WhatsApp link (safe even if phone is undefined)
    const whatsappLink = WhatsAppService.generatePaymentLink(
      order._id,
      amount,
      req.user?.name || 'Customer'
    );

    // Optional: Mock WhatsApp notification (won't crash if phone is undefined)
    if (req.user?.phone) {
      WhatsAppService.sendNotification(req.user.phone, {
        type: 'ORDER_CREATED',
        orderId: orderId,
        amount: amount
      });
    }

    res.json({
      message: 'Payment details generated successfully',
      payment: {
        id: payment._id,
        qrCode: payment.qrCode,
        amount: payment.amount,
        status: payment.status,
        upiId: UPI_ID,
        orderId: orderId,
        whatsappLink: whatsappLink
      }
    });

  } catch (error) {
    console.error('Generate QR error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ─── 4. Get All Pending Payments (ADMIN ONLY) ─────────────────────────────
// IMPORTANT: This MUST be defined before /:paymentId to avoid Express
// treating "pending" as a paymentId parameter value.
router.get('/pending/all', auth, authorizeRoles('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'verified_by_user' })
      .populate('order')
      .populate('user', 'name phone')
      .sort('-userClaimedAt');

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 7. Get Order Payment Status ─────────────────────────────────────────
// IMPORTANT: This MUST be defined before /:paymentId too.
router.get('/order/:orderId', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({ order: req.params.orderId });

    if (!payment) {
      return res.json({
        message: 'No payment found for this order',
        payment: null
      });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 2. Customer Claims "I have paid" ────────────────────────────────────
router.post('/order/:orderId/mark-paid', auth, async (req, res) => {
  try {
    const { utr, referenceNumber, screenshot } = req.body;
    
    if (!utr) {
      return res.status(400).json({ message: 'UTR / Transaction ID is required.' });
    }

    let payment = await Payment.findOne({ order: req.params.orderId });
    if (!payment) {
      // In case payment wasn't explicitly generated via QR API endpoint
      payment = new Payment({
        order: req.params.orderId,
        user: req.user._id,
        amount: 0, // Gets populated later when Admin sees it if not captured
        paymentMethod: 'qr_code'
      });
    }

    // Verify user owns this payment (skip for admin)
    const isAdmin = req.user?.id === 'admin-fixed' || req.user?._id === 'admin-fixed';
    if (!isAdmin && payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only verify your own payments' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'Payment has already been processed or is awaiting verification.' });
    }

    // Update payment status & collect proof
    payment.utr = utr;
    payment.referenceNumber = referenceNumber || null;
    payment.screenshot = screenshot || null;
    payment.status = 'verified_by_user';
    payment.userClaimedPaid = true;
    payment.userClaimedAt = new Date();
    await payment.save();

    // Update order status to "pending_verification"
    const order = await Order.findById(payment.order);
    if (order) {
      order.paymentStatus = 'pending_verification';
      // Safety calculation for amount if payment object didn't have it natively
      if (payment.amount === 0) {
        payment.amount = order.totalAmount;
        await payment.save();
      }
      await order.save();
    }

    // Notify owner via WhatsApp (mock, won't crash)
    WhatsAppService.sendNotification(process.env.OWNER_WHATSAPP || '919999999999', {
      type: 'NEW_PAYMENT_ALERT_OWNER',
      orderId: payment.order,
      customerName: req.user?.name || 'Customer'
    });

    res.json({
      message: 'Payment marked as paid. Waiting for admin verification.',
      payment
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 3. Get Payment Details ───────────────────────────────────────────────
router.get('/:paymentId', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('order')
      .populate('user', 'name phone');

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 5. Admin: Approve Payment ───────────────────────────────────────────
router.post('/:paymentId/approve', auth, authorizeRoles('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { verificationNotes } = req.body;

    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (payment.status !== 'verified_by_user') {
      return res.status(400).json({ message: 'Only pending payments can be approved' });
    }

    // Update payment
    payment.status = 'approved_by_admin';
    payment.verifiedBy = req.user._id !== 'admin-fixed' ? req.user._id : undefined;
    payment.verificationNotes = verificationNotes || 'Approved by admin';
    payment.verifiedAt = new Date();
    await payment.save();

    // Update order status — with null check
    const order = await Order.findById(payment.order);
    if (!order) {
      return res.status(404).json({ message: 'Associated order not found' });
    }
    order.status = 'confirmed';
    order.paymentStatus = 'paid';
    await order.save();

    // Emit socket event for real-time update
    const io = req.app.get('io');
    io?.emit('payment_approved', { orderId: order._id, paymentId: payment._id });
    io?.to(order.user.toString()).emit('order_confirmed', order);

    // Notify Customer (mock, won't crash)
    const User = require('../models/User');
    const customer = await User.findById(order.user).catch(() => null);
    if (customer?.phone) {
      WhatsAppService.sendNotification(customer.phone, {
        type: 'PAYMENT_APPROVED',
        orderId: order._id
      });
    }

    res.json({
      message: 'Payment approved successfully! Order confirmed.',
      payment,
      order
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 6. Admin: Reject Payment ────────────────────────────────────────────
router.post('/:paymentId/reject', auth, authorizeRoles('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (payment.status !== 'verified_by_user') {
      return res.status(400).json({ message: 'Only pending payments can be rejected' });
    }

    // Update payment
    payment.status = 'rejected_by_admin';
    payment.verifiedBy = req.user._id !== 'admin-fixed' ? req.user._id : undefined;
    payment.rejectionReason = rejectionReason;
    payment.verifiedAt = new Date();
    await payment.save();

    // Update order status — with null check
    const order = await Order.findById(payment.order);
    if (!order) {
      return res.status(404).json({ message: 'Associated order not found' });
    }
    order.status = 'failed';
    order.paymentStatus = 'failed';
    await order.save();

    // Emit socket event
    const io = req.app.get('io');
    io?.to(order.user.toString()).emit('order_failed', { order, reason: rejectionReason });

    res.json({
      message: 'Payment rejected successfully. Order cancelled.',
      payment,
      order
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
