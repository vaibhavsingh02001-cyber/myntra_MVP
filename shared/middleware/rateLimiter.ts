import rateLimit from 'express-rate-limit';
import { logger } from './logger';

/**
 * Per-user rate limiter: max 100 requests per minute.
 * Applied to all authenticated API routes.
 */
export const userRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.userId || req.ip,
  handler: (_req, res) => {
    logger.warn('Rate limit exceeded');
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit: 100 requests per minute',
    });
  },
});

/**
 * Per-IP rate limiter: max 500 requests per minute.
 * Applied at the gateway level before authentication.
 */
export const ipRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'IP rate limit exceeded',
    });
  },
});
