import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Standardised global error handler middleware.
 * Formats errors as consistent JSON objects across all services.
 */
export function errorHandler(
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(
    {
      err,
      url: req.originalUrl,
      method: req.method,
      statusCode,
    },
    '[GlobalErrorHandler] Error caught'
  );

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal Server Error' : 'Bad Request',
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
