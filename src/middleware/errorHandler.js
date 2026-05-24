// Express recognizes a middleware with 4 arguments as an error handler.
// Any error passed to next(err) anywhere in the app lands here.

const config = require('../config/env');

function errorHandler(err, req, res, next) {
  // Default to 500 if no status code was attached to the error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  // Log every error internally — you always want a server-side trace
  // even if you don't expose it to the client
  console.error({
    statusCode,
    message,
    path: req.path,
    method: req.method,
    // Only log stack trace in development
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });

  // Never expose internal error details in production
  // A crash (non-operational error) gets a generic message
  if (config.nodeEnv === 'production' && !err.isOperational) {
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    // Only include stack trace in development responses
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;