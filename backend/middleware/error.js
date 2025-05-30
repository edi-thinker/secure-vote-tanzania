/**
 * Error handling middleware
 * Provides consistent error responses and logging
 */

const ErrorResponse = require('../utils/errorResponse');
const SystemLog = require('../models/SystemLog');

const errorHandler = async (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  await SystemLog.create({
    level: 'ERROR',
    message: `${err.message}`,
    component: 'ErrorHandler',
    action: 'SystemError',
    userId: req.user ? req.user._id : null,
    userRole: req.user ? req.user.role : 'system',
    ipAddress: req.ip,
    metadata: { 
      stack: err.stack,
      path: req.path,
      method: req.method 
    }
  }).catch(logErr => {
    console.error('Error logging failed:', logErr);
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value entered: ${field}. Please use another value.`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ErrorResponse('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Token expired', 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = errorHandler;
