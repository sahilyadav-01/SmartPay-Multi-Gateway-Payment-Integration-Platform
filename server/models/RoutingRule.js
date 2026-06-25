const mongoose = require('mongoose');

const RoutingRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a rule name'],
    trim: true
  },
  conditions: {
    currency: {
      type: String,
      default: 'ANY'
    },
    minAmount: {
      type: Number,
      default: 0
    },
    maxAmount: {
      type: Number,
      default: Infinity
    }
  },
  targetGateway: {
    type: String,
    enum: ['stripe', 'razorpay', 'paypal'],
    required: [true, 'Please specify a target gateway']
  },
  priority: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RoutingRule', RoutingRuleSchema);
