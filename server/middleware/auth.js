const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Fixed Admin Credentials (same as routes/auth.js) ────────────────────
const ADMIN_EMAIL = 'vasantdadaagency816@gmail.com';
const ADMIN_NAME  = 'Kedar Patil';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, access denied' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fixed admin — not stored in DB
    if (decoded.id === 'admin-fixed') {
      req.user = {
        _id: 'admin-fixed',
        id: 'admin-fixed',
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        role: 'OWNER'
      };
      return next();
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role (${req.user.role}) is not allowed to access this resource`
      });
    }
    next();
  };
};

module.exports = { auth, authorizeRoles };
