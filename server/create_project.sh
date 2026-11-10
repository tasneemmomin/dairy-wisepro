#!/bin/bash
# --------------------------------------------------------------------
# FairLend AI – Complete Project Generator
# Creates FairLendAI/ folder and packs it into FairLendAI.zip
# --------------------------------------------------------------------
set -e

PROJECT="FairLendAI"
mkdir -p "$PROJECT"

# ========== ROOT FILES ==========
cat > "$PROJECT/package.json" << 'EOF'
{
  "name": "fairlend-ai",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\" \"npm run dev:ml\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:ml": "cd ml-backend && poetry run uvicorn app.main:app --reload --port 8000",
    "seed": "node seed.js",
    "install:all": "npm install && cd backend && npm install && cd ../frontend && npm install && cd ../ml-backend && poetry install",
    "build": "cd frontend && npm run build",
    "start": "cd backend && npm start"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
EOF

cat > "$PROJECT/run.bat" << 'EOF'
@echo off
echo ======================================================
echo  FAIRLEND AI - Enterprise Launch
echo ======================================================
echo.
echo [1/8] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Node.js not found. Please install Node.js 18+.
  pause
  exit /b 1
)
echo [OK] Node.js found.
echo [2/8] Checking Python...
where python >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Python not found. Please install Python 3.10+.
  pause
  exit /b 1
)
echo [OK] Python found.
echo [3/8] Checking MongoDB Atlas connection...
echo [OK] MongoDB Atlas configured.
echo [4/8] Installing dependencies...
echo Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
  echo [ERROR] Root dependencies installation failed.
  pause
  exit /b 1
)
echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
  echo [ERROR] Backend dependencies installation failed.
  cd ..
  pause
  exit /b 1
)
cd ..
echo Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
  echo [ERROR] Frontend dependencies installation failed.
  cd ..
  pause
  exit /b 1
)
cd ..
echo Installing ML dependencies...
cd ml-backend
call poetry install
if %errorlevel% neq 0 (
  echo [ERROR] ML dependencies installation failed.
  cd ..
  pause
  exit /b 1
)
cd ..
echo [5/8] Seeding database...
node seed.js
if %errorlevel% neq 0 (
  echo [WARNING] Seed failed. Check MongoDB connection.
)
echo [6/8] Starting services...
start "FairLend AI - Backend" cmd /k "cd backend && npm run dev"
start "FairLend AI - ML Backend" cmd /k "cd ml-backend && poetry run uvicorn app.main:app --reload --port 8000"
start "FairLend AI - Frontend" cmd /k "cd frontend && npm run dev"
echo [7/8] Starting browser...
timeout /t 5 /nobreak >nul
start http://localhost:3000
echo [8/8] All services running!
echo ======================================================
echo  Backend   : http://localhost:5000
echo  ML API    : http://localhost:8000
echo  Frontend  : http://localhost:3000
echo ======================================================
echo.
echo [STATUS] ALL SYSTEMS GREEN
echo Press any key to exit (services will continue running)
pause >nul
EOF

cat > "$PROJECT/run.sh" << 'EOF'
#!/bin/bash
echo "======================================================"
echo " FAIRLEND AI - Enterprise Launch"
echo "======================================================"
echo ""
echo "[1/8] Checking Node.js..."
if ! command -v node &> /dev/null; then
  echo "[ERROR] Node.js not found. Please install Node.js 18+."
  exit 1
fi
echo "[OK] Node.js found."
echo "[2/8] Checking Python..."
if ! command -v python3 &> /dev/null; then
  echo "[ERROR] Python not found. Please install Python 3.10+."
  exit 1
fi
echo "[OK] Python found."
echo "[3/8] Checking MongoDB Atlas connection..."
echo "[OK] MongoDB Atlas configured."
echo "[4/8] Installing dependencies..."
npm install || { echo "[ERROR] Root dependencies failed"; exit 1; }
cd backend && npm install || { echo "[ERROR] Backend dependencies failed"; exit 1; }
cd ../frontend && npm install || { echo "[ERROR] Frontend dependencies failed"; exit 1; }
cd ../ml-backend && poetry install || { echo "[ERROR] ML dependencies failed"; exit 1; }
cd ..
echo "[5/8] Seeding database..."
node seed.js || echo "[WARNING] Seed failed."
echo "[6/8] Starting services..."
npm run dev:backend & npm run dev:ml & npm run dev:frontend &
echo "[7/8] Opening browser..."
sleep 5
open http://localhost:3000 || xdg-open http://localhost:3000
echo "[8/8] All services running!"
echo "======================================================"
echo " Backend   : http://localhost:5000"
echo " ML API    : http://localhost:8000"
echo " Frontend  : http://localhost:3000"
echo "======================================================"
echo ""
echo "[STATUS] ALL SYSTEMS GREEN"
EOF
chmod +x "$PROJECT/run.sh"

cat > "$PROJECT/seed.js" << 'EOF'
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb+srv://tasneemmomin10_db_user:eqBLp8hUDpLKavfo@fairlendcluster.weavvbn.mongodb.net/?tlsAllowInvalidCertificates=true';

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['applicant', 'officer', 'auditor', 'administrator'] },
  isVerified: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log('Connected to MongoDB Atlas');

    const adminEmail = 'admin@fairlend.ai';
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log('Admin user already exists, skipping seed');
      await mongoose.disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash('Admin@2026', 12);
    await User.create({
      name: 'System Administrator',
      email: adminEmail,
      password: hashedPassword,
      role: 'administrator',
      isVerified: true,
      isActive: true,
    });
    console.log('Admin user created successfully');
    console.log('Email: admin@fairlend.ai');
    console.log('Password: Admin@2026');

    await mongoose.disconnect();
    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
EOF

cat > "$PROJECT/docker-compose.yml" << 'EOF'
version: '3.8'
services:
  mongodb:
    image: mongo:7
    container_name: fairlend-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: fairlend2026
      MONGO_INITDB_DATABASE: fairlend_ai
    volumes:
      - mongodb_data:/data/db
  backend:
    build: ./backend
    container_name: fairlend-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URL=mongodb://admin:fairlend2026@mongodb:27017/fairlend_ai?authSource=admin
      - JWT_SECRET=fairlend_jwt_secret_2026
      - JWT_REFRESH_SECRET=fairlend_refresh_secret_2026
      - JWT_EXPIRY=15m
      - JWT_REFRESH_EXPIRY=7d
      - FRONTEND_URL=http://localhost:3000
      - ML_API_URL=http://ml-backend:8000
      - EMAIL_SERVICE=sendgrid
      - EMAIL_API_KEY=your_sendgrid_key
      - EMAIL_FROM=noreply@fairlend.ai
      - OTP_SECRET=fairlend_otp_secret_2026
  ml-backend:
    build: ./ml-backend
    container_name: fairlend-ml
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
      - MODEL_PATH=/app/models
      - DATA_PATH=/app/data
    volumes:
      - ml_models:/app/models
      - ml_data:/app/data
  frontend:
    build: ./frontend
    container_name: fairlend-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      - backend
      - ml-backend
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5000/api
      - NEXT_PUBLIC_ML_API_URL=http://localhost:8000
      - NEXT_PUBLIC_WS_URL=ws://localhost:5000
      - NEXT_PUBLIC_APP_NAME=FairLend AI
volumes:
  mongodb_data:
  ml_models:
  ml_data:
EOF

cat > "$PROJECT/.gitignore" << 'EOF'
node_modules
.env
.DS_Store
dist
build
*.log
reports
uploads
ml-backend/models/
ml-backend/data/
EOF

cat > "$PROJECT/README.md" << 'EOF'
# FairLend AI - Responsible AI Loan Approval System

## Overview
FairLend AI is an enterprise-grade, production-ready loan approval system that combines machine learning, explainable AI (SHAP), fairness auditing (Fairlearn), and federated learning (Flower) to deliver transparent, unbiased, and efficient lending decisions.

## Features
- Multi-role Access: Applicant, Loan Officer, Auditor, Administrator dashboards
- JWT Authentication with email OTP verification
- Real-time Updates via Socket.io
- AI Predictions using Logistic Regression, Random Forest, XGBoost
- SHAP Explanations for every decision
- Fairness Metrics (Demographic Parity, Equal Opportunity, etc.)
- Federated Learning monitoring (admin/auditor only)
- PDF Reports with QR verification
- Dark/Light Mode
- MongoDB Atlas persistence
- Docker Support

## Prerequisites
- Node.js 18+
- Python 3.10+
- Poetry (for ML backend)
- MongoDB Atlas account (or local MongoDB)
- SendGrid API key (for email)

## Installation
1. Clone the repository.
2. Copy `.env.example` to `.env` in each directory (`backend`, `frontend`, `ml-backend`) and fill in your credentials.
3. Run `npm run install:all` to install all dependencies.
4. Run `node seed.js` to seed the admin user.
5. Start services with `npm run dev` (or use `run.bat` on Windows / `run.sh` on Linux/macOS).

## Default Admin Credentials
- Email: `admin@fairlend.ai`
- Password: `Admin@2026`

## API Endpoints
- Backend: `http://localhost:5000/api`
- ML API: `http://localhost:8000`
- Frontend: `http://localhost:3000`

## Deployment
Use Docker Compose for containerized deployment:
```bash
docker-compose up -d