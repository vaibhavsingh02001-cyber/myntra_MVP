import { cache } from '../../../../shared/cache/client';
import { CacheKeys, CacheTTL } from '../../../../shared/cache/keys';
import { logger } from '../../../../shared/middleware/logger';

/**
 * Deduplication and daily-cap logic for Agent 1.
 *
 * Rules (from architecture.md §4.4):
 *  1. Max 1 nudge per wishlist item per 48 hours
 *  2. Max 3 nudges per user per calendar day
 */
export class Deduplicator {
  /**
   * Checks whether a nudge was already sent for this user×product within 48h.
   * @returns `true` if a duplicate — nudge should be suppressed.
   */
  static async check(userId: string, productId: string): Promise<boolean> {
    try {
      const key = CacheKeys.nudgeSent(userId, productId);
      const val = await cache.get(key);
      return val !== null;
    } catch (err) {
      logger.error({ err, userId, productId }, '[Dedup] Redis check failed — allowing nudge');
      return false; // fail-open: allow the nudge rather than blocking all notifications
    }
  }

  /**
   * Marks a nudge as sent for this user×product (TTL = 48h).
   * Call this AFTER successfully dispatching the notification.
   */
  static async markSent(userId: string, productId: string): Promise<void> {
    try {
      const key = CacheKeys.nudgeSent(userId, productId);
      await cache.set(key, '1', 'EX', CacheTTL.NUDGE_SENT);
    } catch (err) {
      logger.error({ err, userId, productId }, '[Dedup] Failed to mark nudge as sent');
    }
  }

  /**
   * Returns how many nudges have been sent to this user today.
   */
  static async dailyCount(userId: string): Promise<number> {
    try {
      const key = CacheKeys.nudgeDailyCount(userId);
      const val = await cache.get(key);
      return val ? parseInt(val, 10) : 0;
    } catch (err) {
      logger.error({ err, userId }, '[Dedup] Failed to read daily count — assuming 0');
      return 0;
    }
  }

  /**
   * Increments the daily nudge count for this user (TTL = 24h).
   * Call this AFTER successfully dispatching the notification.
   */
  static async incrementDailyCount(userId: string): Promise<void> {
    try {
      const key = CacheKeys.nudgeDailyCount(userId);
      const pipeline = cache.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, CacheTTL.NUDGE_DAILY_COUNT);
      await pipeline.exec();
    } catch (err) {
      logger.error({ err, userId }, '[Dedup] Failed to increment daily count');
    }
  }
}
