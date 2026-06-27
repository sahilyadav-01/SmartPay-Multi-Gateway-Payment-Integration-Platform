const express = require('express');
const Joi = require('joi');
const FXConfig = require('../models/FXConfig');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

const fxSchema = Joi.object({
  baseCurrency: Joi.string().uppercase().length(3).required().default('USD'),
  targetCurrency: Joi.string().uppercase().length(3).required(),
  exchangeRate: Joi.number().positive().required(),
  markupPercentage: Joi.number().min(0).max(100).required(),
  isActive: Joi.boolean().default(true)
});

// Middleware to ensure user is admin
const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied: Admin role required' });
  }
};

// Protect all FX endpoints to Admin users only
router.use(protect);
router.use(authorizeAdmin);

// @desc    Get all FX configurations
// @route   GET /api/fx-rules
router.get('/', async (req, res) => {
  try {
    const configs = await FXConfig.find().sort({ targetCurrency: 1 });
    res.status(200).json({ success: true, count: configs.length, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create new FX configuration
// @route   POST /api/fx-rules
router.post('/', validate(fxSchema), async (req, res) => {
  try {
    const { baseCurrency, targetCurrency } = req.body;
    
    // Check if configuration already exists for base -> target
    const existing = await FXConfig.findOne({ 
      baseCurrency: baseCurrency.toUpperCase(), 
      targetCurrency: targetCurrency.toUpperCase() 
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: `FX configuration already exists for conversion from ${baseCurrency} to ${targetCurrency}` 
      });
    }

    const config = await FXConfig.create(req.body);
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Update FX configuration
// @route   PUT /api/fx-rules/:id
router.put('/:id', validate(fxSchema), async (req, res) => {
  try {
    let config = await FXConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ success: false, message: 'FX configuration not found' });
    }

    // Check if updating leads to duplicate base -> target currencies
    const { baseCurrency, targetCurrency } = req.body;
    const existing = await FXConfig.findOne({ 
      baseCurrency: baseCurrency.toUpperCase(), 
      targetCurrency: targetCurrency.toUpperCase(),
      _id: { $ne: req.params.id }
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: `Another FX configuration already exists for conversion from ${baseCurrency} to ${targetCurrency}` 
      });
    }

    config = await FXConfig.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Delete FX configuration
// @route   DELETE /api/fx-rules/:id
router.delete('/:id', async (req, res) => {
  try {
    const config = await FXConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ success: false, message: 'FX configuration not found' });
    }
    await config.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
