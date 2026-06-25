const express = require('express');
const Joi = require('joi');
const RoutingRule = require('../models/RoutingRule');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

const ruleSchema = Joi.object({
  name: Joi.string().required().trim().max(100),
  conditions: Joi.object({
    currency: Joi.string().uppercase().required().default('ANY'),
    minAmount: Joi.number().min(0).default(0),
    maxAmount: Joi.number().min(0).default(Infinity)
  }).required(),
  targetGateway: Joi.string().valid('stripe', 'razorpay', 'paypal').required(),
  priority: Joi.number().integer().min(0).default(0),
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

router.use(protect);
router.use(authorizeAdmin);

// @desc    Get all routing rules
// @route   GET /api/routing-rules
router.get('/', async (req, res) => {
  try {
    const rules = await RoutingRule.find().sort({ priority: 1 });
    res.status(200).json({ success: true, count: rules.length, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create new routing rule
// @route   POST /api/routing-rules
router.post('/', validate(ruleSchema), async (req, res) => {
  try {
    const rule = await RoutingRule.create(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Update routing rule
// @route   PUT /api/routing-rules/:id
router.put('/:id', validate(ruleSchema), async (req, res) => {
  try {
    let rule = await RoutingRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Routing rule not found' });
    }
    rule = await RoutingRule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json({ success: true, data: rule });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Delete routing rule
// @route   DELETE /api/routing-rules/:id
router.delete('/:id', async (req, res) => {
  try {
    const rule = await RoutingRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Routing rule not found' });
    }
    await rule.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
