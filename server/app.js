const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());

// Express Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rate Limiting (limit IP requests to protect server APIs)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Rate Limiter for Login Endpoint (PRD: max 5 attempts per 15 mins)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many failed attempts. Account locked for 15 minutes.' }
});

// Apply rate limiters to APIs
if (process.env.NODE_ENV !== 'test') {
  app.use('/api/auth/login', loginLimiter);
  app.use('/api/', apiLimiter);
}

// Routes Import
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const refundRoutes = require('./routes/refundRoutes');
const couponRoutes = require('./routes/couponRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const routingRoutes = require('./routes/routingRoutes');
const gatewayStatusRoutes = require('./routes/gatewayStatusRoutes');

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/routing-rules', routingRoutes);
app.use('/api/gateways/status', gatewayStatusRoutes);

// Base Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'SmartPay Multi-Gateway API Services',
    status: 'online',
    version: '1.0.0'
  });
});

// Generic 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API resource endpoint not found' });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`SmartPay server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app; // export app module for Jest supertest integrations
