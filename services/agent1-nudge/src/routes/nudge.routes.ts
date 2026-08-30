import { Router, Request, Response, NextFunction } from 'express';
import { NudgeEvaluator } from '../nudge-evaluator/evaluator';
import { db } from '../../../../shared/db/client';
import { authMiddleware } from '../../../../shared/middleware/auth';
import { userRateLimiter } from '../../../../shared/middleware/rateLimiter';
import { logger } from '../../../../shared/middleware/logger';

const router = Router();

/**
 * POST /api/v1/nudge/trigger
 * Manually trigger a nudge for testing/admin purposes.
 * Body: { userId, productId, nudgeType, deviceToken?, metadata? }
 */
router.post(
  '/nudge/trigger',
  (req: Request, res: Response, next: NextFunction) => authMiddleware(req as any, res, next),
  userRateLimiter as any,
  async (req: Request, res: Response): Promise<void> => {
    const { userId, productId, nudgeType, deviceToken, metadata = {} } = req.body;

    if (!userId || !productId || !nudgeType) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'userId, productId, and nudgeType are required',
      });
      return;
    }

    const validTypes = ['price_drop', 'salary_day', 'expiry', 'stock_alert'];
    if (!validTypes.includes(nudgeType)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `nudgeType must be one of: ${validTypes.join(', ')}`,
      });
      return;
    }

    try {
      const dispatched = await NudgeEvaluator.evaluate({
        userId, productId, nudgeType, deviceToken, metadata,
      });
      res.status(200).json({ success: true, dispatched });
    } catch (err) {
      logger.error({ err }, '[Routes] nudge/trigger failed');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * GET /api/v1/nudge/history?userId=xxx&limit=20&offset=0
 * Returns the nudge event log for a user.
 */
router.get(
  '/nudge/history',
  (req: Request, res: Response, next: NextFunction) => authMiddleware(req as any, res, next),
  userRateLimiter as any,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.query.userId as string;
    const limit  = Math.min(Number(req.query.limit)  || 20, 100);
    const offset = Number(req.query.offset) || 0;

    if (!userId) {
      res.status(400).json({ error: 'Bad Request', message: 'userId is required' });
      return;
    }

    try {
      const { rows } = await db.query(`
        SELECT  ne.event_id, ne.product_id, p.title AS product_title,
                ne.nudge_type, ne.channel, ne.sent_at,
                ne.converted, ne.conversion_at
        FROM    nudge_event_log ne
        JOIN    products p ON ne.product_id = p.product_id
        WHERE   ne.user_id = $1
        ORDER BY ne.sent_at DESC
        LIMIT   $2 OFFSET $3
      `, [userId, limit, offset]);

      res.status(200).json({ userId, data: rows, limit, offset });
    } catch (err) {
      logger.error({ err }, '[Routes] nudge/history failed');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * PATCH /api/v1/nudge/:eventId/convert
 * Mark a nudge event as converted (called by the purchase confirmation flow).
 */
router.patch(
  '/nudge/:eventId/convert',
  (req: Request, res: Response, next: NextFunction) => authMiddleware(req as any, res, next),
  async (req: Request, res: Response): Promise<void> => {
    const { eventId } = req.params;
    try {
      await db.query(
        `UPDATE nudge_event_log
         SET converted = TRUE, conversion_at = NOW()
         WHERE event_id = $1`,
        [eventId]
      );
      res.status(200).json({ success: true, eventId });
    } catch (err) {
      logger.error({ err }, '[Routes] nudge/convert failed');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

export default router;
