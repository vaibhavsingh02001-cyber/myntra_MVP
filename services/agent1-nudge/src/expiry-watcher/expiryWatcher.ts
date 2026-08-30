import { db } from '../../../../shared/db/client';
import { NudgeEvaluator } from '../nudge-evaluator/evaluator';
import { logger } from '../../../../shared/middleware/logger';

export class ExpiryWatcher {
  /**
   * Scans the wishlist for items in the 20–30 day "intent decay" window
   * with no recent nudge, and fires expiry nudges for each.
   *
   * Conditions checked:
   *  • Item has been in wishlist for 20–30 days
   *  • User has expiry notifications enabled
   *  • No nudge was sent in the last 48h (DB-level check; Redis dedup is also applied in evaluator)
   *
   * @returns number of nudges dispatched
   */
  static async scan(): Promise<number> {
    const { rows: expiringItems } = await db.query(`
      SELECT  wi.user_id,
              wi.product_id,
              u.device_token,
              EXTRACT(DAY FROM NOW() - wi.added_at)::int AS days_in_wishlist,
              p.stock_count
      FROM    wishlist_items wi
      JOIN    users          u ON wi.user_id    = u.user_id
      JOIN    products       p ON wi.product_id = p.product_id
      WHERE   EXTRACT(DAY FROM NOW() - wi.added_at) BETWEEN 20 AND 30
        AND   u.notif_expiry = TRUE
        AND   p.stock_count  > 0
        AND   (
                wi.last_nudge_sent_at IS NULL
                OR wi.last_nudge_sent_at < NOW() - INTERVAL '48 hours'
              )
    `);

    logger.info(
      { candidateCount: expiringItems.length },
      '[ExpiryWatcher] Scan complete — evaluating candidates'
    );

    let dispatched = 0;

    for (const item of expiringItems) {
      // Skip items with critically low stock — handled by stock_alert nudge instead
      if (item.stock_count <= 5) {
        // Escalate to stock_alert for urgency
        const sent = await NudgeEvaluator.evaluate({
          userId:      item.user_id,
          productId:   item.product_id,
          nudgeType:   'stock_alert',
          deviceToken: item.device_token,
          metadata: {
            stockCount:      item.stock_count,
            daysInWishlist:  item.days_in_wishlist,
          },
        });
        if (sent) dispatched++;
      } else {
        const sent = await NudgeEvaluator.evaluate({
          userId:      item.user_id,
          productId:   item.product_id,
          nudgeType:   'expiry',
          deviceToken: item.device_token,
          metadata: { daysInWishlist: item.days_in_wishlist },
        });
        if (sent) dispatched++;
      }
    }

    logger.info({ dispatched }, '[ExpiryWatcher] Nudge dispatch run complete');
    return dispatched;
  }
}
