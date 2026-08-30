import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from './logger';

export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * JWT authentication middleware.
 * Expects `Authorization: Bearer <token>` header.
 * Attaches decoded payload to `req.user`.
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = (req as AuthRequest).headers?.['authorization'] as string | undefined;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', message: 'Missing Bearer token' });
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dev_secret_min_32_chars_please'
    ) as JwtPayload;
    (req as AuthRequest).user = payload;
    next();
  } catch (err) {
    logger.warn({ err }, 'Invalid JWT token');
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}
