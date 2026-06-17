const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  // Log error
  if (err.statusCode >= 500 || !err.isOperational) {
    logger.error('Unhandled error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      user: req.user?.id,
    });
  }

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    const field = err.message.match(/key '([^']+)'/)?.[1] || 'field';
    error = new AppError(`A record with this ${field} already exists.`, 409);
  }

  // MySQL foreign key constraint
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error = new AppError('Referenced resource not found.', 400);
  }

  // Validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors,
    });
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('File too large. Maximum size is 10MB.', 400);
  }

  const statusCode = error.statusCode || 500;
  const message = error.isOperational
    ? error.message
    : 'An unexpected error occurred. Please try again.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(error.code && { code: error.code }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.message,
    }),
  });
}

function notFound(req, res, next) {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
}

module.exports = { AppError, errorHandler, notFound };
