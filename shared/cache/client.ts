import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Singleton Redis client
let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      connectTimeout: 5000,
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected');
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });

    redisClient.on('reconnecting', () => {
      console.warn('[Redis] Reconnecting...');
    });
  }
  return redisClient;
}

/**
 * Ping Redis — used in health checks.
 */
export async function pingRedis(): Promise<boolean> {
  try {
    const reply = await getRedisClient().ping();
    return reply === 'PONG';
  } catch {
    return false;
  }
}

/**
 * Gracefully close the Redis connection (for tests/shutdown).
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export const cache = getRedisClient();
export default cache;
