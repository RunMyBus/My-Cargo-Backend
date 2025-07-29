const Joi = require('joi');
const AppError = require('../utils/AppError');

// Custom Joi ObjectId validator
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
        value: detail.context?.value
      }));

      if (errorDetails.length === 1) {
        return next(new AppError(
          errorDetails[0].message,
          400,
          'VALIDATION_ERROR',
          errorDetails[0].field
        ));
      }

      return next(new AppError(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        null,
        { errors: errorDetails }
      ));
    }

    next();
  };
};

module.exports = {
  validate,
  objectId
};