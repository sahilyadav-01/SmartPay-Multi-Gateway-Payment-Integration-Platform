# SmartPay Deployment & Configuration Guide

This guide details the procedures to configure and deploy the SmartPay Multi-Gateway Payment integration module.

---

## 1. Local Deployment (Development Setup)

### Prerequisites
- Node.js (v18.x or above) installed.
- MongoDB server running locally, or access to a MongoDB Atlas cluster URI.

### Steps
1. Navigate to the server folder and install dependencies:
   ```bash
   cd server
   npm install
   ```
2. Duplicate `.env.example` as `.env` and set variables:
   - Provide your custom keys for Razorpay, Stripe, and PayPal.
   - Specify MongoDB URI, JWT Secrets, and SMTP email parameters.
3. Start the server in hot-reload development mode:
   ```bash
   npm run dev
   ```
   The backend service starts at `http://localhost:5000`.

---

## 2. Admin Web Panel Deployment

### Steps
1. Navigate to the admin React directory:
   ```bash
   cd client/react-admin
   npm install
   ```
2. Boot Vite's development hot-reload server locally:
   ```bash
   npm run dev
   ```
   The control panel web UI is available at `http://localhost:3000`. Note that API routes are proxied to the local backend port.
3. For production static asset generation, compile the build bundle:
   ```bash
   npm run build
   ```
   This generates standard, optimized assets under `dist/` directory which can be hosted on Vercel, Netlify, or AWS S3.

---

## 3. Docker Deployment (Orchestrated stack)

To run the unified stack (database and application container server) seamlessly:
1. From the project root workspace directory, run:
   ```bash
   docker-compose up --build
   ```
2. Access the database connection at `localhost:27017` and backend APIs at `localhost:5000`.

---

## 4. Production Cloud Deployment (Render / Railway)

### Express Server Hosting
1. Connect your GitHub repository to Render/Railway.
2. Select **Web Service** and choose Node environment runtime.
3. Specify Build Command as `cd server && npm install` and Start Command as `cd server && npm start`.
4. Configure all environment secrets (JWT keys, gateway secret IDs, MONGODB_URI) in the settings dashboard tab.
