const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// ─── Fixed Admin Credentials (from env vars with hardcoded fallback) ────────
const ADMIN_EMAIL    = (process.env.ADMIN_EMAIL || 'vasantdadaagency816@gmail.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'vasantdada123';
const ADMIN_NAME     = process.env.ADMIN_NAME || 'Kedar Patil';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── 1. Register (Signup) ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    name = String(name).trim();
    if (name.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters.' });
    }
    email = String(email).trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (email === ADMIN_EMAIL) {
      return res.status(400).json({ message: 'This email is reserved. Please login as agency owner.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }

    const user = new User({ name, email, password, role: 'CUSTOMER' });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join('; ') });
    }
    res.status(500).json({ message: error.message });
  }
});

// ─── 2. Login ──────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // ── Fixed Admin Account ──────────────────────────────────────────────
    if (ADMIN_PASSWORD && email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminToken = jwt.sign(
        { id: 'admin-fixed', email: ADMIN_EMAIL, role: 'OWNER' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      return res.json({
        token: adminToken,
        user: {
          id: 'admin-fixed',
          name: ADMIN_NAME,
          email: ADMIN_EMAIL,
          role: 'OWNER'
        }
      });
    }

    // ── Normal User Login ────────────────────────────────────────────────
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ─── 3. Get current user (/me) ─────────────────────────────────────────────
// The auth middleware already handles both admin-fixed and regular users,
// populating req.user correctly in both cases.
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// ─── 4. Logout ─────────────────────────────────────────────────────────────
router.post('/logout', auth, async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 5. Get all users ──────────────────────────────────────────────────────
router.get('/users', auth, authorizeRoles('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── 6. Update Profile ─────────────────────────────────────────────────────
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, address } = req.body;

    // Fixed admin has no DB record
    if (req.user?.id === 'admin-fixed' || req.user?._id === 'admin-fixed') {
      return res.json({ message: 'Admin profile is fixed.', user: req.user });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) {
      if (String(name).trim().length < 2) {
        return res.status(400).json({ message: 'Name must be at least 2 characters.' });
      }
      user.name = String(name).trim();
    }
    if (email) {
      const newEmail = String(email).trim().toLowerCase();
      if (newEmail !== user.email) {
        const taken = await User.findOne({ email: newEmail, _id: { $ne: user._id } });
        if (taken) {
          return res.status(400).json({ message: 'That email is already in use by another account.' });
        }
        user.email = newEmail;
      }
    }
    if (address) user.address = { ...user.address, ...address };

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'That email is already in use by another account.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join('; ') });
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;