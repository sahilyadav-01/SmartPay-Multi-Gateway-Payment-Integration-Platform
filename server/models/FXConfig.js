const mongoose = require('mongoose');

const FXConfigSchema = new mongoose.Schema({
  baseCurrency: {
    type: String,
    required: [true, 'Please specify base currency'],
    uppercase: true,
    trim: true,
    default: 'USD'
  },
  targetCurrency: {
    type: String,
    required: [true, 'Please specify target currency'],
    uppercase: true,
    trim: true
  },
  exchangeRate: {
    type: Number,
    required: [true, 'Please specify exchange rate'],
    min: [0, 'Exchange rate must be positive']
  },
  markupPercentage: {
    type: Number,
    required: [true, 'Please specify markup percentage'],
    min: [0, 'Markup percentage must be non-negative'],
    default: 0.0
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

// Ensure a single conversion rule exists per base-target pair
FXConfigSchema.index({ baseCurrency: 1, targetCurrency: 1 }, { unique: true });

module.exports = mongoose.model('FXConfig', FXConfigSchema);
