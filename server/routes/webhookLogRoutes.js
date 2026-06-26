const express = require('express');
const WebhookLog = require('../models/WebhookLog');
const { processRazorpayEvent } = require('../controllers/webhookController');
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
router.use(authorizeAdmin);

// @desc    Get all webhook audit logs
// @route   GET /api/webhooks/logs
router.get('/', async (req, res) => {
  try {
    const logs = await WebhookLog.find().sort({ timestamp: -1 });
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Manually retry processing a failed webhook event
// @route   POST /api/webhooks/logs/:id/retry
router.post('/:id/retry', async (req, res) => {
  try {
    const log = await WebhookLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Webhook log not found' });
    }

    log.retriesCount += 1;
    log.status = 'pending';
    log.errorMessage = '';
    await log.save();

    try {
      // Execute the business logic processing
      const payload = log.payload.payload;
      await processRazorpayEvent(log.eventType, payload);

      log.status = 'processed';
      await log.save();

      res.status(200).json({ success: true, message: 'Webhook re-processed successfully', data: log });
    } catch (err) {
      log.status = 'failed';
      log.errorMessage = err.message;
      await log.save();

      res.status(400).json({ 
        success: false, 
        message: `Reprocessing failed: ${err.message}`, 
        data: log 
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
