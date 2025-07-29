const Joi = require('joi');
const { objectId } = require('../middleware/validation');

const createBookingSchema = Joi.object({
  // Sender info
  senderName: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.empty': 'Sender name is required',
      'string.min': 'Sender name must be at least 2 characters long'
    }),
  
  senderPhone: Joi.string().pattern(/^[6-9]\d{9}$/).required()
    .messages({
      'string.pattern.base': 'Sender phone must be a valid 10-digit Indian number',
      'string.empty': 'Sender phone is required'
    }),
  
  senderEmail: Joi.string().email().optional().allow(''),
  senderAddress: Joi.string().trim().max(500).optional().allow(''),

  // Receiver info
  receiverName: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.empty': 'Receiver name is required',
      'string.min': 'Receiver name must be at least 2 characters long'
    }),
  
  receiverPhone: Joi.string().pattern(/^[6-9]\d{9}$/).required()
    .messages({
      'string.pattern.base': 'Receiver phone must be a valid 10-digit Indian number',
      'string.empty': 'Receiver phone is required'
    }),
  
  receiverEmail: Joi.string().email().optional().allow(''),
  receiverAddress: Joi.string().trim().max(500).optional().allow(''),

  // Branches
  fromOffice: objectId.required()
    .messages({
      'string.pattern.base': 'Invalid origin branch ID format',
      'any.required': 'Origin branch is required'
    }),
  
  toOffice: objectId.required()
    .messages({
      'string.pattern.base': 'Invalid destination branch ID format',
      'any.required': 'Destination branch is required'
    }),

  // Package info
  packageDescription: Joi.string().trim().max(500).optional().allow(''),
  
  weight: Joi.number().positive().required()
    .messages({
      'number.positive': 'Weight must be a positive number',
      'any.required': 'Weight is required'
    }),
  
  quantity: Joi.number().integer().positive().required()
    .messages({
      'number.positive': 'Quantity must be a positive number',
      'any.required': 'Quantity is required'
    }),
  
  valueOfGoods: Joi.number().min(0).required()
    .messages({
      'number.min': 'Value of goods cannot be negative',
      'any.required': 'Value of goods is required'
    }),
  
  dimensions: Joi.string().trim().max(100).optional().allow(''),

  // Optional fields
  dispatchDate: Joi.string().optional().allow(''),
  arrivalDate: Joi.string().optional().allow(''),
  wayBillNo: Joi.string().trim().max(50).optional().allow(''),
  assignedVehicle: objectId.optional()
});

const updateBookingSchema = Joi.object({
  senderName: Joi.string().trim().min(2).max(100).optional(),
  senderPhone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
  senderEmail: Joi.string().email().optional().allow(''),
  senderAddress: Joi.string().trim().max(500).optional().allow(''),
  
  receiverName: Joi.string().trim().min(2).max(100).optional(),
  receiverPhone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
  receiverEmail: Joi.string().email().optional().allow(''),
  receiverAddress: Joi.string().trim().max(500).optional().allow(''),
  
  fromOffice: objectId.optional(),
  toOffice: objectId.optional(),
  
  packageDescription: Joi.string().trim().max(500).optional().allow(''),
  weight: Joi.number().positive().optional(),
  quantity: Joi.number().integer().positive().optional(),
  valueOfGoods: Joi.number().min(0).optional(),
  dimensions: Joi.string().trim().max(100).optional().allow(''),
  
  dispatchDate: Joi.string().optional().allow(''),
  arrivalDate: Joi.string().optional().allow(''),
  wayBillNo: Joi.string().trim().max(50).optional().allow(''),
  assignedVehicle: objectId.optional()
});

const bookingIdParamSchema = Joi.object({
  id: objectId.required()
    .messages({
      'string.pattern.base': 'Invalid booking ID format',
      'any.required': 'Booking ID is required'
    })
});

const bookingEventSchema = Joi.object({
  type: Joi.string().valid('loaded', 'unloaded', 'delivered', 'cancelled').required()
    .messages({
      'any.only': 'Event type must be loaded, unloaded, delivered, or cancelled',
      'any.required': 'Event type is required'
    }),
  
  vehicle: objectId.optional(),
  branch: objectId.optional()
});

module.exports = {
  createBookingSchema,
  updateBookingSchema,
  bookingIdParamSchema,
  bookingEventSchema
};