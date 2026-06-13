# Deployment Guide

DairyOS Pro is designed for seamless, multi-platform deployment.

We recommend **Vercel** for the Client (Frontend) and **Render** for the Server/ML APIs.

## 1. Backend Deployment (Render)

The project includes a `render.yaml` configuration file for deploying both the Node.js API and the Python ML API simultaneously via Render Blueprints.

1. Create a [Render](https://render.com/) account.
2. Go to **Dashboard** > **New** > **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect the `render.yaml` file.
5. Provide the required Environment Variables in the Render Dashboard when prompted:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `ADMIN_PASSWORD` (Please choose a secure one for production!)
6. Click **Apply**.
7. Grab the deployed Server URL (e.g., `https://dairyospro-server.onrender.com`). You will need this for the frontend!

---

## 2. Frontend Deployment (Vercel)

The client uses a `vercel.json` file which safely configures SPA routing.

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** > **Project** and import the GitHub repository.
3. In the project setup configuration:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
4. In the **Environment Variables** section, add your Backend URL:
   - `VITE_API_URL` = `https://dairyospro-server.onrender.com/api` (Use the Server URL from the previous step)
5. Click **Deploy**.

---

## Production Checklist

- [ ] Ensure **all default passwords** (Admin) are updated in production.
- [ ] Connect production MongoDB Cluster instead of local DB.
- [ ] Add the Vercel Frontend URL to the `CLIENT_URL` environment variable on the Render Backend so CORS allows traffic.
- [ ] Make sure the `UPI_ID` and `OWNER_WHATSAPP` variables on Render match the agency owner's actual details.
