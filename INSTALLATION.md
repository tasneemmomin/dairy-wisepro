# Installation & Setup Guide

This guide will walk you through setting up DairyOS Pro locally.

## Prerequisites

- **Node.js**: v18 or later
- **Python**: v3.10 or later
- **MongoDB**: Atlas connection string or local MongoDB instance

## 1. Setup Backend (Server)

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create an environment file:
   Rename `.env.example` to `.env` and fill in:
   - `MONGODB_URI` (Your MongoDB connection string)
   - `JWT_SECRET` (A strong random string)
   - *Leave `CLIENT_URL` to default or blank for local dev*

4. Run the backend:
   ```bash
   npm run dev
   # or
   npm start
   ```
   *The server runs on `http://localhost:5000`*

## 2. Setup Frontend (Client)

1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Environment variables:
   Rename `.env.example` to `.env`. Ensure `VITE_API_URL` points to the local backend:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend runs on `http://localhost:5173`*

## 3. Setup Machine Learning Service

1. Open a new terminal and navigate to the `ml-model` directory:
   ```bash
   cd ml-model
   ```
2. Create and activate a Virtual Environment (Recommended):
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   *The ML API runs on `http://localhost:8000`*

## Default Login Credentials
- **Admin**: `vasantdadaagency816@gmail.com` / `vasantdada123`
- **Customer**: `demo@vasantdairy.com` / `customer123`
