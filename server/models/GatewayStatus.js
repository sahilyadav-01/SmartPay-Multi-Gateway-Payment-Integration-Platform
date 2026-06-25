const mongoose = require('mongoose');

const GatewayStatusSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['stripe', 'razorpay', 'paypal']
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'online'
  },
  latencyMs: {
    type: Number,
    default: 120
  },
  errorRate: {
    type: Number,
    default: 0
  },
  lastChecked: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GatewayStatus', GatewayStatusSchema);
