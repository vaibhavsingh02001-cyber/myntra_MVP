// Shared package barrel exports
// Import everything from here — never import from deep paths directly.

// DB
export { db } from './db/client';

// Cache
export { cache, getRedisClient, pingRedis, closeRedis } from './cache/client';
export { CacheKeys, CacheTTL } from './cache/keys';

// Queue
export { queue } from './queue/client';
export { QUEUES } from './queue/queues';
export type { QueueName } from './queue/queues';

// Models
export * from './models/user.types';
export * from './models/product.types';
export * from './models/wishlist.types';

// Middleware
export { logger } from './middleware/logger';
export { authMiddleware } from './middleware/auth';
export type { AuthRequest } from './middleware/auth';
export { userRateLimiter, ipRateLimiter } from './middleware/rateLimiter';
export { errorHandler } from './middleware/errorHandler';
