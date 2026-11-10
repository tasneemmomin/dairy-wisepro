require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

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

// Safety: never let the server crash because JWT_SECRET is missing
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'dairyospro_dev_secret_change_me_in_production_2026';
  console.warn('  ⚠ JWT_SECRET not set — using insecure development fallback. SET THIS IN PRODUCTION!');
}

const app = express();
const server = http.createServer(app);

// Render / proxies sit in front in production
app.set('trust proxy', 1);

// ─── Allowed Origins ─────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://dairy-wisepro-6nzr.vercel.app',
  'https://dairy-wisepro-6nzr-pvt4pjleh-tasneemmomins-projects.vercel.app',
  // Support any additional origin from CLIENT_URL env var (set this on Render)
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith('.vercel.app')
    ) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} is not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
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

// ─── Public storefront configuration (no auth — safe values only) ────────────
// Keeps the UPI ID / WhatsApp number in one place (server env) so the owner can
// change them without redeploying the frontend.
app.get('/api/config', (req, res) => {
  res.json({
    upiId: process.env.UPI_ID || '9975882125@okbizaxis',
    agencyName: 'Vasantdada Agency',
    whatsappNumber: process.env.OWNER_WHATSAPP || '918766997752'
  });
});

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

// ─── 404 for unknown API routes (prevents HTML/JSON confusion) ───────────────
app.use('/api', (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);

  if (err.message?.includes('CORS')) {
    return res.status(403).json({ message: err.message });
  }

  // Malformed ObjectId — return 400, not 500
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path || 'ID'} format` });
  }

  // Mongoose validation — return 400 with details
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: details.join('; ') });
  }

  // Oversized JSON body
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Payload too large' });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }

  res.status(500).json({ message: 'Internal server error' });
});

// ─── Socket.io ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (userId) => {
    if (userId) socket.join(String(userId));
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ─── Connect to MongoDB and start server ─────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dairyospro';
const LOCAL_MONGODB_FALLBACK = process.env.MONGODB_LOCAL_FALLBACK || 'mongodb://127.0.0.1:27017/dairyospro';

// Optional last-resort fallback: an EPHEMERAL in-process MongoDB. Used when no
// real database is reachable (e.g. deleted Atlas cluster, no local Mongo) so the
// app still boots fully functional. Data resets on restart — set a valid
// MONGODB_URI to get persistent storage; the chain always prefers it.
let MongoMemoryReplSet = null;
try { ({ MongoMemoryReplSet } = require('mongodb-memory-server')); } catch { /* package not installed */ }
let memServer = null;
const isLocalUri = (uri) => uri.includes('127.0.0.1') || uri.includes('localhost');

// Public resolvers used ONLY if the system DNS fails to resolve Atlas SRV records
// (corporate networks / firewalls / ISP DNS issues). Never applied globally.
const PUBLIC_DNS = ['8.8.8.8', '8.8.4.4', '1.1.1.1'];

const MONGO_OPTS = {
  serverSelectionTimeoutMS: 15000,
  family: 4,
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  minPoolSize: 2
};

async function tryConnect(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, MONGO_OPTS);
}

// If SRV lookup itself failed, retry using public DNS servers, then restore defaults
async function tryWithPublicDns(uri) {
  try {
    dns.setServers(PUBLIC_DNS);
    await tryConnect(uri);
  } finally {
    // Restore system resolvers for the rest of the process
    try { dns.setServers([]); } catch { /* ignore */ }
  }
}

function isDnsError(err) {
  return /querySrv|queryTxt|ENOTFOUND|ETIMEOUT|EVSRV|ESERVFAIL/i.test(err?.message || '');
}

let assertedServer = false;
let dbBootstrapped = false;

// Run migrations + seed once a DB connection exists (idempotent)
async function bootstrapDb() {
  if (dbBootstrapped || mongoose.connection.readyState !== 1) return;
  await runMigrations(mongoose.connection.db);
  await seedDatabase();
  dbBootstrapped = true;
}

// Full connection chain: primary URI -> public-DNS retry -> local fallback.
// Returns true if connected, false otherwise (never throws past the caller).
async function connectMongoChain() {
  if (mongoose.connection.readyState === 1) return true;
  try {
    await tryConnect(MONGODB_URI);
    return true;
  } catch (err) {
    const dnsRelated = isDnsError(err);
    console.warn(`MongoDB primary connection failed: ${err.message}`);

    // DNS problem? Retry the SAME URI via public resolvers
    if (dnsRelated && !isLocalUri(MONGODB_URI)) {
      console.warn('Retrying DNS resolution via public resolvers (8.8.8.8 / 1.1.1.1)...');
      try {
        await tryWithPublicDns(MONGODB_URI);
        return true;
      } catch (err2) {
        console.warn(`Public-DNS retry failed: ${err2.message}`);
      }
    }

    // Still down? Fall back to a local MongoDB if the primary isn't local
    if (!isLocalUri(MONGODB_URI)) {
      console.warn('Falling back to local MongoDB (data will be local-only until the cloud URI is reachable)...');
      try {
        await tryConnect(LOCAL_MONGODB_FALLBACK);
        return true;
      } catch (err3) {
        console.warn(`Local fallback failed: ${err3.message}`);
      }
    }

    // Last resort: ephemeral in-memory database so the service stays usable
    if (MongoMemoryReplSet && process.env.DISABLE_MEMORY_DB !== '1') {
      try {
        if (!memServer) {
          console.warn('⚠ No real database reachable — starting EPHEMERAL in-memory MongoDB.');
          console.warn('  Data will reset on restart. Set a valid MONGODB_URI for persistent storage.');
          memServer = await MongoMemoryReplSet.create({
            replSet: { count: 1, dbName: 'dairyospro', storageEngine: 'wiredTiger' }
          });
        }
        await tryConnect(memServer.getUri('dairyospro'));
        return true;
      } catch (err4) {
        console.warn(`In-memory fallback failed: ${err4.message}`);
      }
    }
    return false;
  }
}

async function startMongoAndServer() {
  // 1) Start the HTTP server FIRST so deploys and health checks succeed
  //    even while the database is still unreachable.
  server.on('error', (e) => {
    console.error('Server listen error:', e.message);
    process.exit(1);
  });
  server.listen(PORT, () => {
    assertedServer = true;
    console.log(`\n  DairyOS Pro Server running on http://localhost:${PORT}`);
    console.log('  ==========================================\n');
  });

  // 2) Connect to MongoDB. If it fails now, keep retrying in the background
  //    — never crash-loop the whole service (Render free tier wakes services
  //    on request; a hard exit here would make the API permanently unreachable).
  const connected = await connectMongoChain();
  if (connected) {
    console.log('MongoDB connected');
    await bootstrapDb();
    return;
  }

  console.warn('⚠ Started WITHOUT MongoDB — retrying every 30s in the background...');
  const retryTimer = setInterval(async () => {
    try {
      if (await connectMongoChain()) {
        clearInterval(retryTimer);
        console.log('✓ MongoDB connected (delayed startup)');
        await bootstrapDb();
      }
    } catch (err) {
      console.warn(`MongoDB retry failed: ${err.message}`);
    }
  }, 30000);
}

// Visibility into mid-session network loss / recovery (mongoose auto-reconnects)
mongoose.connection.on('disconnected', () => {
  if (assertedServer) console.warn('⚠ MongoDB disconnected — mongoose will keep retrying...');
});
mongoose.connection.on('reconnected', () => {
  console.log('✓ MongoDB reconnected');
});

startMongoAndServer().catch((err) => {
  // Do NOT process.exit() — the HTTP server is already listening and the
  // DB retry loop keeps the service recoverable.
  console.error('Startup error:', err.message);
});
