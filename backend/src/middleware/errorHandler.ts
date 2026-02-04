import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors.js';
import logger from '../config/logger.js';
import config from '../config/index.js';

/**
 * Error handling middleware
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  // Default error values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: Record<string, string[]> | undefined;
  let stack: string | undefined;

  // Handle ApiError instances
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;

    // Log operational errors at warning level
    if (err.isOperational) {
      logger.warn(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    } else {
      // Log programming errors at error level
      logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
        stack: err.stack,
      });
    }
  } else {
    // Handle unexpected errors
    logger.error(`500 - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
      stack: err.stack,
    });
  }

  // Include stack trace in development
  if (config.env === 'development') {
    stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(stack && { stack }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
