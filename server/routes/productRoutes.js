const express = require('express');
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

const router = express.Router();

// Joi Validation Schemas
const productCreateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  price: Joi.number().min(0).required(),
  description: Joi.string().required(),
  image: Joi.string().allow('').optional(),
  category: Joi.string().allow('').optional()
});

const productUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  price: Joi.number().min(0).optional(),
  description: Joi.string().optional(),
  image: Joi.string().allow('').optional(),
  category: Joi.string().allow('').optional()
});

// Product Routing definitions
router.get('/', getProducts);

// Secured administrative paths
router.post('/', protect, authorize('admin'), validate(productCreateSchema), createProduct);
router.put('/:id', protect, authorize('admin'), validate(productUpdateSchema), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
