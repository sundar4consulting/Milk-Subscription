import { Request, Response, NextFunction } from 'express';

// Custom API Error class
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: Record<string, string[]>;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request', errors?: Record<string, string[]>) {
    super(400, message, true, errors);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation Error', errors?: Record<string, string[]>) {
    super(422, message, true, errors);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Internal Server Error') {
    super(500, message, false);
  }
}

// Async handler wrapper to catch errors
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// API Response helper
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  pagination?: ApiResponse['pagination']
): Response => {
  const response: ApiResponse<T> = {
    success: statusCode < 400,
    message,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
  pagination?: ApiResponse['pagination']
): Response => {
  return sendResponse(res, statusCode, message, data, pagination);
};

export const sendCreated = <T>(
  res: Response,
  message: string,
  data?: T
): Response => {
  return sendResponse(res, 201, message, data);
};

export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};
