import { queue } from '../../../shared/queue/client';
import { QUEUES } from '../../../shared/queue/queues';
import { FitOrchestrator } from './fit-orchestrator/orchestrator';
import { logger } from '../../../shared/middleware/logger';

/**
 * Background worker consumer for Agent 2.
 * Listens to `fit.score.compute` queue to compute scores asynchronously without blocking API responses.
 */
export async function startWorker(): Promise<void> {
  logger.info('⚙️ [Worker] Starting Agent 2 RabbitMQ queue consumer...');

  try {
    await queue.consume(QUEUES.FIT_SCORE_COMPUTE, async (payload: { userId: string; productId: string }) => {
      const { userId, productId } = payload;
      logger.info({ userId, productId }, '⚙️ [Worker] Processing fit.score.compute job');
      await FitOrchestrator.getScore(userId, productId);
    });
    logger.info('✅ [Worker] Consumer registered for fit.score.compute');
  } catch (err) {
    logger.warn({ err }, '⚠️ [Worker] RabbitMQ connection failed — async worker offline (REST endpoint active)');
  }
}
