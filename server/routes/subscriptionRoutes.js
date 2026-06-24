const express = require('express');
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  createSubscription,
  getSubscriptionStatus
} = require('../controllers/subscriptionController');

const router = express.Router();

const subscriptionSchema = Joi.object({
  planName: Joi.string().valid('basic', 'premium').required(),
  billingPeriod: Joi.string().valid('monthly', 'annual').required(),
  gateway: Joi.string().valid('razorpay', 'stripe', 'paypal').optional()
});

router.use(protect); // Secure all subscription endpoints

router.post('/create', validate(subscriptionSchema), createSubscription);
router.get('/status', getSubscriptionStatus);

module.exports = router;
