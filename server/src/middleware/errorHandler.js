import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map(e => ({ field: e.path, message: e.message }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages
    });
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const formatted = err.issues.map(i => ({
      field: i.path.join('.'),
      message: i.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Invalid input parameters',
      errors: formatted
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected internal server error occurred.'
      : err.message || 'Internal Server Error'
  });
};

