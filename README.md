# 🥛 DairyOS Pro - Complete Ecommerce Platform

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://github.com)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

A complete ecommerce platform for dairy products with modern features like Firebase OTP authentication, manual QR-based payments, and admin dashboard.

---

## ✨ Key Features

### 🔐 Authentication
- ✅ **Firebase Phone OTP** - No password needed (WhatsApp-style login)
- ✅ **Session Persistence** - Users stay logged in
- ✅ **Multi-role Support** - Owner, Admin, Staff, Delivery, Customer

### 🛒 Shopping Experience
- ✅ **Product Catalog** - Browse fresh dairy products
- ✅ **Shopping Cart** - Add/remove items dynamically
- ✅ **Order Placement** - Easy checkout process
- ✅ **Order History** - Track all orders

### 💰 Payment System
- ✅ **QR-Based Payments** - Manual UPI QR codes
- ✅ **Two-Step Verification** - Customer claims paid → Admin approves
- ✅ **No Razorpay/Gateway** - Simple manual verification
- ✅ **Payment Tracking** - See payment status in real-time

### 📊 Admin Dashboard
- ✅ **Order Management** - View, filter, update order status
- ✅ **Payment Verification** - Approve/reject pending payments
- ✅ **Customer Management** - View all customers
- ✅ **Order Analytics** - Track orders, deliveries, revenue

### 📦 Order Management
- ✅ **Order Status Tracking** - Pending → Confirmed → Processing → Delivered
- ✅ **Delivery Tracking** - Assign delivery agents
- ✅ **Order History** - Customer can see past orders
- ✅ **Order Cancellation** - Cancel orders if needed

### 🔔 Notifications (Ready)
- ✅ **Architecture in place** for Firebase Cloud Messaging
- ✅ **Socket.IO integration** for real-time updates
- ✅ **Email/SMS ready** for future integration

### 📱 Responsive Design
- ✅ **Mobile-first** design
- ✅ **Tablet optimized** layouts
- ✅ **Desktop compatible** interface

---

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI library
- **React Router v6** - Navigation
- **Tailwind CSS** - Styling
- **Firebase** - Phone authentication
- **Socket.IO Client** - Real-time updates
- **Framer Motion** - Animations
- **Axios** - HTTP client

### Backend
- **Node.js + Express** - Server
- **MongoDB Atlas** - Database
- **Mongoose** - ODM
- **Firebase Admin SDK** - Phone OTP verification
- **Socket.IO** - Real-time communication
- **JWT** - Token-based auth

### Tools & Services
- **Vite** - Build tool
- **Framer Motion** - Animations
- **React Hot Toast** - Notifications
- **Lucide React** - Icons
- **QRCode** - QR generation

---

## 📁 Project Structure

```
DairyOSPro/
├── server/                 # Backend
│   ├── models/            # MongoDB schemas
│   │   ├── User.js        # User with Firebase OTP
│   │   ├── Order.js       # Orders with payment tracking
│   │   ├── Payment.js     # Payment records (NEW)
│   │   ├── Product.js
│   │   └── ...
│   ├── routes/
│   │   ├── auth.js        # Firebase OTP authentication
│   │   ├── payments.js    # Payment verification (NEW)
│   │   ├── orders.js      # Order management
│   │   └── ...
│   ├── middleware/
│   │   └── auth.js        # JWT verification
│   ├── server.js          # Main app
│   └── package.json
│
├── client/                # Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx         # OTP login (UPDATED)
│   │   │   ├── CartPage.jsx          # QR payments (UPDATED)
│   │   │   ├── AdminOrders.jsx       # Payment verification (UPDATED)
│   │   │   ├── HomePage.jsx
│   │   │   ├── ShopPage.jsx
│   │   │   ├── OrdersPage.jsx
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── PaymentModal.jsx      # UPI QR modal (UPDATED)
│   │   │   ├── Navbar.jsx
│   │   │   └── ...
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Firebase OTP (UPDATED)
│   │   │   ├── CartContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── services/
│   │   │   └── api.js                # API client
│   │   └── App.jsx
│   ├── .env.example       # Firebase config template (NEW)
│   └── package.json
│
├── SETUP.md               # Complete setup guide (NEW)
├── DEPLOYMENT.md          # Deployment checklist (NEW)
└── README.md              # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v14+ 
- MongoDB Atlas account
- Firebase project
- npm or yarn

### Installation

**1. Clone & Install**
```bash
# Backend
cd server
npm install

# Frontend
cd client
npm install
```

**2. Configure Firebase**
```bash
# Get credentials from Firebase Console
# Copy client/.env.example to client/.env
# Fill in your Firebase credentials
cp .env.example .env
```

**3. Configure Backend**
```bash
# Create server/.env
echo "MONGODB_URI=mongodb+srv://..." > .env
echo "JWT_SECRET=your-secret-key" >> .env
echo "PORT=5000" >> .env
```

**4. Start Development**
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```

**5. Open Browser**
```
http://localhost:5173
```

---

## 📖 Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup & configuration guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment checklist & procedures

---

## 🔐 Authentication Flow

```
User enters phone
     ↓
Firebase sends OTP
     ↓
User enters OTP
     ↓
Firebase verifies
     ↓
Backend creates/updates user in MongoDB
     ↓
Backend generates JWT token
     ↓
Frontend stores token in localStorage
     ↓
User logged in!
```

---

## 💰 Payment Flow

```
1. Customer places order
        ↓
2. QR code generated
        ↓
3. Customer scans & pays via UPI
        ↓
4. Customer clicks "I have Paid"
        ↓
5. Payment marked "pending_verification"
        ↓
6. Admin sees in dashboard
        ↓
7. Admin reviews & approves
        ↓
8. Order status → "confirmed"
        ↓
9. Order prepared & dispatched
        ↓
10. Customer receives order
```

---

## 🛠️ Configuration

### UPI ID
Edit `server/routes/payments.js`:
```javascript
const UPI_ID = 'vasantdada@bank'; // Change to your UPI ID
```

### Database Connection
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dairyospro
```

### JWT Secret
```bash
JWT_SECRET=generate-a-long-random-string-here
```

---

## 🧪 Testing

### Test OTP Login
1. Go to http://localhost:5173/login
2. Create Account tab
3. Enter 10-digit phone number
4. Firebase sends OTP
5. Enter OTP
6. Should create account & login

### Test Order & Payment
1. Add items to cart
2. Create account or login
3. Checkout
4. See UPI QR modal
5. Click "I have Paid"
6. Go to `/admin` to approve payment

### Test Admin Panel
1. Create admin account in MongoDB
2. Login as admin
3. Go to `/admin/orders`
4. View and manage orders
5. See pending payments tab

---

## 📞 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP & create user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `PUT /api/auth/profile` - Update profile

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my` - Get my orders
- `GET /api/orders` - Get all orders (admin)
- `PUT /api/orders/{id}/status` - Update order status

### Payments
- `POST /api/payments/generate-qr` - Generate QR
- `POST /api/payments/{id}/mark-paid` - Mark as paid
- `GET /api/payments/pending/all` - Get pending (admin)
- `POST /api/payments/{id}/approve` - Approve (admin)
- `POST /api/payments/{id}/reject` - Reject (admin)

---

##🆘 Troubleshooting

### Firebase OTP Not Working
- Verify phone number format (10 digits, starts with 6-9)
- Check Firebase console → Authentication enabled
- Check browser console for errors

### QR Code Not Showing
- Ensure `qrcode` package installed
- Check MongoDB connection
- Verify UPI ID format

### Payment APIs Return 401
- Check JWT token in localStorage
- Verify token not expired
- Logout and login again

For detailed troubleshooting, see [SETUP.md](./SETUP.md#14-troubleshooting)

---

## 📝 Features Implemented ✅

### Authentication & Security
- [x] Firebase Phone OTP
- [x] JWT token-based auth
- [x] Session persistence
- [x] Role-based access control
- [x] reCAPTCHA integration (ready)

### Order Management
- [x] Create orders
- [x] Order history
- [x] Order status tracking
- [x] Order cancellation
- [x] Delivery tracking

### Payment System
- [x] QR-based payments
- [x] Manual verification
- [x] Payment approval workflow
- [x] Payment rejection with reason
- [x] Payment history

### Admin Dashboard
- [x] Order management
- [x] Payment verification
- [x] Customer management
- [x] Order analytics
- [x] Staff management

### User Experience
- [x] Responsive design
- [x] Real-time updates (Socket.IO)
- [x] Toast notifications
- [x] Loading states
- [x] Error handling

---

## 🚀 Future Enhancements

- [ ] Firebase Cloud Messaging (notifications)
- [ ] Email notifications
- [ ] SMS notifications (Twilio)
- [ ] WhatsApp business integration
- [ ] Subscription orders
- [ ] Delivery agent GPS tracking
- [ ] Customer reviews & ratings
- [ ] Payment gateway integration (optional)
- [ ] API documentation (Swagger)
- [ ] Multi-language support

---

## 📄 License

MIT License - feel free to use this for your project!

---

## 👨‍💼 Admin Contact

**Vasant Dairy Agency**
- Owner: Kedar Patil  
- Location: Sangli, Maharashtra
- Phone: 8766997752 / 9975882125

---

## 🙏 Thank You

Built with ❤️ for Vasant Dairy Agency

**Version:** 1.0.0  
**Last Updated:** April 2026  
**Status:** Production Ready ✅

---

**Questions?** Check [SETUP.md](./SETUP.md) or [DEPLOYMENT.md](./DEPLOYMENT.md)

Happy selling! 🥛📦✨
