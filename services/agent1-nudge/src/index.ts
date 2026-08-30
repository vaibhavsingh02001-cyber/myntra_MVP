import express from 'express';
import dotenv from 'dotenv';
import { initSchedulers } from './nudge-orchestrator/orchestrator';
import nudgeRoutes from './routes/nudge.routes';
import priceRoutes from './routes/price.routes';
import { logger } from '../../../shared/middleware/logger';
import { ipRateLimiter } from '../../../shared/middleware/rateLimiter';
import { db } from '../../../shared/db/client';
import { pingRedis } from '../../../shared/cache/client';

dotenv.config();

const app = express();

// ── CORS & Global Middleware ──────────────────────────────────────────────
app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(ipRateLimiter as any);

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/health', async (_req: express.Request, res: express.Response) => {
  const dbOk = await db.ping();
  const redisOk = await pingRedis();
  const status = dbOk && redisOk ? 'healthy' : 'degraded';
  res.status(status === 'healthy' ? 200 : 503).json({
    service: 'agent1-nudge',
    status,
    checks: { database: dbOk, redis: redisOk },
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/v1', nudgeRoutes);
app.use('/api/v1', priceRoutes);

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// ── Global Error Handler ───────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ── Start Server ───────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT_AGENT1) || 3001;

app.listen(PORT, async () => {
  logger.info(`🤖 Agent 1 — Smart Nudge Agent running on port ${PORT}`);
  await initSchedulers();
});

export default app;
