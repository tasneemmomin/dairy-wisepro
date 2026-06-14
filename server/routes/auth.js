const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// ─── Fixed Admin Credentials (from env vars with hardcoded fallback) ────────
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME     = process.env.ADMIN_NAME || 'Kedar Patil';
// ─── 1. Register (Signup) ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
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
    if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
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

    if (name) user.name = name;
    if (email) user.email = email;
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
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;