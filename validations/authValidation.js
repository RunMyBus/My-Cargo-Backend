const Joi = require('joi');

const registerSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.empty': 'Full name is required',
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name cannot exceed 100 characters'
    }),
  
  mobile: Joi.string().pattern(/^[6-9]\d{9}$/).required()
    .messages({
      'string.pattern.base': 'Mobile number must be a valid 10-digit Indian number',
      'string.empty': 'Mobile number is required'
    }),
  
  password: Joi.string().min(6).max(128).required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.empty': 'Password is required'
    })
});

const loginSchema = Joi.object({
  mobile: Joi.string().pattern(/^[6-9]\d{9}$/).required()
    .messages({
      'string.pattern.base': 'Mobile number must be a valid 10-digit Indian number',
      'string.empty': 'Mobile number is required'
    }),
  
  password: Joi.string().required()
    .messages({
      'string.empty': 'Password is required'
    })
});

module.exports = {
  registerSchema,
  loginSchema
};