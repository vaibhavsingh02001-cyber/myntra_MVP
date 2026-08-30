import { Router, Request, Response, NextFunction } from 'express';
import { PriceMonitor } from '../price-monitor/priceMonitor';
import { db } from '../../../../shared/db/client';
import { authMiddleware } from '../../../../shared/middleware/auth';
import { logger } from '../../../../shared/middleware/logger';

const router = Router();

/**
 * POST /api/v1/price/webhook
 * Inbound price-change event from Myntra's internal catalog service.
 * Body: { productId, newPrice, eventTimestamp }
 *
 * This is an internal-only endpoint — protected by a shared webhook secret.
 */
router.post('/price/webhook', async (req: Request, res: Response): Promise<void> => {
  const webhookSecret = req.headers['x-webhook-secret'];
  if (webhookSecret !== process.env.WEBHOOK_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { productId, newPrice, eventTimestamp } = req.body;

  if (!productId || newPrice == null) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'productId and newPrice are required',
    });
    return;
  }

  if (typeof newPrice !== 'number' || newPrice < 0) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'newPrice must be a non-negative number',
    });
    return;
  }

  if (PriceMonitor.isPriceZeroOrNegative(newPrice)) {
    logger.info({ productId, newPrice }, '[Webhook] Price zero/negative — treating as OOS, skipping nudge');
    res.status(200).json({ accepted: true, nudgeTriggered: false, reason: 'price_zero' });
    return;
  }

  // Acknowledge quickly; process asynchronously
  res.status(202).json({ accepted: true });

  // Fire-and-forget with error capture
  PriceMonitor.handlePriceChange(productId, newPrice, eventTimestamp).catch((err) => {
    logger.error({ err, productId }, '[Webhook] Failed to handle price change');
  });
});

/**
 * GET /api/v1/price/history/:productId
 * Returns the price history for a product (last 90 days).
 */
router.get(
  '/price/history/:productId',
  (req: Request, res: Response, next: NextFunction) => authMiddleware(req as any, res, next),
  async (req: Request, res: Response): Promise<void> => {
    const { productId } = req.params;
    const days = Math.min(Number(req.query.days) || 90, 365);

    try {
      const { rows } = await db.query(`
        SELECT  price, recorded_at
        FROM    product_price_history
        WHERE   product_id = $1
          AND   recorded_at > NOW() - ($2 || ' days')::interval
        ORDER BY recorded_at ASC
      `, [productId, days]);

      if (!rows.length) {
        res.status(404).json({ error: 'Not Found', message: 'No price history found' });
        return;
      }

      res.status(200).json({ productId, days, history: rows });
    } catch (err) {
      logger.error({ err, productId }, '[Routes] price/history failed');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

export default router;
