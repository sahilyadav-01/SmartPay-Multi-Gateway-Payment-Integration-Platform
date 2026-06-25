const express = require('express');
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  initiateRazorpayOrder,
  verifyRazorpayPayment,
  initiateStripeIntent,
  confirmStripePayment,
  checkout,
  getUserTransactions,
  downloadInvoice
} = require('../controllers/paymentController');

const router = express.Router();

const verifyRazorpaySchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required()
});

const confirmStripeSchema = Joi.object({
  paymentIntentId: Joi.string().required()
});

const checkoutSchema = Joi.object({
  currency: Joi.string().uppercase().length(3).required()
});

// Protect all routing endpoints
router.use(protect);

router.post('/razorpay/order', initiateRazorpayOrder);
router.post('/razorpay/verify', validate(verifyRazorpaySchema), verifyRazorpayPayment);

router.post('/stripe/intent', initiateStripeIntent);
router.post('/stripe/confirm', validate(confirmStripeSchema), confirmStripePayment);
router.post('/checkout', validate(checkoutSchema), checkout);

router.get('/transactions', getUserTransactions);
router.get('/invoice/:orderId', downloadInvoice);

module.exports = router;
