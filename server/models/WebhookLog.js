const mongoose = require('mongoose');

const WebhookLogSchema = new mongoose.Schema({
  gateway: {
    type: String,
    required: true,
    enum: ['stripe', 'razorpay', 'paypal']
  },
  eventType: {
    type: String,
    required: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['processed', 'failed', 'pending'],
    default: 'pending'
  },
  errorMessage: {
    type: String,
    default: ''
  },
  retriesCount: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WebhookLog', WebhookLogSchema);
