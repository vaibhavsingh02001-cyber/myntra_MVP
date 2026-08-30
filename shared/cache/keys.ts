/**
 * Centralised Redis key constants.
 * All cache keys in the system must be defined here to prevent key collisions.
 */

export const CacheKeys = {
  /**
   * Fit-Match Score for a specific user × product pair.
   * TTL: 7 days — invalidated on profile update or product attribute change.
   */
  fitScore: (userId: string, productId: string) =>
    `fit_score:${userId}:${productId}`,

  /**
   * All fit scores for a user's wishlist (aggregate, for wishlist page load).
   * TTL: 1 hour.
   */
  wishlistScores: (userId: string) => `wishlist_scores:${userId}`,

  /**
   * Latest price snapshot for a product.
   * TTL: 1 hour — invalidated on price feed event.
   */
  priceSnapshot: (productId: string) => `price_snapshot:${productId}`,

  /**
   * Nudge deduplication key: tracks last nudge sent for a user × product.
   * TTL: 48 hours — auto-expires after the dedup window.
   */
  nudgeSent: (userId: string, productId: string) =>
    `nudge_sent:${userId}:${productId}`,

  /**
   * Daily nudge counter per user (max 3 nudges per day).
   * TTL: 24 hours — auto-resets each day.
   */
  nudgeDailyCount: (userId: string) => `nudge_daily:${userId}`,

  /**
   * Cached product attributes after LLM extraction.
   * TTL: 24 hours — invalidated on catalog update.
   */
  productAttributes: (productId: string) => `product_attrs:${productId}`,
} as const;

/** Cache TTLs in seconds */
export const CacheTTL = {
  FIT_SCORE: 7 * 24 * 60 * 60,       // 7 days
  WISHLIST_SCORES: 60 * 60,           // 1 hour
  PRICE_SNAPSHOT: 60 * 60,            // 1 hour
  NUDGE_SENT: 48 * 60 * 60,           // 48 hours
  NUDGE_DAILY_COUNT: 24 * 60 * 60,    // 24 hours
  PRODUCT_ATTRIBUTES: 24 * 60 * 60,   // 24 hours
} as const;
