import { Router, Request, Response, NextFunction } from 'express';
import { ProfileService } from '../profile/profileService';
import { FitOrchestrator } from '../fit-orchestrator/orchestrator';
import { authMiddleware } from '../../../../shared/middleware/auth';
import { userRateLimiter } from '../../../../shared/middleware/rateLimiter';
import { logger } from '../../../../shared/middleware/logger';
import { db } from '../../../../shared/db/client';
import { queue } from '../../../../shared/queue/client';
import { QUEUES } from '../../../../shared/queue/queues';
import { BodyShape, FitPreference, ComfortPriority } from '../../../../shared/models/user.types';

const router = Router();

/**
 * POST /api/v1/events/wishlist-add
 * Triggered when a user adds an item to their wishlist.
 * Persists the wishlist item and dispatches asynchronous fit-score computation to RabbitMQ.
 */
router.post(
  '/events/wishlist-add',
  (req: Request, res: Response, next: NextFunction) => authMiddleware(req as any, res, next),
  userRateLimiter as any,
  async (req: Request, res: Response): Promise<void> => {
    const { userId, productId, priceAtAdd } = req.body;

    if (!userId || !productId || priceAtAdd == null) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'userId, productId, and priceAtAdd are required',
      });
      return;
    }

    try {
      // 1. Persist wishlist item in DB
      await db.query(
        `INSERT INTO wishlist_items (user_id, product_id, price_at_add, added_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, product_id) DO UPDATE SET price_at_add = EXCLUDED.price_at_add`,
        [userId, productId, priceAtAdd]
      );

      // 2. Publish async job to RabbitMQ (non-blocking)
      await queue.publish(QUEUES.FIT_SCORE_COMPUTE, { userId, productId });

      logger.info({ userId, productId }, '[Events] Wishlist item added and fit-score compute queued');
      res.status(200).json({ success: true, queued: true });
    } catch (err) {
      logger.error({ err, userId, productId }, '[Events] wishlist-add failed');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * POST /api/v1/fit/profile
 * Create or update user body profile.
 */
router.post(
  '/fit/profile',
  (req: Request, res: Response, next: NextFunction) => authMiddleware(req as any, res, next),
  userRateLimiter as any,
  async (req: Request, res: Response): Promise<void> => {
    const { userId, heightRange, bodyShape, fitPreference, comfortPriority } = req.body;

    if (!userId || !bodyShape || !fitPreference) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'userId, bodyShape, and fitPreference are required',
      });
      return;
    }

    const validShapes: BodyShape[] = ['pear', 'apple', 'hourglass', 'rectangle', 'inverted_triangle'];
    if (!validShapes.includes(bodyShape)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `bodyShape must be one of: ${validShapes.join(', ')}`,
      });
      return;
    }

    try {
      const profile = await ProfileService.saveProfile({
        userId: String(userId),
        heightRange: heightRange ?? "5'2\"-5'5\"",
        bodyShape,
        fitPreference: fitPreference as FitPreference,
        comfortPriority: (comfortPriority as ComfortPriority) ?? 'any',
      });

      res.status(200).json({ success: true, profile });
    } catch (err) {
      logger.error({ err }, '[Routes] fit/profile failed');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * GET /api/v1/fit/profile/:userId
 * Fetch user body profile.
 */
router.get(
  '/fit/profile/:userId',
  (req: Request, res: Response, next: NextFunction) => authMiddleware(req as any, res, next),
  userRateLimiter as any,
  async (req: Request, res: Response): Promise<void> => {
    const userId = String(req.params.userId);
    try {
      const profile = await ProfileService.getProfile(userId);
      if (!profile) {
        res.status(404).json({ error: 'Not Found', message: 'Body profile not completed' });
        return;
      }
      res.status(200).json({ userId, profile });
    } catch (err) {
      logger.error({ err, userId }, '[Routes] GET fit/profile failed');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * GET /api/v1/fit/score/:userId/:productId
 * Computes or retrieves cached Fit-Confidence Score for a product.
 */
router.get(
  '/fit/score/:userId/:productId',
  (req: Request, res: Response, next: NextFunction) => authMiddleware(req as any, res, next),
  userRateLimiter as any,
  async (req: Request, res: Response): Promise<void> => {
    const userId = String(req.params.userId);
    const productId = String(req.params.productId);
    try {
      const result = await FitOrchestrator.getScore(userId, productId);
      if (!result) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Could not compute score (user profile incomplete or product not found)',
        });
        return;
      }
      res.status(200).json({ userId, productId, ...result });
    } catch (err) {
      logger.error({ err, userId, productId }, '[Routes] fit/score failed');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * GET /api/v1/wishlist/:userId
 * Enriched wishlist endpoint: returns all items for a user with computed Fit Match scores.
 */
router.get(
  '/wishlist/:userId',
  (req: Request, res: Response, next: NextFunction) => authMiddleware(req as any, res, next),
  userRateLimiter as any,
  async (req: Request, res: Response): Promise<void> => {
    const userId = String(req.params.userId);
    try {
      const wishlistScores = await FitOrchestrator.scoreWishlist(userId);
      res.status(200).json({ userId, items: wishlistScores });
    } catch (err) {
      logger.error({ err, userId }, '[Routes] GET wishlist failed');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

export default router;
