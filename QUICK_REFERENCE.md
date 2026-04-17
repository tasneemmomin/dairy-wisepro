# ⚡ DairyOS Pro - Quick Reference Guide

**One-page reference for developers working on DairyOS Pro**

---

## 🚀 Quick Start (5 minutes)

```bash
# 1. Backend setup
cd server
npm install
# Create .env:
# MONGODB_URI=mongodb+srv://...
# JWT_SECRET=random-key
# PORT=5000
npm run dev

# 2. Frontend setup (new terminal)
cd client
npm install
# Create .env (copy from .env.example)
npm run dev

# 3. Open http://localhost:5173
```

---

## 📱 Key Files to Know

| File | Purpose | Type |
|------|---------|------|
| `server/models/User.js` | User with Firebase OTP | Model |
| `server/models/Payment.js` | Payment tracking | Model (NEW) |
| `server/routes/auth.js` | OTP authentication | Routes |
| `server/routes/payments.js` | Payment verification | Routes (NEW) |
| `client/context/AuthContext.jsx` | Firebase OTP logic | Context |
| `client/pages/LoginPage.jsx` | OTP login UI | Page |
| `client/pages/CartPage.jsx` | QR payment flow | Page |
| `client/pages/AdminOrders.jsx` | Payment dashboard | Page |
| `SETUP.md` | Complete guide | Docs |

---

## 🔐 Authentication

### Login Flow
```javascript
// Frontend
const { sendOTP, verifyOTP } = useAuth();
await sendOTP(phone);           // Send OTP
await verifyOTP(otp, phone);    // Verify & create account

// Backend
POST /api/auth/send-otp         // Validate phone
POST /api/auth/verify-otp       // Check Firebase, create user
```

### Session
```javascript
// Token stored in localStorage
setToken(jwtToken);            // 30-day expiry
// Restored on page refresh via AuthContext
```

---

## 💰 Payment System

### Payment Flow
```javascript
// 1. Create order
const order = await API.post('/orders', { items, address });

// 2. Generate QR
const payment = await API.post('/payments/generate-qr', {
  orderId: order._id,
  amount: order.totalAmount
});
// Returns { qrCode: base64, amount, status }

// 3. Customer marks paid
await API.post(`/payments/${payment._id}/mark-paid`);
// Order.paymentStatus = "pending_verification"

// 4. Admin approves
await API.post(`/payments/${payment._id}/approve`);
// Order.status = "confirmed"

// 5. OR Admin rejects
await API.post(`/payments/${payment._id}/reject`, {
  rejectionReason: "Payment mismatch"
});
// Order.status = "failed"
```

### Payment Statuses
```
pending → verified_by_user → approved_by_admin → completed
                           → rejected_by_admin → [end]
```

### Order Payments
```
Order.paymentStatus:
- pending (not paid)
- pending_verification (customer claims paid)
- paid (admin approved)
- failed (admin rejected)
```

---

## 🛒 Order Lifecycle

```
User adds items
   ↓
Checkout → Create order (pending)
   ↓
Generate QR payment
   ↓
Customer pays → Click "I have Paid"
   ↓
Admin approves → Order "confirmed"
   ↓
Admin processes → Order "processing"
   ↓
Assign delivery → Order "out_for_delivery"
   ↓
Mark delivered → Order "delivered"
```

---

## 📊 Database Collections

```javascript
// User
{
  _id, name, phone, firebaseUID, role, 
  address, isActive, createdAt, lastLogin
}

// Order
{
  _id, user, items[], totalAmount, 
  status, paymentMethod, paymentStatus,
  deliveryAddress, deliveryAgent, 
  createdAt, updatedAt
}

// Payment (NEW)
{
  _id, order, user, amount, qrCode,
  status, userClaimedPaid, userClaimedAt,
  verifiedBy, verificationNotes, verifiedAt,
  rejectionReason, createdAt, updatedAt
}

// Product
{
  _id, name, category, price, stock,
  image, description, unit, createdAt
}
```

---

## 🔧 Common Tasks

### Add a New API Endpoint

**Backend:**
```javascript
// server/routes/myroute.js
router.post('/new-endpoint', auth, async (req, res) => {
  try {
    const { data } = req.body;
    // Your logic
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// server/server.js
const myRoutes = require('./routes/myroute');
app.use('/api/myroute', myRoutes);
```

**Frontend:**
```javascript
// client/src/pages/MyPage.jsx
const response = await API.post('/myroute/new-endpoint', { data });
```

---

### Update Order Status

**Backend:** ✅ Already exists
```javascript
PUT /api/orders/{orderId}/status
{ status: 'processing' }
```

**Frontend:**
```javascript
// client/src/pages/AdminOrders.jsx
await API.put(`/orders/${orderId}/status`, { status: 'processing' });
```

---

### Create Admin User

**Option 1: MongoDB**
```javascript
db.users.insertOne({
  name: "Admin Name",
  phone: "9876543210",
  role: "ADMIN",
  isActive: true,
  createdAt: new Date()
})
```

**Option 2: API**
```javascript
POST /api/auth/create-staff
{
  name: "Admin Name",
  phone: "9876543210",
  role: "ADMIN"
}
```

---

## 🐛 Debugging Tips

### Check Browser Console
```javascript
// Verify authentication
console.log(localStorage.getItem('token'));
console.log(JSON.parse(localStorage.getItem('user')));

// Check API response
// Network tab → XHR → see requests
```

### Check Server Logs
```bash
# Terminal with npm run dev
# Shows incoming requests and errors
```

### Firebase Issues
```javascript
// Check Firebase errors
console.error('Firebase error:', error.code);
// 'auth/too-many-requests' = too many OTP attempts
// 'auth/invalid-phone-number' = phone format issue
```

### MongoDB Issues
```
// Check MongoDB connection
// Try connecting via MongoDB Compass
// Verify MONGODB_URI in .env
```

---

## 💾 Environment Variables

### Backend (.env)
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dairyospro
JWT_SECRET=your-secret-random-string
PORT=5000
```

### Frontend (.env)
```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## 🔑 User Roles

| Role | Permissions |
|------|------------|
| OWNER | All access, create staff |
| ADMIN | Orders, payments, analytics |
| STAFF | Orders, support |
| DELIVERY | Orders (assigned), delivery |
| CUSTOMER | Orders, cart, wishlist |

---

## 📦 Main Dependencies

**Backend:**
- express (server)
- mongoose (database)
- firebase-admin (OTP)
- jsonwebtoken (auth)
- qrcode (payments)
- socket.io (realtime)

**Frontend:**
- react (UI)
- react-router (navigation)
- firebase (OTP)
- axios (API)
- tailwindcss (styling)
- framer-motion (animations)

---

## ✅ Testing Checklist

```
[ ] OTP login works
[ ] User created in MongoDB
[ ] Cart adds/removes items
[ ] Order creates successfully
[ ] QR payment shows
[ ] Customer claims paid
[ ] Admin sees pending payment
[ ] Admin approves payment
[ ] Order status updates
[ ] No console errors
```

---

## 🚨 Common Errors & Solutions

| Error | Solution |
|-------|----------|
| "Invalid phone" | Phone must be 10 digits, start with 6-9 |
| "OTP expired" | User took too long, resend OTP |
| "Payment not found" | Order created but QR not generated |
| "401 Unauthorized" | Token expired or invalid, login again |
| "MongoDB connection failed" | Check MONGODB_URI in .env |
| "Firebase not initialized" | Check Firebase config in .env |
| "QR code not showing" | Ensure qrcode package installed |

---

## 📞 UPI Configuration

**Edit this file to change UPI ID:**
```
server/routes/payments.js
Line ~5: const UPI_ID = 'vasantdada@bank';
```

Change to your UPI ID, e.g., `'yourname@upi'`

---

## 🔗 API Response Format

### Success (200)
```json
{
  "_id": "...",
  "name": "...",
  "data": "..."
}
```

### Error (4xx/5xx)
```json
{
  "message": "Error description"
}
```

### Paginated
```json
{
  "total": 100,
  "page": 1,
  "data": [...]
}
```

---

## 📈 Performance Tips

1. **Lazy load** images
2. **Minimize** API calls
3. **Cache** product list
4. **Debounce** search
5. **Optimize** bundle size
6. **Use** CDN for static files

---

## 🛡️ Security Checklist

- [ ] No passwords in code
- [ ] .env not committed
- [ ] JWT secret is strong (32+ chars)
- [ ] Firebase rules restrictive
- [ ] CORS whitelist configured
- [ ] Input validation on all forms
- [ ] Role checks on admin endpoints

---

## 🚀 Deployment

1. **Build:** `npm run build`
2. **Test:** `npm run preview`
3. **Deploy:** Push to Vercel/Netlify/server
4. **Verify:** Test authentication & payments
5. **Monitor:** Check error rates

See DEPLOYMENT.md for details.

---

## 📚 Documentation

- **SETUP.md** - Complete setup guide
- **DEPLOYMENT.md** - Deployment checklist
- **README.md** - Project overview
- **IMPLEMENTATION_SUMMARY.md** - What was built

---

## 🎯 Quick Links

- Firebase Console: https://console.firebase.google.com
- MongoDB Atlas: https://cloud.mongodb.com
- GitHub: [Your Repo]
- Docs: SETUP.md

---

## 💡 Pro Tips

1. **Use MongoDB Compass** for database debugging
2. **Use Postman** to test APIs before frontend
3. **Use Firebase Console** for authentication debugging
4. **Use Browser DevTools** to check network requests
5. **Git commit** before major changes

---

**Last Updated:** April 2026  
**Version:** 1.0.0

For detailed info, see [SETUP.md](./SETUP.md) or [DEPLOYMENT.md](./DEPLOYMENT.md)

🚀 **Happy coding!** 🥛
