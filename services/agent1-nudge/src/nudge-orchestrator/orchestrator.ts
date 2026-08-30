import cron from 'node-cron';
import { ExpiryWatcher } from '../expiry-watcher/expiryWatcher';
import { SalaryModeler } from '../salary-modeler/salaryModeler';
import { PriceMonitor } from '../price-monitor/priceMonitor';
import { logger } from '../../../../shared/middleware/logger';

/**
 * Initialises all cron-based schedulers for Agent 1.
 * Called once at service startup.
 *
 * Schedule overview:
 *  • ExpiryWatcher  — hourly         (0 * * * *)
 *  • SalaryModeler  — daily at 09:00 (0 9 * * *)
 *  • PriceMonitor   — every 15 min   (* /15 * * * *)
 */
export async function initSchedulers(): Promise<void> {
  // ── Expiry Watcher: runs every hour ─────────────────────────────────────
  cron.schedule('0 * * * *', async () => {
    logger.info('⏳ [Cron] Running expiry watcher...');
    try {
      const count = await ExpiryWatcher.scan();
      logger.info({ nudgesFired: count }, '⏳ [Cron] Expiry watcher complete');
    } catch (err) {
      logger.error({ err }, '⏳ [Cron] Expiry watcher failed');
    }
  });

  // ── Salary-Day Checker: daily at 09:00 ──────────────────────────────────
  cron.schedule('0 9 * * *', async () => {
    logger.info('💰 [Cron] Running salary-day check...');
    try {
      const count = await SalaryModeler.checkAndNudge();
      logger.info({ nudgesFired: count }, '💰 [Cron] Salary-day check complete');
    } catch (err) {
      logger.error({ err }, '💰 [Cron] Salary-day check failed');
    }
  });

  // ── Price Monitor Poll: every 15 min ─────────────────────────────────────
  cron.schedule('*/15 * * * *', async () => {
    logger.info('📉 [Cron] Polling price feed...');
    try {
      await PriceMonitor.poll();
      logger.info('📉 [Cron] Price feed poll complete');
    } catch (err) {
      logger.error({ err }, '📉 [Cron] Price feed poll failed');
    }
  });

  // ── Profile recompute: daily at 02:00 (off-peak) ─────────────────────────
  cron.schedule('0 2 * * *', async () => {
    logger.info('📊 [Cron] Recomputing salary profiles...');
    try {
      await SalaryModeler.recomputeAllProfiles();
      logger.info('📊 [Cron] Salary profile recompute complete');
    } catch (err) {
      logger.error({ err }, '📊 [Cron] Salary profile recompute failed');
    }
  });

  logger.info('✅ All nudge schedulers initialized');
}
