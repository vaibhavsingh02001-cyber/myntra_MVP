import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import fitRoutes from './routes/fit.routes';
import { startWorker } from './worker';
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

// ── Serve Frontend Web App ────────────────────────────────────────────────
const frontendPath = [
  path.resolve(process.cwd(), 'frontend'),
  path.resolve(__dirname, '../../../frontend'),
  path.resolve(__dirname, '../../../../frontend'),
  path.resolve(__dirname, '../../frontend')
].find(p => fs.existsSync(p)) || path.resolve(process.cwd(), 'frontend');
app.use(express.static(frontendPath));

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/health', async (_req: express.Request, res: express.Response) => {
  const dbOk = await db.ping();
  const redisOk = await pingRedis();
  const status = dbOk && redisOk ? 'healthy' : 'degraded';
  res.status(status === 'healthy' ? 200 : 503).json({
    service: 'agent2-fit',
    status,
    checks: { database: dbOk, redis: redisOk },
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/v1', fitRoutes);

// Serve index.html for root route
app.get('/', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── Global Error Handler ───────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[AGENT2 UNHANDLED ERROR]:', err);
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ── Start Server ───────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT_AGENT2) || 3002;

app.listen(PORT, async () => {
  logger.info(`👗 Agent 2 — Fit-Confidence Match Agent running on port ${PORT}`);
  logger.info(`🌐 Frontend Web App live at http://localhost:${PORT}`);
  await startWorker();
});

export default app;
