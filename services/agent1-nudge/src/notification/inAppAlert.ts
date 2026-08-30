import { db } from '../../../../shared/db/client';
import { logger } from '../../../../shared/middleware/logger';

/**
 * Writes an in-app alert badge to the wishlist item for users without
 * device push tokens, or as a supplement to push notifications.
 *
 * The `in_app_alerts` table is a lightweight queue the mobile app polls
 * when opening the wishlist screen.
 */
export class InAppAlert {
  static async send(
    userId: string,
    productId: string,
    nudgeType: string,
    message: string
  ): Promise<void> {
    try {
      await db.query(
        `INSERT INTO nudge_event_log (user_id, product_id, nudge_type, channel)
         VALUES ($1, $2, $3, 'in_app')`,
        [userId, productId, nudgeType]
      );
      logger.info({ userId, productId, nudgeType }, '[InApp] Alert logged');
    } catch (err) {
      logger.error({ err, userId }, '[InApp] Failed to log in-app alert');
    }
  }
}
