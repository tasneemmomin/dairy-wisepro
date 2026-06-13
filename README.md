# DairyOS Pro - Vasant Dairy Agency

A Real-Time Dairy Order Management System for Distributors and Local Customers.

## Overview

DairyOS Pro is a full-stack, production-ready system specifically designed for Vasant Dairy Agency to manage:
- Daily Milk Subscriptions & Product Orders
- Delivery Assignments & Live Tracking
- Customer Billing & Invoicing
- QR/UPI Payments via WhatsApp integration
- Granular Admin/Owner dashboards providing live Analytics & AI insights

## Tech Stack

- **Frontend:** React + Vite, Tailwind CSS, Framer Motion
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Machine Learning:** Python + FastAPI
- **Authentication:** JWT Email/Password (Migrated from Firebase OTP)
- **Deployment:** Vercel (Frontend) & Render (Backend/ML)

## Documentation

For detailed information on configuring and running DairyOS Pro, refer to the follow files:

1. [INSTALLATION.md](./INSTALLATION.md) — Local development setup and running the apps
2. [DEPLOYMENT.md](./DEPLOYMENT.md) — Production deployment instructions (Vercel/Render)
3. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) — REST endpoints and ML API definitions
4. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — Solutions for common issues and errors

## Key Features

- **Storefront:** Browse fresh dairy products, add to cart.
- **Subscriptions:** Customers can schedule daily milk delivery.
- **Payments:** Generates QR codes based on the agency owner's UPI ID. Customers can submit proofs, which admins approve.
- **Admin Dashboard:** Role-based access ensures only the `OWNER`, `ADMIN`, or `STAFF` can manage the agency's records.
- **Delivery Agents:** Delivery agents get custom real-time notifications for out-for-delivery orders.
- **AI Forecasting:** Predict demand, inventory spoilage risk, churn probability, and sales using the ML API.
