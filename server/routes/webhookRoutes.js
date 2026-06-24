const express = require('express');
const { handleRazorpayWebhook } = require('../controllers/webhookController');

const router = express.Router();

// Webhook endpoint mapping
router.post('/razorpay', handleRazorpayWebhook);

module.exports = router;
