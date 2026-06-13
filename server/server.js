require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

// Fix DNS SRV resolution issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Fix Node.js DNS resolution timeout
const { Resolver } = require('dns').promises;
const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const subscriptionRoutes = require('./routes/subscriptions');
const vendorRoutes = require('./routes/vendors');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const billingRoutes = require('./routes/billing');
const deliveryRoutes = require('./routes/delivery');
const seedDatabase = require('./utils/seed');
const runMigrations = require('./utils/migrate');

const app = express();
const server = http.createServer(app);

// ─── Allowed Origins ─────────────────────────────────────────────────────────
// Add your Vercel production URL here (or set CLIENT_URL in env)
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://dairy-ospro.vercel.app',
  // Support any additional origin from CLIENT_URL env var (set this on Render)
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, same-origin)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} is not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store io instance
app.set('io', io);

// ─── Security & Performance Middleware ───────────────────────────────────────
app.use(helmet({
  // Allow loading images from external sources (for QR codes etc.)
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pre-flight for all routes
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/delivery', deliveryRoutes);

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'DairyOS Pro API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ─── Root route (Render keep-alive friendly) ─────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'DairyOS Pro API is running', status: 'ok' });
});

// ─── Test endpoint for debugging ────────────────────────────────────────────
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ message: err.message });
  }
  res.status(500).json({ message: 'Internal server error' });
});

// ─── Socket.io ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ─── Connect to MongoDB and start server ─────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dairyospro';

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 15000,
  family: 4,
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  minPoolSize: 2
})
  .then(async () => {
    console.log('MongoDB connected');
    await runMigrations(mongoose.connection.db);
    await seedDatabase();
    server.listen(PORT, () => {
      console.log(`\n  DairyOS Pro Server running on http://localhost:${PORT}`);
      console.log('  ==========================================\n');
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.log('\n  Make sure MongoDB is running on your machine.');
    console.log('  Download: https://www.mongodb.com/try/download/community\n');
    process.exit(1);
  });
