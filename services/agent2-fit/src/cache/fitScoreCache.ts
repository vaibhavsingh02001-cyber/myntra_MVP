import { cache } from '../../../../shared/cache/client';
import { CacheKeys, CacheTTL } from '../../../../shared/cache/keys';
import { logger } from '../../../../shared/middleware/logger';
import { ScoreResult } from '../scoring-engine/scoringEngine';

export class FitScoreCache {
  /**
   * Retrieves a cached Fit Score for a user × product pair.
   */
  static async get(userId: string, productId: string): Promise<ScoreResult | null> {
    try {
      const key = CacheKeys.fitScore(userId, productId);
      const cached = await cache.get(key);
      if (!cached) return null;
      return JSON.parse(cached) as ScoreResult;
    } catch (err) {
      logger.error({ err, userId, productId }, '[FitCache] Redis get failed');
      return null;
    }
  }

  /**
   * Caches a computed Fit Score (TTL = 7 days).
   */
  static async set(
    userId: string,
    productId: string,
    result: ScoreResult
  ): Promise<void> {
    try {
      const key = CacheKeys.fitScore(userId, productId);
      await cache.set(key, JSON.stringify(result), 'EX', CacheTTL.FIT_SCORE);
    } catch (err) {
      logger.error({ err, userId, productId }, '[FitCache] Redis set failed');
    }
  }

  /**
   * Invalidates cached fit scores for a user (e.g. when body profile is updated).
   */
  static async invalidateUserScores(userId: string): Promise<void> {
    try {
      const pattern = CacheKeys.fitScore(userId, '*');
      const keys = await cache.keys(pattern);
      if (keys.length > 0) {
        await cache.del(...keys);
        logger.info({ userId, count: keys.length }, '[FitCache] User fit scores invalidated');
      }
    } catch (err) {
      logger.error({ err, userId }, '[FitCache] Failed to invalidate user scores');
    }
  }
}
