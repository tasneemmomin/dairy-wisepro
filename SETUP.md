# 🥛 DairyOS Pro - Implementation Guide

## 📋 What's New

This document outlines all the features implemented for the DairyOS Pro ecommerce app for dairy products.

---

## 🔐 1. Firebase OTP Authentication

### Overview
- **Removed** password-based login ✓
- **Implemented** Firebase Phone OTP (WhatsApp-style login) ✓
- **Maintained** session persistence ✓

### How It Works
```
User → Enters Phone → Firebase OTP → Confirms OTP → Creates/Updates User → JWT Token
```

### Setup Steps

**1.1 Firebase Console Setup:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (if not already done)
3. Enable **Authentication** → **Phone** (Enable Phone Sign-in)
4. Add reCAPTCHA v3 verification (optional but recommended)
5. Copy your Firebase credentials

**1.2 Frontend Configuration:**
Create `.env` file in `client/` (copy from `.env.example`):
```bash
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**1.3 Backend Configuration:**
The backend already has Firebase Admin SDK configured in `server/firebaseAdmin.js`

---

## 💰 2. Manual QR-Based Payment System

### Overview
- **No Razorpay** - Uses manual UPI QR codes ✓
- **Two-step verification** - Customer confirms → Admin approves ✓
- **Safe payment flow** - Prevents accidental approvals ✓

### Payment Flow
```
1. Customer sees QR Code → Scans UPI ID
2. Customer pays → Returns to app
3. Customer clicks "I have Paid"
4. Payment marked as "pending_verification"
5. Admin Dashboard shows pending payments
6. Admin reviews & approves/rejects
7. Order status updates accordingly
```

### Database Models

**Order Model:**
```javascript
{
  _id: ObjectId,
  user: ObjectId,
  items: [...],
  totalAmount: Number,
  status: 'pending' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'failed',
  paymentMethod: 'qr_code' | 'cod',
  paymentStatus: 'pending' | 'pending_verification' | 'paid' | 'failed'
}
```

**Payment Model:**
```javascript
{
  _id: ObjectId,
  order: ObjectId,
  user: ObjectId,
  amount: Number,
  qrCode: String (Base64),
  status: 'pending' | 'verified_by_user' | 'approved_by_admin' | 'rejected_by_admin' | 'completed',
  userClaimedPaid: Boolean,
  userClaimedAt: Date,
  verifiedBy: ObjectId,
  verificationNotes: String,
  verifiedAt: Date,
  rejectionReason: String
}
```

### API Endpoints

**Customer Endpoints:**
- `POST /api/payments/generate-qr` - Generate QR code for order
- `POST /api/payments/{paymentId}/mark-paid` - Mark as "I have paid"
- `GET /api/payments/order/{orderId}` - Get payment status

**Admin Endpoints:**
- `GET /api/payments/pending/all` - Get all pending payments
- `POST /api/payments/{paymentId}/approve` - Approve payment
- `POST /api/payments/{paymentId}/reject` - Reject payment

### UPI Configuration
Edit the UPI ID in `server/routes/payments.js`:
```javascript
const UPI_ID = 'vasantdada@bank'; // Change this to your UPI ID
```

---

## 👤 3. User System with Firebase

### User Model (Updated)
```javascript
{
  _id: ObjectId,
  name: String,
  phone: String         // Unique
  email: String,
  firebaseUID: String,  // Firebase user ID
  role: 'OWNER' | 'ADMIN' | 'STAFF' | 'DELIVERY' | 'CUSTOMER',
  address: Object,
  lastLogin: Date,
  createdAt: Date
}
```

### Login/Logout
- **Login:** Firebase OTP → Backend verification → JWT token
- **Logout:** Clear localStorage + Firebase signout
- **Session:** Maintained via JWT token (30 days expiration)

---

## 🛒 4. Complete Order System

### Order Lifecycle
```
1. Customer adds items to cart
2. Checkout → Create order (status: "pending")
3. Generate QR code payment
4. Customer claims paid
5. Payment: "pending_verification"
6. Admin approves → Order: "confirmed"
7. Admin processes → Order: "processing"
8. Assign delivery agent → Order: "out_for_delivery"
9. Mark delivered → Order: "delivered"
```

### Order Status Progression
```
pending
  ↓
confirmed (after payment approval)
  ↓
processing
  ↓
out_for_delivery
  ↓
delivered
```

Or at any stage → cancelled

---

## 📲 5. WhatsApp Integration (Ready for Implementation)

### Implementation Guide

Add this function to `server/routes/orders.js`:

```javascript
const generateWhatsAppMessage = (order) => {
  const items = order.items.map(i => `${i.name} x${i.quantity}`).join(', ');
  return `
Hi! 👋

Order placed successfully! 

📦 Order #${order._id.slice(-6)}
💚 Items: ${items}
💰 Total: ₹${order.totalAmount}

Thank you for ordering from Vasant Dairy Agency!

Next: Watch for payment confirmation.
  `;
};

// In order creation route
const whatsappUrl = `https://wa.me/918766997752?text=${encodeURIComponent(generateWhatsAppMessage(order))}`;
```

Frontend button:
```jsx
<a 
  href={whatsappUrl}
  className="px-4 py-2 bg-green-500 text-white rounded-lg"
  target="_blank"
  rel="noopener noreferrer"
>
  Share on WhatsApp
</a>
```

---

## 🔔 6. Firebase Cloud Messaging (Setup)

### Install FCM
```bash
npm install firebase-messaging
```

### Generate Service Worker
Create `client/public/firebase-messaging-sw.js`:
```javascript
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging.js');

const firebaseConfig = { /* Your config */ };
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png'
  };
  
  return self.registration.showNotification(notificationTitle, notificationOptions);
});
```

### Backend Notification Sending
```javascript
const admin = require('firebase-admin');

async function sendNotification(userToken, title, body) {
  return admin.messaging().send({
    notification: { title, body },
    token: userToken
  });
}
```

---

## ⚙️ 7. Admin Panel Features

### Payment Verification Dashboard
Location: `/admin/orders` → Switch to "Pending Payments" tab

**Features:**
- ✓ View all customers claiming "paid"
- ✓ Review payment details
- ✓ Approve payment → Order confirmed
- ✓ Reject with reason → Customer notified

### Order Management
Location: `/admin/orders`

**Features:**
- ✓ View all orders with status
- ✓ Filter by status
- ✓ Update order status
- ✓ Track payment status

---

## 🔧 8. Server Setup Instructions

### Install Dependencies
```bash
cd server
npm install
```

### Environment Variables (`.env`)
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dairyospro
JWT_SECRET=your-super-secret-key
PORT=5000
```

### Start Server
```bash
npm run dev        # Development
npm start          # Production
```

---

## 🎨 9. Frontend Setup

### Install Dependencies
```bash
cd client
npm install
```

### Add Firebase Config
Create `.env`:
```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# ... (see Firebase section above)
```

### Start Development
```bash
npm run dev
```

Open http://localhost:5173

---

## 📝 10. File Structure

```
server/
├── routes/
│   ├── auth.js          ← Firebase OTP authentication
│   ├── payments.js      ← QR payment endpoints (NEW)
│   ├── orders.js        ← Order management
│   └── ...
├── models/
│   ├── User.js          ← Updated for Firebase
│   ├── Order.js         ← Updated with payment status
│   ├── Payment.js       ← NEW Payment model
│   └── ...
└── server.js

client/
├── src/
│   ├── context/
│   │   ├── AuthContext.jsx      ← Firebase OTP
│   │   ├── CartContext.jsx
│   │   └── SocketContext.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx        ← OTP UI (UPDATED)
│   │   ├── CartPage.jsx         ← QR payment flow (UPDATED)
│   │   ├── AdminOrders.jsx      ← Payment verification (UPDATED)
│   │   └── ...
│   ├── components/
│   │   ├── PaymentModal.jsx     ← UPI QR UI (UPDATED)
│   │   ├── Navbar.jsx
│   │   └── ...
│   └── ...
└── .env.example         ← Firebase config template (NEW)
```

---

## 🚀 11. Testing Workflows

### Test OTP Login
1. Go to http://localhost:5173/login
2. Create Account tab
3. Enter phone (Firebase will send OTP)
4. Verify OTP
5. Should redirect to shop

### Test Order & Payment
1. Add items to cart
2. Proceed to checkout
3. See UPI QR code modal
4. Click "I have Paid" (simulates payment)
5. Admin sees in Pending Payments tab
6. Admin approves → Order confirmed

### Test Admin Payment Approval
1. Login as admin
2. Go to `/admin/orders`
3. Click "Pending Payments" tab
4. View customer payments
5. Click Approve/Reject

---

## 🔒 12. Security Notes

### Authentication
- ✓ Firebase handles OTP securely
- ✓ JWT tokens expire in 30 days
- ✓ Tokens stored in localStorage (consider httpOnly cookies for production)
- ✓ Role-based access control on all routes

### Payments
- ✓ No actual payment processing (manual verification)
- ✓ Admin approval required
- ✓ Payment history stored in database
- ✓ Rejection reasons logged

### Data Safety
- ✓ Passwords never stored (Firebase OTP)
- ✓ reCAPTCHA v3 for form protection
- ✓ Input validation on all endpoints
- ✓ CORS configured

---

## 📞 13. Admin Accounts

### Create Admin Account
```bash
# In MongoDB compass or terminal:
db.users.insertOne({
  name: "Kedar Patil",
  phone: "9876543210",
  role: "OWNER",
  isActive: true,
  createdAt: new Date()
})
```

Or use API:
```bash
POST /api/auth/create-staff
{
  "name": "Admin Name",
  "phone": "9876543210",
  "role": "ADMIN"
}
```

---

## 🐛 14. Troubleshooting

### Firebase OTP Not Sending
- Check Firebase console → Authentication → Phone enabled
- Verify phone number format (10 digits, starts with 6-9)
- Check reCAPTCHA configuration

### QR Code Not Generating
- Ensure `qrcode` package installed: `npm install qrcode`
- Check UPI ID format in `payments.js`
- Verify MongoDB connection

### Admin Notifications Not Working
- Check Socket.IO connection in browser console
- Verify Socket.IO CORS settings
- Check browser notifications permission

### Payment APIs Returning 401
- Check JWT token in localStorage
- Verify token not expired
- Logout and login again

---

##🎓 15. Next Steps (Optional Enhancements)

1. **Email Notifications**
   - Send order confirmation emails
   - Payment status email updates

2. **SMS Integration** (Twilio)
   - Order updates via SMS
   - Payment verification SMS

3. **Analytics Dashboard**
   - Order trends
   - Payment success rate
   - Revenue tracking

4. **Customer Reviews**
   - Rate products
   - Review orders

5. **Subscription Management**
   - Recurring orders
   - Flexible schedules

6. **Delivery Tracking**
   - Real-time GPS tracking
   - Delivery agent app

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review Firebase documentation
3. Check console logs (F12)
4. Verify .env configuration

---

**Last Updated:** April 2026
**Version:** 1.0.0 (Production Ready)

Good luck! 🚀🥛
