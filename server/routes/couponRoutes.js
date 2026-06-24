const express = require('express');
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  createCoupon,
  getCoupons,
  applyCoupon
} = require('../controllers/couponController');

const router = express.Router();

const couponCreateSchema = Joi.object({
  code: Joi.string().min(2).max(20).required(),
  discountType: Joi.string().valid('percentage', 'fixed').required(),
  discountValue: Joi.number().min(0.01).required(),
  expiryDate: Joi.date().greater('now').required(),
  usageLimit: Joi.number().integer().min(1).optional()
});

const couponApplySchema = Joi.object({
  code: Joi.string().required()
});

router.use(protect); // Secure all coupon endpoints

// Client applying coupon
router.post('/apply', validate(couponApplySchema), applyCoupon);

// Administrative CRUD operations
router.post('/', authorize('admin'), validate(couponCreateSchema), createCoupon);
router.get('/', authorize('admin'), getCoupons);

module.exports = router;
