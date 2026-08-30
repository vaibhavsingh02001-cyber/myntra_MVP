import { ProfileService } from '../profile/profileService';
import { AttributeParser } from '../attribute-parser/attributeParser';
import { LLMExtractor } from '../llm-extractor/llmExtractor';
import { ScoringEngine, ScoreResult } from '../scoring-engine/scoringEngine';
import { FitScoreCache } from '../cache/fitScoreCache';
import { db } from '../../../../shared/db/client';
import { logger } from '../../../../shared/middleware/logger';

export class FitOrchestrator {
  /**
   * Main score retrieval pipeline for a single user × product pair.
   *
   * Flow:
   *  1. Check Redis cache first (< 50ms)
   *  2. Fetch user body profile from DB
   *  3. Fetch product details from DB
   *  4. Extract attributes (structured → LLM fallback)
   *  5. Compute score via ScoringEngine
   *  6. Cache result in Redis (TTL: 7 days)
   *  7. Persist score to wishlist_items
   */
  static async getScore(userId: string, productId: string): Promise<ScoreResult | null> {
    // 1. Check Redis cache
    const cached = await FitScoreCache.get(userId, productId);
    if (cached) {
      logger.debug({ userId, productId }, '[FitOrchestrator] Cache hit');
      return cached;
    }

    // 2. Fetch body profile
    const profile = await ProfileService.getProfile(userId);
    if (!profile) {
      logger.info({ userId }, '[FitOrchestrator] User has not completed body profile');
      return null;
    }

    // 3. Fetch product
    const { rows } = await db.query(
      `SELECT * FROM products WHERE product_id = $1`,
      [productId]
    );
    if (!rows.length) {
      logger.warn({ productId }, '[FitOrchestrator] Product not found');
      return null;
    }
    const product = rows[0];

    // 4. Extract attributes (structured → LLM fallback)
    let attributes = AttributeParser.extract(product);
    if (!attributes.isComplete()) {
      logger.info({ productId }, '[FitOrchestrator] Attributes incomplete — calling LLMExtractor');
      attributes = await LLMExtractor.extract(product.description);
      // Persist extracted attributes back to DB for future requests
      await AttributeParser.persist(productId, attributes);
    }

    // 5. Compute score
    const result = ScoringEngine.score(profile, attributes);

    // 6. Cache result (7 days)
    await FitScoreCache.set(userId, productId, result);

    // 7. Persist to wishlist_items
    await db.query(
      `UPDATE wishlist_items
       SET fit_match_score = $1, fit_match_computed_at = NOW()
       WHERE user_id = $2 AND product_id = $3`,
      [result.score, userId, productId]
    );

    logger.info({ userId, productId, score: result.score, band: result.band }, '[FitOrchestrator] Score computed');
    return result;
  }

  /**
   * Bulk score all items in a user's wishlist.
   * Useful when opening the Wishlist page or when user updates body profile.
   */
  static async scoreWishlist(userId: string) {
    const { rows: items } = await db.query(
      `SELECT product_id FROM wishlist_items WHERE user_id = $1`,
      [userId]
    );

    const scores = await Promise.all(
      items.map((item: any) => FitOrchestrator.getScore(userId, item.product_id))
    );

    return items.map((item: any, idx: number) => ({
      productId: item.product_id,
      fitScore: scores[idx],
    }));
  }
}
