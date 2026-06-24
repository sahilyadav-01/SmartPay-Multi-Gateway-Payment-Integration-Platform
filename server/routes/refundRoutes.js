const express = require('express');
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  processRefund,
  getRefundHistory
} = require('../controllers/refundController');

const router = express.Router();

const refundSchema = Joi.object({
  transactionId: Joi.string().required(),
  amount: Joi.number().min(0.01).required(),
  reason: Joi.string().allow('').optional()
});

router.use(protect);
router.use(authorize('admin')); // Secure refunds to Admin accounts only

router.post('/', validate(refundSchema), processRefund);
router.get('/history', getRefundHistory);

module.exports = router;
