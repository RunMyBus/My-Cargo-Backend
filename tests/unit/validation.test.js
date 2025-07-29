const Joi = require('joi');
const { validate, objectId } = require('../../middleware/validation');
const AppError = require('../../utils/AppError');

describe('Validation Middleware', () => {
  describe('objectId validator', () => {
    test('should accept valid ObjectId', () => {
      const { error } = objectId.validate('507f1f77bcf86cd799439011');
      expect(error).toBeUndefined();
    });

    test('should reject invalid ObjectId', () => {
      const { error } = objectId.validate('invalid-id');
      expect(error).toBeDefined();
      expect(error.message).toContain('Invalid ObjectId format');
    });
  });

  describe('validate middleware', () => {
    const testSchema = Joi.object({
      name: Joi.string().required(),
      age: Joi.number().min(0).max(120)
    });

    test('should pass validation for valid data', () => {
      const req = { body: { name: 'John', age: 25 } };
      const res = {};
      const next = jest.fn();

      const middleware = validate(testSchema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    test('should fail validation for invalid data', () => {
      const req = { body: { age: 150 } }; // Missing name, age too high
      const res = {};
      const next = jest.fn();

      const middleware = validate(testSchema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('VALIDATION_ERROR');
    });

    test('should validate query parameters when specified', () => {
      const req = { 
        body: { name: 'John', age: 25 },
        query: { page: 'invalid' }
      };
      const res = {};
      const next = jest.fn();

      const querySchema = Joi.object({
        page: Joi.number().required()
      });

      const middleware = validate(querySchema, 'query');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    test('should strip unknown fields', () => {
      const req = { body: { name: 'John', age: 25, unknownField: 'value' } };
      const res = {};
      const next = jest.fn();

      const middleware = validate(testSchema);
      middleware(req, res, next);

      expect(req.body).not.toHaveProperty('unknownField');
      expect(next).toHaveBeenCalledWith();
    });
  });
});