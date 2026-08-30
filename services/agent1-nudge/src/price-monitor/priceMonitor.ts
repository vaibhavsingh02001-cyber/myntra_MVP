import axios from 'axios';
import { db } from '../../../../shared/db/client';
import { NudgeEvaluator } from '../nudge-evaluator/evaluator';
import { logger } from '../../../../shared/middleware/logger';

export class PriceMonitor {
  private static readonly THRESHOLD =
    Number(process.env.PRICE_DROP_THRESHOLD_PERCENT) || 5;

  /**
   * Handle a single price-change event (called by webhook or poll).
   * Validates out-of-order events, updates DB, and fans out to all
   * users who wishlisted the product.
   */
  static async handlePriceChange(
    productId: string,
    newPrice: number,
    eventTimestamp?: string
  ): Promise<void> {
    // ── Out-of-order guard ────────────────────────────────────────────────
    if (eventTimestamp) {
      const { rows } = await db.query(
        `SELECT updated_at FROM products WHERE product_id = $1`,
        [productId]
      );
      if (rows.length && new Date(eventTimestamp) < new Date(rows[0].updated_at)) {
        logger.warn(
          { productId, eventTimestamp },
          '[PriceMonitor] Out-of-order event — skipping'
        );
        return;
      }
    }

    // ── Update current price + append to history ──────────────────────────
    await db.query(
      `UPDATE products SET current_price = $1, updated_at = NOW()
       WHERE product_id = $2`,
      [newPrice, productId]
    );
    await db.query(
      `INSERT INTO product_price_history (product_id, price)
       VALUES ($1, $2)`,
      [productId, newPrice]
    );

    logger.info({ productId, newPrice }, '[PriceMonitor] Price updated');

    // ── Find all users who wishlisted this product ────────────────────────
    const { rows: wishlistItems } = await db.query(`
      SELECT wi.user_id, wi.price_at_add, u.device_token, u.notif_price_drop
      FROM   wishlist_items wi
      JOIN   users u ON wi.user_id = u.user_id
      WHERE  wi.product_id = $1
        AND  u.notif_price_drop = TRUE
        AND  wi.price_at_add > $2
    `, [productId, newPrice]);

    let nudgedCount = 0;
    for (const item of wishlistItems) {
      const dropPercent =
        ((item.price_at_add - newPrice) / item.price_at_add) * 100;

      if (dropPercent >= PriceMonitor.THRESHOLD) {
        const sent = await NudgeEvaluator.evaluate({
          userId:      item.user_id,
          productId,
          nudgeType:   'price_drop',
          deviceToken: item.device_token,
          metadata: {
            oldPrice:    item.price_at_add,
            newPrice,
            dropPercent: Math.round(dropPercent),
          },
        });
        if (sent) nudgedCount++;
      }
    }

    logger.info(
      { productId, newPrice, usersNotified: nudgedCount },
      '[PriceMonitor] Price-drop evaluation complete'
    );
  }

  /**
   * Polling fallback — called every 15 min by the cron scheduler.
   * Fetches a list of recent price changes from the internal price feed API.
   * Gracefully skips if the API is unavailable (network / maintenance).
   */
  static async poll(): Promise<void> {
    const apiUrl = process.env.PRICE_FEED_API_URL;
    if (!apiUrl) {
      logger.warn('[PriceMonitor] PRICE_FEED_API_URL not set — skipping poll');
      return;
    }

    try {
      const { data: priceFeed } = await axios.get<
        Array<{ productId: string; newPrice: number; eventTimestamp: string }>
      >(`${apiUrl}/changes`, { timeout: 10_000 });

      logger.info({ count: priceFeed.length }, '[PriceMonitor] Price feed received');

      for (const change of priceFeed) {
        await PriceMonitor.handlePriceChange(
          change.productId,
          change.newPrice,
          change.eventTimestamp
        );
      }
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        logger.warn(
          { status: err.response?.status, url: `${apiUrl}/changes` },
          '[PriceMonitor] Price feed API unavailable — poll skipped'
        );
      } else {
        logger.error({ err }, '[PriceMonitor] Unexpected poll error');
      }
    }
  }

  /**
   * Handle a price reduction to zero (out-of-stock pricing edge case).
   * This should NOT trigger a price-drop nudge — suppress it.
   */
  static isPriceZeroOrNegative(price: number): boolean {
    return price <= 0;
  }
}
