# Troubleshooting

### 1. I am getting a "CORS" Error on Login / Register
**Symptom:** API requests in the browser console fail with CORS origin issues.
**Fix:**
- If running locally: Ensure `VITE_API_URL` exactly matches your Node Backend (including `http://` and no trailing slashes). Make sure they are using `localhost` vs `127.0.0.1` consistently.
- If in production: Ensure the Server environment variable `CLIENT_URL` exactly matches your Vercel URL. No trailing slashes.

### 2. White Screen of Death on Frontend
**Symptom:** App loads as a blank page but no API errors.
**Fix:**
Your `localStorage` data (especially Cart state) might be corrupted. Clear your browser site data or run `localStorage.clear()` in the DevTools console and reload. (Note: Recent fixes make the app resilient to `JSON.parse` failures, but an update to an incompatible object schema could force a white screen).

### 3. Missing Default QR Images during Payments
**Symptom:** During checkout, the static QR code images are broken.
**Fix:**
Nothing required! The system gracefully falls back to generating a dynamic QR code using a live API if `/qrcode1.jpg` and `/qrcode2.jpg` are missing from the `public/` directory.

### 4. Admin Payment Approval Button gives "Payment not found"
**Symptom:** An admin clicks on "Approve" but nothing happens or the route throws 404.
**Fix:**
This was related to a bug grouping in `server/routes/payments.js`. It has been fixed. Ensure you have the latest audited backend deployed which properly orders `/:paymentId` below `/pending/all`.

### 5. MongoDB "Authentication Failed" or Timeout Error
**Symptom:** Node logs `MongoDB connection error: bad auth`.
**Fix:**
Check that `MONGODB_URI` in your `.env` contains the correct password without special characters breaking the URI (URI encode the password if it includes `#`, `&`, or `@`). Additionally, `0.0.0.0/0` must be whitelisted in MongoDB Atlas Network Access.

### 6. 404 Pages on Vercel deployment when refreshing
**Symptom:** Refreshing "http://.../shop" on Vercel gives 404.
**Fix:**
This happens because Vercel doesn't know about SPA routing by default. We have added `vercel.json` to handle this. Make sure `vercel.json` is deployed in the ROOT directory of the `client` folder.
