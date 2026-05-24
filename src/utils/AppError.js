// AppError extends the built-in Error class to carry
// an HTTP status code alongside the message.
// This lets us throw meaningful errors from anywhere
// in the codebase without importing express or res.

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);         // sets this.message
    this.statusCode = statusCode;
    this.isOperational = true; // marks this as a known, expected error
                               // vs an unknown crash (programmer error)

    // Captures where in the code this error was created
    // so the stack trace points to the throw site, not this constructor
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;