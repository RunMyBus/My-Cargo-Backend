const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const requestContext = require('../utils/requestContext');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_ID');
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field} '${value}' already exists`;
  return new AppError(message, 409, 'DUPLICATE_FIELD', field);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => ({
    field: el.path,
    message: el.message,
    value: el.value
  }));
  
  if (errors.length === 1) {
    return new AppError(errors[0].message, 400, 'VALIDATION_ERROR', errors[0].field);
  }
  
  return new AppError('Validation failed', 400, 'VALIDATION_ERROR', null, { errors });
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401, 'TOKEN_EXPIRED');

const sendErrorDev = (err, req, res) => {
  const context = requestContext.get();
  
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    requestId: context.requestId,
    operatorId: context.operatorId,
    userId: context.userId,
    url: req.originalUrl,
    method: req.method,
    statusCode: err.statusCode
  });

  return res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: {
      message: err.message,
      errorCode: err.errorCode,
      field: err.field,
      stack: err.stack,
      requestId: context.requestId
    }
  });
};

const sendErrorProd = (err, req, res) => {
  const context = requestContext.get();
  
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    logger.error('Operational error', {
      error: err.message,
      errorCode: err.errorCode,
      field: err.field,
      requestId: context.requestId,
      operatorId: context.operatorId,
      userId: context.userId,
      url: req.originalUrl,
      method: req.method,
      statusCode: err.statusCode
    });

    const response = {
      success: false,
      status: err.status,
      error: {
        message: err.message,
        errorCode: err.errorCode,
        requestId: context.requestId
      }
    };

    if (err.field) {
      response.error.field = err.field;
    }

    return res.status(err.statusCode).json(response);
  }

  // Programming or other unknown error: don't leak error details
  logger.error('Programming error', {
    error: err.message,
    stack: err.stack,
    requestId: context.requestId,
    operatorId: context.operatorId,
    userId: context.userId,
    url: req.originalUrl,
    method: req.method
  });

  res.status(500).json({
    success: false,
    status: 'error',
    error: {
      message: 'Something went wrong!',
      errorCode: 'INTERNAL_SERVER_ERROR',
      requestId: context.requestId
    }
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};