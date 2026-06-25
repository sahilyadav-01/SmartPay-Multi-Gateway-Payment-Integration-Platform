const express = require('express');
const GatewayStatus = require('../models/GatewayStatus');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Middleware to ensure user is admin
const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied: Admin role required' });
  }
};

router.use(protect);

// @desc    Get all gateway statuses
// @route   GET /api/gateways/status
router.get('/', async (req, res) => {
  try {
    const statuses = await GatewayStatus.find();
    res.status(200).json({ success: true, data: statuses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Toggle gateway status (Admin Override)
// @route   POST /api/gateways/status/toggle
router.post('/toggle', authorizeAdmin, async (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name || !status) {
      return res.status(400).json({ success: false, message: 'Please specify name and status' });
    }

    let gateway = await GatewayStatus.findOne({ name });
    if (!gateway) {
      gateway = new GatewayStatus({ name });
    }

    gateway.status = status;
    // Simulate metrics based on status
    if (status === 'offline') {
      gateway.latencyMs = 9999;
      gateway.errorRate = 100;
    } else {
      gateway.latencyMs = Math.floor(80 + Math.random() * 80);
      gateway.errorRate = 0;
    }
    gateway.lastChecked = new Date();

    await gateway.save();

    res.status(200).json({ success: true, data: gateway });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
