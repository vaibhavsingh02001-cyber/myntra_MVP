import { Deduplicator } from './deduplicator';
import { FCMDispatcher } from '../notification/fcmDispatcher';
import { InAppAlert } from '../notification/inAppAlert';
import { db } from '../../../../shared/db/client';
import { logger } from '../../../../shared/middleware/logger';
import { NudgeType } from '../../../../shared/models/wishlist.types';

export interface NudgePayload {
  userId: string;
  productId: string;
  nudgeType: NudgeType;
  deviceToken?: string;
  metadata: Record<string, any>;
}

export class NudgeEvaluator {
  /**
   * Central evaluation pipeline for a single nudge candidate.
   *
   * Pipeline steps:
   *  1. Dedup check      — was a nudge sent for this item in the last 48h?
   *  2. Daily cap check  — has the user already hit 3 nudges today?
   *  3. Stock check      — is the product still in stock?
   *  4. Dispatch         — send push (or in-app fallback)
   *  5. Mark sent        — update dedup + daily counter in Redis
   *  6. Persist          — log to nudge_event_log + update wishlist_items
   *
   * @returns `true` if nudge was dispatched, `false` if suppressed
   */
  static async evaluate(payload: NudgePayload): Promise<boolean> {
    const { userId, productId, nudgeType, deviceToken, metadata } = payload;

    // ── 1. Deduplication check ────────────────────────────────────────────
    const isDupe = await Deduplicator.check(userId, productId);
    if (isDupe) {
      logger.debug({ userId, productId, nudgeType }, '[Evaluator] Suppressed — dedup 48h');
      return false;
    }

    // ── 2. Daily cap check (max 3 nudges / user / day) ────────────────────
    const dailyCount = await Deduplicator.dailyCount(userId);
    if (dailyCount >= 3) {
      logger.debug({ userId, dailyCount }, '[Evaluator] Suppressed — daily cap reached');
      return false;
    }

    // ── 3. Stock check — don't nudge for out-of-stock items ──────────────
    const { rows: productRows } = await db.query(
      `SELECT stock_count, title FROM products WHERE product_id = $1`,
      [productId]
    );
    if (!productRows.length || productRows[0].stock_count === 0) {
      logger.info({ userId, productId }, '[Evaluator] Suppressed — product out of stock');
      return false;
    }
    const productTitle: string = productRows[0].title;

    // ── 4. Dispatch ───────────────────────────────────────────────────────
    let dispatched = false;

    if (deviceToken) {
      dispatched = await FCMDispatcher.send({
        userId, productId, nudgeType,
        deviceToken,
        metadata: { ...metadata, wishlistCount: metadata.wishlistCount ?? 1 },
        productTitle,
      });
    }

    if (!dispatched) {
      // Fallback: in-app alert (always written, regardless of push result)
      const { title } = { title: productTitle }; // simplified
      await InAppAlert.send(userId, productId, nudgeType, title);
    }

    // ── 5. Mark sent in Redis (dedup + daily counter) ────────────────────
    await Deduplicator.markSent(userId, productId);
    await Deduplicator.incrementDailyCount(userId);

    // ── 6. Persist to DB ──────────────────────────────────────────────────
    const channel = dispatched ? 'push' : 'in_app';
    await db.query(
      `INSERT INTO nudge_event_log (user_id, product_id, nudge_type, channel)
       VALUES ($1, $2, $3, $4)`,
      [userId, productId, nudgeType, channel]
    );

    await db.query(
      `UPDATE wishlist_items
       SET last_nudge_sent_at = NOW(),
           last_nudge_type    = $1,
           nudge_count        = nudge_count + 1
       WHERE user_id = $2 AND product_id = $3`,
      [nudgeType, userId, productId]
    );

    logger.info(
      { userId, productId, nudgeType, channel },
      '[Evaluator] Nudge dispatched ✅'
    );
    return true;
  }
}
