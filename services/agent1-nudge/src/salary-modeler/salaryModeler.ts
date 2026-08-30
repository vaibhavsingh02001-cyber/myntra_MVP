import { db } from '../../../../shared/db/client';
import { NudgeEvaluator } from '../nudge-evaluator/evaluator';
import { logger } from '../../../../shared/middleware/logger';
import { SalaryProfile } from '../../../../shared/models/user.types';

export class SalaryModeler {
  /**
   * Infers a salary profile from a list of order day-of-month values.
   *
   * Rules:
   *  • ≥ 60% orders in days 1–7   → EARLY
   *  • ≥ 60% orders in days 25–31 → LATE
   *  • < 3 orders OR neither       → IRREGULAR
   */
  static inferProfile(orderDays: number[]): SalaryProfile {
    if (orderDays.length < 3) return 'IRREGULAR';
    const total      = orderDays.length;
    const earlyCount = orderDays.filter((d) => d >= 1 && d <= 7).length;
    const lateCount  = orderDays.filter((d) => d >= 25).length;
    if (earlyCount / total >= 0.6) return 'EARLY';
    if (lateCount  / total >= 0.6) return 'LATE';
    return 'IRREGULAR';
  }

  /**
   * Recomputes salary profiles for ALL users based on their order history.
   * Runs off-peak (daily at 02:00) by the orchestrator cron.
   *
   * NOTE: Uses a `orders` table — in a real system this would join
   *       the transaction/orders service. For this implementation we
   *       read from `nudge_event_log` conversions as a proxy.
   */
  static async recomputeAllProfiles(): Promise<void> {
    const { rows: users } = await db.query(`SELECT user_id FROM users`);
    let updated = 0;

    for (const user of users) {
      try {
        // Use nudge conversion timestamps as proxy for purchase timing
        const { rows: conversions } = await db.query(`
          SELECT EXTRACT(DAY FROM conversion_at)::int AS day
          FROM   nudge_event_log
          WHERE  user_id = $1
            AND  converted = TRUE
            AND  conversion_at > NOW() - INTERVAL '6 months'
        `, [user.user_id]);

        const days: number[] = conversions.map((c: any) => c.day);
        const profile = SalaryModeler.inferProfile(days);
        const avgDay  = days.length > 0
          ? Math.round(days.reduce((a, b) => a + b, 0) / days.length)
          : null;

        await db.query(
          `UPDATE users
           SET salary_profile  = $1,
               avg_order_day   = $2,
               updated_at      = NOW()
           WHERE user_id = $3`,
          [profile, avgDay, user.user_id]
        );
        updated++;
      } catch (err) {
        logger.error({ err, userId: user.user_id }, '[SalaryModeler] Profile update failed');
      }
    }
    logger.info({ updated }, '[SalaryModeler] Profiles recomputed');
  }

  /**
   * Checks if today is a salary-day window and nudges qualifying users.
   * Called daily at 09:00 by the orchestrator cron.
   *
   * Windows:
   *  • EARLY: days 1–5 of the month
   *  • LATE:  days 28–31 of the month
   *
   * @returns number of nudges dispatched
   */
  static async checkAndNudge(): Promise<number> {
    const today          = new Date().getDate();
    const isEarlyWindow  = today >= 1 && today <= 5;
    const isLateWindow   = today >= 28;

    let targetProfile: SalaryProfile | null = null;
    if (isEarlyWindow)      targetProfile = 'EARLY';
    else if (isLateWindow)  targetProfile = 'LATE';

    if (!targetProfile) {
      logger.info({ today }, '[SalaryModeler] Not a salary window — skipping');
      return 0;
    }

    // Fetch users in the target salary window + their wishlist counts
    const { rows } = await db.query(`
      SELECT  u.user_id,
              u.device_token,
              COUNT(wi.product_id)::int AS wishlist_count,
              json_agg(wi.product_id)  AS product_ids
      FROM    users u
      JOIN    wishlist_items wi ON u.user_id = wi.user_id
      WHERE   u.salary_profile   = $1
        AND   u.notif_salary_nudge = TRUE
      GROUP BY u.user_id, u.device_token
    `, [targetProfile]);

    let dispatched = 0;

    for (const user of rows) {
      const productIds: string[] = user.product_ids;

      // For salary nudge, use the first/most-recently-added item as anchor
      const anchorProductId = productIds[0];
      if (!anchorProductId) continue;

      const sent = await NudgeEvaluator.evaluate({
        userId:      user.user_id,
        productId:   anchorProductId,
        nudgeType:   'salary_day',
        deviceToken: user.device_token,
        metadata:    { wishlistCount: user.wishlist_count, salaryProfile: targetProfile },
      });

      if (sent) dispatched++;
    }

    logger.info(
      { targetProfile, usersNudged: dispatched },
      '[SalaryModeler] Salary nudge run complete'
    );
    return dispatched;
  }
}
