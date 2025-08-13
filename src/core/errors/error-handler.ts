import { Request, Response, NextFunction } from 'express';
import { AppError } from './app-error';
import { logger } from '../../shared/utils/logger';

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
    timestamp: string;
  };
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code: string | undefined;
  let details: any = undefined;

  // Handle AppError instances
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = error.message;
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
    statusCode = 500;
    message = 'Database Error';
    code = 'DATABASE_ERROR';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }

  // Log error for debugging
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
    details = undefined;
  }

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message,
      code,
      details,
      timestamp: new Date().toISOString(),
    },
  };

  res.status(statusCode).json(errorResponse);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
