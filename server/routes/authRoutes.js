const express = require('express');
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const {
  register,
  login,
  logout,
  refreshToken,
  resetPassword
} = require('../controllers/authController');

const router = express.Router();

// Joi Validation Schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow('').optional(),
  password: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/-]).{8,}$/)
    .message('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.')
    .required(),
  role: Joi.string().valid('customer', 'admin').default('customer')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const refreshTokenSchema = Joi.object({
  token: Joi.string().required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

// Auth Routes mapping
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

module.exports = router;
