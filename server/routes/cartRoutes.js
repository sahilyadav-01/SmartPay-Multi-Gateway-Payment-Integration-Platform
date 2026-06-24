const express = require('express');
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  removeFromCart
} = require('../controllers/cartController');

const router = express.Router();

const cartAddSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().integer().required()
});

const cartRemoveSchema = Joi.object({
  productId: Joi.string().required()
});

router.use(protect); // Secure all cart endpoints with JWT validation

router.get('/', getCart);
router.post('/add', validate(cartAddSchema), addToCart);
router.delete('/remove', validate(cartRemoveSchema), removeFromCart);

module.exports = router;
