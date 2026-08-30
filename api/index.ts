import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import nudgeRoutes from '../services/agent1-nudge/src/routes/nudge.routes';
import priceRoutes from '../services/agent1-nudge/src/routes/price.routes';
import fitRoutes from '../services/agent2-fit/src/routes/fit.routes';

dotenv.config();

const app = express();

// ── CORS & Middleware ──────────────────────────────────────────────────────
app.use((_req: Request, res: Response, next: NextFunction) => {
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

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    system: 'Myntra AI Agent Backend (Vercel Serverless)',
    agents: {
      agent1_nudge: 'active',
      agent2_fit: 'active'
    },
    timestamp: new Date().toISOString()
  });
});

// ── Agent 1 & Agent 2 API Routes ───────────────────────────────────────────
app.use('/api/v1', nudgeRoutes);
app.use('/api/v1', priceRoutes);
app.use('/api/v1', fitRoutes);

// ── Default API Fallback ───────────────────────────────────────────────────
app.use('/api/(.*)', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found', message: 'API endpoint not found' });
});

export default app;
