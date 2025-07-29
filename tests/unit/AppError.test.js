const AppError = require('../../utils/AppError');

describe('AppError', () => {
  test('should create error with message and status code', () => {
    const error = new AppError('Test error', 400);
    
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.status).toBe('fail');
    expect(error.isOperational).toBe(true);
  });

  test('should create error with error code and field', () => {
    const error = new AppError('Validation error', 400, 'VALIDATION_ERROR', 'email');
    
    expect(error.errorCode).toBe('VALIDATION_ERROR');
    expect(error.field).toBe('email');
  });

  test('should set status as error for 5xx codes', () => {
    const error = new AppError('Server error', 500);
    
    expect(error.status).toBe('error');
  });

  test('should set status as fail for 4xx codes', () => {
    const error = new AppError('Client error', 404);
    
    expect(error.status).toBe('fail');
  });

  test('should capture stack trace', () => {
    const error = new AppError('Test error', 400);
    
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('AppError.test.js');
  });
});