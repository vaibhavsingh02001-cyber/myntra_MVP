# 🚀 Implementation Plan — Myntra Wishlist-to-Purchase Conversion

> **Project:** Myntra AI Agent — Dual-Agent System  
> **Stack:** Node.js (TypeScript) · PostgreSQL · Redis · RabbitMQ · Gemini LLM · Firebase FCM  
> **Methodology:** Phase-by-phase — each phase is independently deployable and testable before the next begins.

---

## 📋 Table of Contents

1. [Implementation Roadmap](#1-implementation-roadmap)
2. [Phase 0 — Prerequisites & Environment Setup](#2-phase-0--prerequisites--environment-setup)
3. [Phase 1 — Shared Infrastructure & Data Layer](#3-phase-1--shared-infrastructure--data-layer)
4. [Phase 2 — Agent 1: Smart Nudge Agent](#4-phase-2--agent-1-smart-nudge-agent)
5. [Phase 3 — Agent 2: Fit-Confidence Match Agent](#5-phase-3--agent-2-fit-confidence-match-agent)
6. [Phase 4 — API Gateway & Service Integration](#6-phase-4--api-gateway--service-integration)
7. [Phase 5 — Frontend Integration](#7-phase-5--frontend-integration)
8. [Phase 6 — Testing, QA & Hardening](#8-phase-6--testing-qa--hardening)
9. [Phase 7 — Production Deployment & Monitoring](#9-phase-7--production-deployment--monitoring)
10. [Overall Timeline](#10-overall-timeline)
11. [Risk Register](#11-risk-register)

---

## 1. Implementation Roadmap

```mermaid
gantt
    title Myntra AI Agent — Implementation Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 0
    Prerequisites & Env Setup       :p0, 2026-09-01, 3d
    section Phase 1
    Shared Infra & Data Layer       :p1, after p0, 5d
    section Phase 2
    Agent 1 — Smart Nudge           :p2, after p1, 7d
    section Phase 3
    Agent 2 — Fit-Confidence Match  :p3, after p1, 10d
    section Phase 4
    API Gateway & Integration       :p4, after p2, 4d
    section Phase 5
    Frontend Integration            :p5, after p4, 5d
    section Phase 6
    Testing & QA                    :p6, after p5, 5d
    section Phase 7
    Production Deployment           :p7, after p6, 3d
```

### Phase Summary Table

| Phase | Name | Duration | Deliverable |
|-------|------|----------|-------------|
| **0** | Prerequisites & Env Setup | 3 days | Dev environment ready, project scaffolded |
| **1** | Shared Infrastructure | 5 days | DB schemas, Redis, queue, shared types |
| **2** | Agent 1 — Smart Nudge | 7 days | Price monitor, salary model, expiry watcher, push dispatch |
| **3** | Agent 2 — Fit-Confidence | 10 days | Body profile, LLM attribute extractor, scoring engine |
| **4** | API Gateway & Integration | 4 days | Unified gateway, auth, routing, webhooks |
| **5** | Frontend Integration | 5 days | Wishlist card score badge, onboarding modal |
| **6** | Testing & QA | 5 days | Unit, integration, E2E tests; load test |
| **7** | Production Deployment | 3 days | Docker, K8s, CI/CD, observability live |

---

## 2. Phase 0 — Prerequisites & Environment Setup

### 🎯 Goal
Bootstrap the project repository, install all tooling, and confirm all external service credentials are working.

### 2.1 Prerequisites Checklist

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 20 LTS | Runtime |
| TypeScript | ≥ 5.4 | Language |
| PostgreSQL | ≥ 15 | Primary DB |
| Redis | ≥ 7 | Cache |
| RabbitMQ | ≥ 3.12 | Message queue |
| Docker Desktop | Latest | Containers |
| Firebase CLI | Latest | FCM push setup |
| Google Gemini API Key | — | LLM attribute extraction |

### 2.2 Project Scaffolding

```bash
# Initialize monorepo root
mkdir myntra-ai-agent && cd myntra-ai-agent
npm init -y

# Create workspace structure
mkdir -p services/agent1-nudge/src
mkdir -p services/agent2-fit/src
mkdir -p shared/{db,cache,queue,models,middleware}
mkdir -p gateway
mkdir -p infra/{k8s,terraform}
mkdir -p docs

# Initialize TypeScript config
npx tsc --init
```

### 2.3 Root `package.json` (Workspaces)

```json
{
  "name": "myntra-ai-agent",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "services/agent1-nudge",
    "services/agent2-fit",
    "shared"
  ],
  "scripts": {
    "dev:agent1": "npm run dev --workspace=services/agent1-nudge",
    "dev:agent2": "npm run dev --workspace=services/agent2-fit",
    "dev:all": "concurrently \"npm:dev:agent1\" \"npm:dev:agent2\"",
    "test": "jest --coverage",
    "build": "tsc -b"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "concurrently": "^8.0.0",
    "jest": "^29.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### 2.4 Environment Variables Template (`.env.example`)

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/myntra_agent
REDIS_URL=redis://localhost:6379

# Message Queue
RABBITMQ_URL=amqp://localhost:5672

# LLM
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase FCM
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# App
PORT_AGENT1=3001
PORT_AGENT2=3002
PORT_GATEWAY=3000
NODE_ENV=development

# Price Feed
PRICE_FEED_API_URL=https://api.myntra.internal/prices
PRICE_DROP_THRESHOLD_PERCENT=5
```

### 2.5 Local Dev with Docker Compose

```yaml
# infra/docker-compose.yml
version: '3.9'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: myntra_agent
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  rabbitmq:
    image: rabbitmq:3.12-management
    ports:
      - "5672:5672"
      - "15672:15672"   # Management UI

volumes:
  postgres_data:
```

```bash
# Start all services locally
docker-compose -f infra/docker-compose.yml up -d
```

### ✅ Phase 0 Acceptance Criteria
- [ ] Repository initialized with correct folder structure
- [ ] `docker-compose up` starts Postgres, Redis, RabbitMQ without errors
- [ ] `.env` populated with valid API keys (Gemini, FCM)
- [ ] TypeScript compiles with `tsc --noEmit` successfully

---

## 3. Phase 1 — Shared Infrastructure & Data Layer

### 🎯 Goal
Create the shared data models, database schema, Redis client, queue client, and all TypeScript types that both agents will consume.

### 3.1 Files to Create

```
shared/
├── db/
│   ├── client.ts              # PostgreSQL connection pool
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_products.sql
│   │   ├── 003_create_wishlists.sql
│   │   └── 004_create_nudge_logs.sql
│   └── seed.ts                # Dev seed data
├── cache/
│   ├── client.ts              # Redis client singleton
│   └── keys.ts                # Cache key constants
├── queue/
│   ├── client.ts              # RabbitMQ connection
│   └── queues.ts              # Queue name constants
├── models/
│   ├── user.types.ts
│   ├── product.types.ts
│   ├── wishlist.types.ts
│   └── nudge.types.ts
└── middleware/
    ├── auth.ts                # JWT verify middleware
    ├── rateLimiter.ts
    └── logger.ts              # Pino logger
```

### 3.2 Database Schema

#### Migration 001 — Users Table
```sql
-- shared/db/migrations/001_create_users.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  user_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  device_token    VARCHAR(500),           -- FCM push token

  -- Body profile (Agent 2)
  body_height_range   VARCHAR(20),        -- e.g. "5'2\"–5'5\""
  body_shape          VARCHAR(30),        -- pear | apple | hourglass | rectangle | inverted_triangle
  fit_preference      VARCHAR(20),        -- slim | regular | relaxed
  comfort_priority    VARCHAR(20),        -- stretch | structure | drape | any
  body_profile_updated_at TIMESTAMPTZ,

  -- Purchase history summary (Agent 1)
  avg_order_day       SMALLINT,           -- 1–31
  salary_profile      VARCHAR(20),        -- EARLY | LATE | IRREGULAR
  orders_per_month    DECIMAL(4,2),

  -- Notification preferences
  notif_price_drop    BOOLEAN DEFAULT TRUE,
  notif_salary_nudge  BOOLEAN DEFAULT TRUE,
  notif_expiry        BOOLEAN DEFAULT TRUE,
  notif_stock_alert   BOOLEAN DEFAULT TRUE,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_salary_profile ON users(salary_profile);
```

#### Migration 002 — Products Table
```sql
-- shared/db/migrations/002_create_products.sql
CREATE TABLE products (
  product_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id     VARCHAR(100) UNIQUE,    -- Myntra's internal product ID
  title           VARCHAR(500) NOT NULL,
  category        VARCHAR(100),
  current_price   DECIMAL(10,2) NOT NULL,
  stock_count     INT DEFAULT 0,

  -- Structured attributes (Agent 2)
  attr_cut        VARCHAR(50),            -- wrap | a-line | straight | tapered | flared
  attr_fabric     VARCHAR(50),            -- cotton | chiffon | denim | polyester
  attr_silhouette VARCHAR(50),            -- fitted | relaxed | oversized | bodycon
  attr_fit_type   VARCHAR(30),            -- slim | regular | plus | petite
  attr_length     VARCHAR(20),            -- mini | midi | maxi | crop | full
  attr_source     VARCHAR(20) DEFAULT 'structured',  -- structured | llm_extracted

  -- Raw description for LLM fallback
  description     TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_external ON products(external_id);
CREATE INDEX idx_products_category ON products(category);

-- Price history as separate table
CREATE TABLE product_price_history (
  id              SERIAL PRIMARY KEY,
  product_id      UUID REFERENCES products(product_id) ON DELETE CASCADE,
  price           DECIMAL(10,2) NOT NULL,
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_history_product ON product_price_history(product_id, recorded_at DESC);
```

#### Migration 003 — Wishlist Table
```sql
-- shared/db/migrations/003_create_wishlists.sql
CREATE TABLE wishlist_items (
  wishlist_item_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES users(user_id) ON DELETE CASCADE,
  product_id          UUID REFERENCES products(product_id) ON DELETE CASCADE,

  added_at            TIMESTAMPTZ DEFAULT NOW(),
  price_at_add        DECIMAL(10,2) NOT NULL,

  -- Agent 1 fields
  last_nudge_sent_at  TIMESTAMPTZ,
  last_nudge_type     VARCHAR(30),
  nudge_count         INT DEFAULT 0,

  -- Agent 2 fields
  fit_match_score     SMALLINT,           -- 0–100
  fit_match_computed_at TIMESTAMPTZ,

  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlist_user ON wishlist_items(user_id);
CREATE INDEX idx_wishlist_added_at ON wishlist_items(added_at);
CREATE INDEX idx_wishlist_nudge ON wishlist_items(last_nudge_sent_at);
```

#### Migration 004 — Nudge Event Log
```sql
-- shared/db/migrations/004_create_nudge_logs.sql
CREATE TABLE nudge_event_log (
  event_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(user_id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(product_id) ON DELETE CASCADE,
  nudge_type      VARCHAR(30) NOT NULL,   -- price_drop | salary_day | expiry | stock_alert
  channel         VARCHAR(20) NOT NULL,   -- push | in_app
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  converted       BOOLEAN DEFAULT FALSE,
  conversion_at   TIMESTAMPTZ
);

CREATE INDEX idx_nudge_log_user ON nudge_event_log(user_id, sent_at DESC);
CREATE INDEX idx_nudge_log_product ON nudge_event_log(product_id);
```

### 3.3 Shared TypeScript Types

```typescript
// shared/models/user.types.ts
export type SalaryProfile = 'EARLY' | 'LATE' | 'IRREGULAR';
export type BodyShape = 'pear' | 'apple' | 'hourglass' | 'rectangle' | 'inverted_triangle';
export type FitPreference = 'slim' | 'regular' | 'relaxed';

export interface UserBodyProfile {
  heightRange: string;
  bodyShape: BodyShape;
  fitPreference: FitPreference;
  comfortPriority: 'stretch' | 'structure' | 'drape' | 'any';
  updatedAt: Date;
}

export interface User {
  userId: string;
  email: string;
  deviceToken?: string;
  bodyProfile?: UserBodyProfile;
  salaryProfile: SalaryProfile;
  avgOrderDay: number;
  notifPrefs: {
    priceDrop: boolean;
    salaryNudge: boolean;
    expiry: boolean;
    stockAlert: boolean;
  };
}
```

```typescript
// shared/models/product.types.ts
export type AttributeSource = 'structured' | 'llm_extracted';

export interface ProductAttributes {
  cut?: string;
  fabric?: string;
  silhouette?: string;
  fitType?: string;
  length?: string;
  source: AttributeSource;
}

export interface Product {
  productId: string;
  externalId: string;
  title: string;
  category: string;
  currentPrice: number;
  stockCount: number;
  attributes: ProductAttributes;
  description?: string;
}
```

```typescript
// shared/models/wishlist.types.ts
export type NudgeType = 'price_drop' | 'salary_day' | 'expiry' | 'stock_alert';

export interface WishlistItem {
  wishlistItemId: string;
  userId: string;
  productId: string;
  addedAt: Date;
  priceAtAdd: number;
  lastNudgeSentAt?: Date;
  lastNudgeType?: NudgeType;
  nudgeCount: number;
  fitMatchScore?: number;
  fitMatchComputedAt?: Date;
}
```

### 3.4 Run Migrations

```bash
# Install database migration tool
npm install -g db-migrate db-migrate-pg

# Run all migrations
db-migrate up --config shared/db/database.json

# Seed dev data
npx ts-node shared/db/seed.ts
```

### ✅ Phase 1 Acceptance Criteria
- [ ] All 4 migration files execute without errors
- [ ] Shared TypeScript types compile cleanly
- [ ] Redis `PING` returns `PONG` via shared client
- [ ] RabbitMQ queues declared successfully
- [ ] `shared` package importable from both agent services

---

## 4. Phase 2 — Agent 1: Smart Nudge Agent

### 🎯 Goal
Build the complete Smart Nudge Agent: price monitor, salary-day modeler, expiry watcher, deduplication filter, and FCM push dispatcher.

### 4.1 Service Initialization

```bash
cd services/agent1-nudge
npm init -y
npm install express fastify @types/express typescript ts-node nodemon
npm install bull ioredis pg firebase-admin axios node-cron
npm install pino pino-pretty
```

### 4.2 Files to Create

```
services/agent1-nudge/src/
├── index.ts                        # Service entry point
├── routes/
│   ├── nudge.routes.ts             # POST /nudge/trigger, GET /nudge/history
│   └── price.routes.ts             # GET /price/history/:productId
├── nudge-orchestrator/
│   └── orchestrator.ts             # Master orchestration logic
├── price-monitor/
│   ├── priceMonitor.ts             # Polls price feed + handles webhook
│   └── priceMonitor.test.ts
├── salary-modeler/
│   ├── salaryModeler.ts            # Purchase history → salary profile
│   └── salaryModeler.test.ts
├── expiry-watcher/
│   ├── expiryWatcher.ts            # 30-day intent window tracker
│   └── expiryWatcher.test.ts
├── nudge-evaluator/
│   ├── evaluator.ts                # Qualifies nudge triggers
│   ├── deduplicator.ts             # 48h dedup logic
│   └── priorityRanker.ts           # Price > Expiry > Salary ranking
└── notification/
    ├── fcmDispatcher.ts            # Firebase push sender
    ├── inAppAlert.ts               # In-app alert writer
    ├── templates.ts                # Notification message templates
    └── fcmDispatcher.test.ts
```

### 4.3 Core Implementation

#### Entry Point
```typescript
// services/agent1-nudge/src/index.ts
import express from 'express';
import { initSchedulers } from './nudge-orchestrator/orchestrator';
import nudgeRoutes from './routes/nudge.routes';
import priceRoutes from './routes/price.routes';
import { logger } from '../../shared/middleware/logger';

const app = express();
app.use(express.json());
app.use('/api/v1', nudgeRoutes);
app.use('/api/v1', priceRoutes);

const PORT = process.env.PORT_AGENT1 || 3001;

app.listen(PORT, async () => {
  logger.info(`🤖 Agent 1 — Smart Nudge Agent running on port ${PORT}`);
  await initSchedulers();
});
```

#### Nudge Orchestrator
```typescript
// services/agent1-nudge/src/nudge-orchestrator/orchestrator.ts
import cron from 'node-cron';
import { ExpiryWatcher } from '../expiry-watcher/expiryWatcher';
import { SalaryModeler } from '../salary-modeler/salaryModeler';
import { PriceMonitor } from '../price-monitor/priceMonitor';
import { logger } from '../../../shared/middleware/logger';

export async function initSchedulers() {
  // Run expiry watcher every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('⏳ Running expiry watcher...');
    await ExpiryWatcher.scan();
  });

  // Run salary-day checker daily at 9am
  cron.schedule('0 9 * * *', async () => {
    logger.info('💰 Running salary-day check...');
    await SalaryModeler.checkAndNudge();
  });

  // Start price monitor polling (every 15 min)
  cron.schedule('*/15 * * * *', async () => {
    logger.info('📉 Polling price feed...');
    await PriceMonitor.poll();
  });

  logger.info('✅ All nudge schedulers initialized');
}
```

#### Price Monitor
```typescript
// services/agent1-nudge/src/price-monitor/priceMonitor.ts
import axios from 'axios';
import { db } from '../../../shared/db/client';
import { NudgeEvaluator } from '../nudge-evaluator/evaluator';

export class PriceMonitor {
  private static THRESHOLD = Number(process.env.PRICE_DROP_THRESHOLD_PERCENT) || 5;

  // Called by cron or webhook
  static async handlePriceChange(productId: string, newPrice: number) {
    // Update current price + append history
    await db.query(
      `UPDATE products SET current_price = $1, updated_at = NOW() WHERE product_id = $2`,
      [newPrice, productId]
    );
    await db.query(
      `INSERT INTO product_price_history (product_id, price) VALUES ($1, $2)`,
      [productId, newPrice]
    );

    // Find all users who wishlisted this product
    const { rows: wishlistItems } = await db.query(
      `SELECT wi.*, u.device_token, u.notif_price_drop
       FROM wishlist_items wi
       JOIN users u ON wi.user_id = u.user_id
       WHERE wi.product_id = $1 AND u.notif_price_drop = TRUE`,
      [productId]
    );

    for (const item of wishlistItems) {
      const dropPercent = ((item.price_at_add - newPrice) / item.price_at_add) * 100;
      if (dropPercent >= PriceMonitor.THRESHOLD) {
        await NudgeEvaluator.evaluate({
          userId: item.user_id,
          productId,
          nudgeType: 'price_drop',
          deviceToken: item.device_token,
          metadata: { oldPrice: item.price_at_add, newPrice, dropPercent }
        });
      }
    }
  }

  // Polling fallback
  static async poll() {
    const { data: priceFeed } = await axios.get(
      `${process.env.PRICE_FEED_API_URL}/changes`
    );
    for (const change of priceFeed) {
      await PriceMonitor.handlePriceChange(change.productId, change.newPrice);
    }
  }
}
```

#### Salary-Day Modeler
```typescript
// services/agent1-nudge/src/salary-modeler/salaryModeler.ts
import { db } from '../../../shared/db/client';
import { NudgeEvaluator } from '../nudge-evaluator/evaluator';

export class SalaryModeler {
  // Compute salary profile from purchase history
  static inferProfile(orderDays: number[]): 'EARLY' | 'LATE' | 'IRREGULAR' {
    if (orderDays.length < 3) return 'IRREGULAR';
    const earlyCount = orderDays.filter(d => d <= 7).length;
    const lateCount  = orderDays.filter(d => d >= 25).length;
    const total = orderDays.length;
    if (earlyCount / total >= 0.6) return 'EARLY';
    if (lateCount  / total >= 0.6) return 'LATE';
    return 'IRREGULAR';
  }

  static async recomputeAllProfiles() {
    const { rows: users } = await db.query(`SELECT user_id FROM users`);
    for (const user of users) {
      // Fetch last 6 months of order day-of-month values (mocked here)
      const { rows: orders } = await db.query(
        `SELECT EXTRACT(DAY FROM order_date)::int AS day
         FROM orders
         WHERE user_id = $1 AND order_date > NOW() - INTERVAL '6 months'`,
        [user.user_id]
      );
      const days = orders.map((o: any) => o.day);
      const profile = SalaryModeler.inferProfile(days);
      await db.query(
        `UPDATE users SET salary_profile = $1, avg_order_day = $2 WHERE user_id = $3`,
        [profile, days[0] ?? null, user.user_id]
      );
    }
  }

  static async checkAndNudge() {
    const today = new Date().getDate();
    const isEarlyWindow = today >= 1 && today <= 5;
    const isLateWindow  = today >= 28;

    let profile: string | null = null;
    if (isEarlyWindow) profile = 'EARLY';
    else if (isLateWindow) profile = 'LATE';
    if (!profile) return;

    const { rows: users } = await db.query(
      `SELECT u.user_id, u.device_token, wi.product_id
       FROM users u
       JOIN wishlist_items wi ON u.user_id = wi.user_id
       WHERE u.salary_profile = $1 AND u.notif_salary_nudge = TRUE`,
      [profile]
    );

    for (const user of users) {
      await NudgeEvaluator.evaluate({
        userId: user.user_id,
        productId: user.product_id,
        nudgeType: 'salary_day',
        deviceToken: user.device_token,
        metadata: {}
      });
    }
  }
}
```

#### Expiry Watcher
```typescript
// services/agent1-nudge/src/expiry-watcher/expiryWatcher.ts
import { db } from '../../../shared/db/client';
import { NudgeEvaluator } from '../nudge-evaluator/evaluator';

export class ExpiryWatcher {
  static async scan() {
    // Find items in wishlist for 20–30 days with no nudge sent yet today
    const { rows: expiringItems } = await db.query(`
      SELECT wi.user_id, wi.product_id, u.device_token,
             EXTRACT(DAY FROM NOW() - wi.added_at)::int AS days_in_wishlist
      FROM wishlist_items wi
      JOIN users u ON wi.user_id = u.user_id
      WHERE EXTRACT(DAY FROM NOW() - wi.added_at) BETWEEN 20 AND 30
        AND u.notif_expiry = TRUE
        AND (wi.last_nudge_sent_at IS NULL
             OR wi.last_nudge_sent_at < NOW() - INTERVAL '48 hours')
    `);

    for (const item of expiringItems) {
      await NudgeEvaluator.evaluate({
        userId: item.user_id,
        productId: item.product_id,
        nudgeType: 'expiry',
        deviceToken: item.device_token,
        metadata: { daysInWishlist: item.days_in_wishlist }
      });
    }
  }
}
```

#### Nudge Evaluator + Deduplicator
```typescript
// services/agent1-nudge/src/nudge-evaluator/evaluator.ts
import { Deduplicator } from './deduplicator';
import { PriorityRanker } from './priorityRanker';
import { FCMDispatcher } from '../notification/fcmDispatcher';
import { db } from '../../../shared/db/client';

export interface NudgePayload {
  userId: string;
  productId: string;
  nudgeType: 'price_drop' | 'salary_day' | 'expiry' | 'stock_alert';
  deviceToken: string;
  metadata: Record<string, any>;
}

export class NudgeEvaluator {
  static async evaluate(payload: NudgePayload) {
    // 1. Check deduplication
    const isDupe = await Deduplicator.check(payload.userId, payload.productId);
    if (isDupe) return;

    // 2. Check daily nudge cap (max 3/user/day)
    const dailyCount = await Deduplicator.dailyCount(payload.userId);
    if (dailyCount >= 3) return;

    // 3. Dispatch notification
    await FCMDispatcher.send(payload);

    // 4. Log nudge event
    await db.query(
      `INSERT INTO nudge_event_log (user_id, product_id, nudge_type, channel)
       VALUES ($1, $2, $3, 'push')`,
      [payload.userId, payload.productId, payload.nudgeType]
    );

    // 5. Update wishlist item
    await db.query(
      `UPDATE wishlist_items
       SET last_nudge_sent_at = NOW(), last_nudge_type = $1, nudge_count = nudge_count + 1
       WHERE user_id = $2 AND product_id = $3`,
      [payload.nudgeType, payload.userId, payload.productId]
    );
  }
}
```

#### Notification Templates
```typescript
// services/agent1-nudge/src/notification/templates.ts
export const NudgeTemplates = {
  price_drop: (item: string, oldPrice: number, newPrice: number) => ({
    title: '📉 Price Drop Alert!',
    body: `${item} just dropped from ₹${oldPrice} to ₹${newPrice} — grab it now!`
  }),
  salary_day: (count: number) => ({
    title: '💰 Payday treat time!',
    body: `${count} wishlisted items are waiting for you. Treat yourself!`
  }),
  expiry: (item: string, days: number) => ({
    title: "⏳ Don't lose this!",
    body: `${item} has been in your wishlist for ${days} days — still interested?`
  }),
  stock_alert: (item: string, stock: number) => ({
    title: '🔥 Almost gone!',
    body: `Only ${stock} left! ${item} from your wishlist is running out.`
  })
};
```

### ✅ Phase 2 Acceptance Criteria
- [ ] Price drop webhook triggers push notification end-to-end
- [ ] Salary-day cron fires correctly for EARLY/LATE profiles
- [ ] Expiry watcher identifies items aged 20–30 days
- [ ] Deduplication prevents duplicate nudges within 48h
- [ ] Daily cap of 3 nudges per user is enforced
- [ ] All unit tests pass (`npm test` in agent1-nudge)

---

## 5. Phase 3 — Agent 2: Fit-Confidence Match Agent

### 🎯 Goal
Build the Fit-Confidence Match Agent: body-type profile capture, LLM-powered product attribute extraction, and the heuristic scoring engine.

### 5.1 Service Initialization

```bash
cd services/agent2-fit
npm install express typescript ts-node
npm install @google/generative-ai ioredis pg
npm install pino pino-pretty zod
```

### 5.2 Files to Create

```
services/agent2-fit/src/
├── index.ts
├── routes/
│   └── fit.routes.ts               # All /fit/* endpoints
├── fit-orchestrator/
│   └── orchestrator.ts             # Coordinates profile + scoring
├── profile/
│   ├── profileService.ts           # CRUD for body-type profile
│   └── profileService.test.ts
├── attribute-parser/
│   ├── attributeParser.ts          # Structured field extraction
│   └── attributeParser.test.ts
├── llm-extractor/
│   ├── llmExtractor.ts             # Gemini-powered extraction
│   ├── prompt.ts                   # Extraction prompt template
│   └── llmExtractor.test.ts
├── scoring-engine/
│   ├── scoringEngine.ts            # Heuristic matrix scoring
│   ├── heuristicMatrix.ts          # Body shape × attribute compatibility
│   └── scoringEngine.test.ts
└── cache/
    └── fitScoreCache.ts            # Redis read/write for scores
```

### 5.3 Core Implementation

#### Fit Orchestrator
```typescript
// services/agent2-fit/src/fit-orchestrator/orchestrator.ts
import { ProfileService } from '../profile/profileService';
import { AttributeParser } from '../attribute-parser/attributeParser';
import { LLMExtractor } from '../llm-extractor/llmExtractor';
import { ScoringEngine } from '../scoring-engine/scoringEngine';
import { FitScoreCache } from '../cache/fitScoreCache';
import { db } from '../../../shared/db/client';

export class FitOrchestrator {
  static async getScore(userId: string, productId: string) {
    // 1. Check cache first
    const cached = await FitScoreCache.get(userId, productId);
    if (cached) return cached;

    // 2. Fetch user body profile
    const profile = await ProfileService.getProfile(userId);
    if (!profile) return null; // User hasn't completed onboarding

    // 3. Fetch product
    const { rows } = await db.query(
      `SELECT * FROM products WHERE product_id = $1`, [productId]
    );
    const product = rows[0];
    if (!product) return null;

    // 4. Extract attributes (structured → LLM fallback)
    let attributes = AttributeParser.extract(product);
    if (!attributes.isComplete()) {
      attributes = await LLMExtractor.extract(product.description);
      // Cache LLM-extracted attrs back to DB
      await AttributeParser.persist(productId, attributes);
    }

    // 5. Compute score
    const result = ScoringEngine.score(profile, attributes);

    // 6. Cache result (TTL: 7 days)
    await FitScoreCache.set(userId, productId, result);

    // 7. Persist to wishlist_items
    await db.query(
      `UPDATE wishlist_items SET fit_match_score = $1, fit_match_computed_at = NOW()
       WHERE user_id = $2 AND product_id = $3`,
      [result.score, userId, productId]
    );

    return result;
  }

  // Bulk-score all items in a user's wishlist
  static async scoreWishlist(userId: string) {
    const { rows: items } = await db.query(
      `SELECT product_id FROM wishlist_items WHERE user_id = $1`, [userId]
    );
    return Promise.all(
      items.map((i: any) => FitOrchestrator.getScore(userId, i.product_id))
    );
  }
}
```

#### LLM Attribute Extractor
```typescript
// services/agent2-fit/src/llm-extractor/llmExtractor.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EXTRACTION_PROMPT } from './prompt';
import { ProductAttributes } from '../../../shared/models/product.types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export class LLMExtractor {
  static async extract(description: string): Promise<ProductAttributes> {
    const prompt = EXTRACTION_PROMPT.replace('{{DESCRIPTION}}', description);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      const parsed = JSON.parse(text);
      return { ...parsed, source: 'llm_extracted' };
    } catch {
      return { source: 'llm_extracted' }; // Graceful fallback
    }
  }
}
```

```typescript
// services/agent2-fit/src/llm-extractor/prompt.ts
export const EXTRACTION_PROMPT = `
You are a fashion attribute extractor. Given a clothing product description,
extract the following attributes in valid JSON format. Use ONLY the allowed values.

Product Description:
{{DESCRIPTION}}

Return ONLY a JSON object with these keys (use null if unknown):
{
  "cut": "wrap" | "a-line" | "straight" | "tapered" | "flared" | "asymmetric" | null,
  "fabric": "cotton" | "chiffon" | "denim" | "polyester" | "linen" | "silk" | "jersey" | null,
  "silhouette": "fitted" | "relaxed" | "oversized" | "bodycon" | "a-line" | null,
  "fit_type": "slim" | "regular" | "plus" | "petite" | null,
  "length": "mini" | "midi" | "maxi" | "crop" | "full" | null
}

Return ONLY the JSON object, no explanation, no markdown.
`.trim();
```

#### Heuristic Scoring Engine
```typescript
// services/agent2-fit/src/scoring-engine/heuristicMatrix.ts

// Compatibility matrix: body_shape → silhouette/cut → score (0.0–1.0)
export const SILHOUETTE_MATRIX: Record<string, Record<string, number>> = {
  pear: {
    'a-line': 1.0, 'flared': 0.9, 'wrap': 0.9, 'relaxed': 0.7,
    'fitted': 0.4, 'bodycon': 0.2, 'straight': 0.6, 'oversized': 0.6
  },
  apple: {
    'wrap': 1.0, 'a-line': 0.8, 'relaxed': 0.9, 'oversized': 0.7,
    'fitted': 0.3, 'bodycon': 0.2, 'straight': 0.7, 'flared': 0.6
  },
  hourglass: {
    'wrap': 1.0, 'fitted': 0.9, 'bodycon': 0.8, 'a-line': 0.8,
    'straight': 0.7, 'relaxed': 0.6, 'flared': 0.7, 'oversized': 0.5
  },
  rectangle: {
    'flared': 0.9, 'a-line': 0.8, 'wrap': 0.8, 'fitted': 0.7,
    'bodycon': 0.7, 'straight': 0.6, 'relaxed': 0.6, 'oversized': 0.5
  },
  inverted_triangle: {
    'a-line': 0.9, 'flared': 1.0, 'straight': 0.8, 'relaxed': 0.7,
    'wrap': 0.7, 'fitted': 0.5, 'bodycon': 0.4, 'oversized': 0.5
  }
};

export const FIT_PREFERENCE_MATRIX: Record<string, Record<string, number>> = {
  slim:    { slim: 1.0, regular: 0.6, plus: 0.2, petite: 0.8 },
  regular: { slim: 0.7, regular: 1.0, plus: 0.5, petite: 0.7 },
  relaxed: { slim: 0.3, regular: 0.7, plus: 0.8, petite: 0.6 }
};

export const ATTRIBUTE_WEIGHTS = {
  silhouette: 0.35,
  cut:        0.30,
  fit_type:   0.20,
  fabric:     0.10,
  length:     0.05
};
```

```typescript
// services/agent2-fit/src/scoring-engine/scoringEngine.ts
import { SILHOUETTE_MATRIX, FIT_PREFERENCE_MATRIX, ATTRIBUTE_WEIGHTS } from './heuristicMatrix';
import { UserBodyProfile } from '../../../shared/models/user.types';
import { ProductAttributes } from '../../../shared/models/product.types';

export interface ScoreResult {
  score: number;       // 0–100
  band: 'great' | 'likely' | 'risky';
  rationale: string;
}

export class ScoringEngine {
  static score(profile: UserBodyProfile, attrs: ProductAttributes): ScoreResult {
    let weightedSum = 0;
    let totalWeight = 0;

    // Silhouette
    if (attrs.silhouette) {
      const compat = SILHOUETTE_MATRIX[profile.bodyShape]?.[attrs.silhouette] ?? 0.5;
      weightedSum += compat * ATTRIBUTE_WEIGHTS.silhouette;
      totalWeight += ATTRIBUTE_WEIGHTS.silhouette;
    }
    // Cut (use silhouette matrix as approximation)
    if (attrs.cut) {
      const compat = SILHOUETTE_MATRIX[profile.bodyShape]?.[attrs.cut] ?? 0.5;
      weightedSum += compat * ATTRIBUTE_WEIGHTS.cut;
      totalWeight += ATTRIBUTE_WEIGHTS.cut;
    }
    // Fit type
    if (attrs.fitType) {
      const compat = FIT_PREFERENCE_MATRIX[profile.fitPreference]?.[attrs.fitType] ?? 0.5;
      weightedSum += compat * ATTRIBUTE_WEIGHTS.fit_type;
      totalWeight += ATTRIBUTE_WEIGHTS.fit_type;
    }
    // Fabric & length are neutral (0.6) if not matched
    weightedSum += 0.6 * ATTRIBUTE_WEIGHTS.fabric;
    totalWeight += ATTRIBUTE_WEIGHTS.fabric;
    weightedSum += 0.6 * ATTRIBUTE_WEIGHTS.length;
    totalWeight += ATTRIBUTE_WEIGHTS.length;

    const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
    const score = Math.round(rawScore * 100);

    const band = score >= 80 ? 'great' : score >= 60 ? 'likely' : 'risky';
    const rationale = ScoringEngine.buildRationale(profile, attrs, score);

    return { score, band, rationale };
  }

  private static buildRationale(
    profile: UserBodyProfile,
    attrs: ProductAttributes,
    score: number
  ): string {
    if (score >= 80) {
      return `${attrs.cut ?? attrs.silhouette} cut is a great match for ${profile.bodyShape} body shapes`;
    } else if (score >= 60) {
      return `Likely to work for your body type — check the size guide`;
    } else {
      return `This cut may not align with your fit preference (${profile.fitPreference})`;
    }
  }
}
```

### ✅ Phase 3 Acceptance Criteria
- [ ] `POST /api/v1/fit/profile` saves body profile to DB
- [ ] `GET /api/v1/fit/score/:userId/:productId` returns score for structured product
- [ ] LLM extractor successfully parses unstructured description into attributes
- [ ] Scoring matrix produces correct score for documented example (pear + A-line = ~82%)
- [ ] Score is cached in Redis and served from cache on second request (< 50ms)
- [ ] All unit tests pass for scoring engine and LLM extractor

---

## 6. Phase 4 — API Gateway & Service Integration

### 🎯 Goal
Stand up the Nginx API Gateway, wire up JWT auth, connect both agents under a unified routing layer, and implement shared webhooks.

### 6.1 Files to Create

```
gateway/
├── nginx.conf                      # Reverse proxy config
shared/middleware/
├── auth.ts                         # JWT verify middleware
├── rateLimiter.ts                  # express-rate-limit setup
└── errorHandler.ts                 # Global error handler
```

### 6.2 Nginx Gateway Config

```nginx
# gateway/nginx.conf
upstream agent1_nudge {
    server agent1-nudge:3001;
}

upstream agent2_fit {
    server agent2-fit:3002;
}

server {
    listen 3000;

    # Smart Nudge Agent routes
    location /api/v1/nudge/ {
        proxy_pass http://agent1_nudge;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Authorization $http_authorization;
    }

    location /api/v1/price/ {
        proxy_pass http://agent1_nudge;
    }

    location /api/v1/events/price-change {
        proxy_pass http://agent1_nudge;
    }

    # Fit-Confidence Agent routes
    location /api/v1/fit/ {
        proxy_pass http://agent2_fit;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Authorization $http_authorization;
    }

    # Shared wishlist endpoint (fan-out to both agents)
    location /api/v1/wishlist/ {
        proxy_pass http://agent2_fit;   # Agent 2 enriches wishlist
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req zone=api burst=20 nodelay;
}
```

### 6.3 JWT Auth Middleware
```typescript
// shared/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 6.4 Webhook: Wishlist Add Event
```typescript
// Trigger fit-score computation when user adds to wishlist
// POST /api/v1/events/wishlist-add
router.post('/events/wishlist-add', authMiddleware, async (req, res) => {
  const { userId, productId, priceAtAdd } = req.body;

  // Persist wishlist item
  await db.query(
    `INSERT INTO wishlist_items (user_id, product_id, price_at_add)
     VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
    [userId, productId, priceAtAdd]
  );

  // Async: trigger fit score computation
  await queue.publish('fit.score.compute', { userId, productId });

  res.json({ success: true });
});
```

### ✅ Phase 4 Acceptance Criteria
- [ ] Nginx routes `/api/v1/nudge/*` to Agent 1 and `/api/v1/fit/*` to Agent 2
- [ ] JWT auth blocks unauthenticated requests with 401
- [ ] Rate limiter enforces 100 req/min per user
- [ ] Wishlist-add webhook persists item and enqueues fit score job
- [ ] Price-change webhook triggers nudge evaluation

---

## 7. Phase 5 — Frontend Integration

### 🎯 Goal
Integrate both agent outputs into the Myntra app UI: Fit-Match Score badge on wishlist cards, and the body-type onboarding modal.

### 7.1 Components to Build

```
frontend/                           # React Native components
├── components/
│   ├── FitScoreBadge.tsx           # Score badge (🟢/🟡/🔴)
│   ├── WishlistCard.tsx            # Enhanced wishlist card
│   └── onboarding/
│       ├── BodyTypeOnboarding.tsx  # Multi-step modal
│       ├── Step1Height.tsx
│       ├── Step2BodyShape.tsx
│       ├── Step3FitPreference.tsx
│       └── Step4Comfort.tsx
├── hooks/
│   ├── useFitScore.ts              # Hook to fetch + cache fit score
│   └── useWishlistNudge.ts         # Hook to check nudge status
└── api/
    ├── fitApi.ts                   # Agent 2 API calls
    └── nudgeApi.ts                 # Agent 1 API calls
```

### 7.2 Fit Score Badge Component

```tsx
// frontend/components/FitScoreBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  score: number;
  rationale: string;
}

const getBandColor = (score: number) => {
  if (score >= 80) return '#22c55e';  // Green
  if (score >= 60) return '#f59e0b';  // Amber
  return '#ef4444';                   // Red
};

export const FitScoreBadge: React.FC<Props> = ({ score, rationale }) => (
  <View style={styles.container}>
    <View style={[styles.badge, { borderColor: getBandColor(score) }]}>
      <Text style={[styles.scoreText, { color: getBandColor(score) }]}>
        🎯 Fit Match: {score}%
      </Text>
    </View>
    <Text style={styles.rationale}>{rationale}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  badge: { borderWidth: 1.5, borderRadius: 6, padding: 4, alignSelf: 'flex-start' },
  scoreText: { fontSize: 13, fontWeight: '600' },
  rationale: { fontSize: 11, color: '#6b7280', marginTop: 4 }
});
```

### 7.3 Body-Type Onboarding Flow

```tsx
// frontend/components/onboarding/BodyTypeOnboarding.tsx
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { fitApi } from '../../api/fitApi';

const STEPS = [
  {
    key: 'heightRange',
    question: "What's your height range?",
    options: ["Under 5'2\"", "5'2\"–5'5\"", "5'5\"–5'8\"", "Above 5'8\""]
  },
  {
    key: 'bodyShape',
    question: "Which best describes your body shape?",
    options: ['Pear', 'Apple', 'Hourglass', 'Rectangle', 'Inverted Triangle']
  },
  {
    key: 'fitPreference',
    question: "How do you prefer your clothes to fit?",
    options: ['Slim / Fitted', 'Regular', 'Relaxed / Oversized']
  },
  {
    key: 'comfortPriority',
    question: "What matters most in comfort?",
    options: ['Stretch', 'Structure', 'Drape', 'Any']
  }
];

export const BodyTypeOnboarding: React.FC<{ visible: boolean; onDone: () => void }> = ({
  visible, onDone
}) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSelect = async (value: string) => {
    const updated = { ...answers, [STEPS[step].key]: value };
    setAnswers(updated);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      await fitApi.saveProfile(updated);
      onDone();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0008' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24 }}>
          <Text style={{ fontSize: 10, color: '#9ca3af' }}>
            Step {step + 1} of {STEPS.length}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: '700', marginVertical: 12 }}>
            {STEPS[step].question}
          </Text>
          {STEPS[step].options.map(opt => (
            <TouchableOpacity
              key={opt}
              onPress={() => handleSelect(opt)}
              style={{ padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 8 }}
            >
              <Text style={{ fontSize: 15 }}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};
```

### ✅ Phase 5 Acceptance Criteria
- [ ] Wishlist card renders Fit-Match Score badge with correct color band
- [ ] Onboarding modal completes in 4 steps and saves profile via API
- [ ] Score badge updates within 2s of onboarding completion
- [ ] Nudge push notifications deep-link to the correct wishlist item
- [ ] UI handles missing score gracefully (no crash if profile not set)

---

## 8. Phase 6 — Testing, QA & Hardening

### 🎯 Goal
Comprehensive test coverage across unit, integration, and E2E layers. Load test to validate performance targets.

### 8.1 Unit Tests

```bash
# Run unit tests for all services
npm test --workspaces

# Individual service tests
npm test --workspace=services/agent1-nudge
npm test --workspace=services/agent2-fit
```

**Key unit test cases:**

| Module | Test Cases |
|--------|-----------|
| `SalaryModeler.inferProfile` | EARLY (60%+ early orders) · LATE · IRREGULAR (< 3 orders) |
| `ScoringEngine.score` | Pear + A-line = ~82% · Apple + bodycon = ~20% |
| `Deduplicator.check` | Returns true within 48h · Returns false after 48h |
| `AttributeParser.extract` | Extracts correctly from structured product · Marks incomplete when fields missing |
| `LLMExtractor.extract` | Valid JSON returned · Graceful fallback on parse error |
| `NudgeTemplates` | All 4 templates render with correct variable substitution |

### 8.2 Integration Tests

```typescript
// Test: Full price-drop nudge flow
describe('Price Drop Nudge — Integration', () => {
  it('should send push when price drops >= 5%', async () => {
    // Seed: user with device token, product at ₹1000
    // Action: fire price change to ₹900 (10% drop)
    // Assert: nudge_event_log has one record, FCM called once
  });

  it('should NOT send if nudge sent within 48h', async () => {
    // Seed: wishlist item with last_nudge_sent_at = 1h ago
    // Action: fire price change
    // Assert: FCM not called
  });
});

// Test: Fit score computation flow
describe('Fit Score — Integration', () => {
  it('should compute and cache score end-to-end', async () => {
    // POST /fit/profile with pear body shape
    // GET /fit/score/:userId/:productId (A-line dress)
    // Assert: score 75–90, band = 'great'
    // GET again: assert served from cache (< 50ms)
  });
});
```

### 8.3 API Contract Tests

```bash
# Install Newman for Postman collection runner
npm install -g newman

# Run API contract tests
newman run docs/postman_collection.json --env-var BASE_URL=http://localhost:3000
```

### 8.4 Load Testing

```bash
# Install k6
# Test: Fit score API — 100 concurrent users
k6 run --vus 100 --duration 30s infra/load-tests/fit-score.js

# Expected results:
# p95 latency (cached):    < 50ms   ✅
# p95 latency (cold):      < 800ms  ✅
# Error rate:              < 0.1%   ✅
```

```javascript
// infra/load-tests/fit-score.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export default function () {
  const res = http.get(
    'http://localhost:3000/api/v1/fit/score/user-123/product-456',
    { headers: { Authorization: 'Bearer test-token' } }
  );
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has score': (r) => JSON.parse(r.body).score !== undefined,
    'latency < 800ms': (r) => r.timings.duration < 800
  });
  sleep(0.1);
}
```

### 8.5 Security Hardening

```bash
# Dependency vulnerability scan
npm audit --all-workspaces

# Check for secrets in code
npx detect-secrets scan

# TypeScript strict mode — ensure tsconfig has:
# "strict": true, "noImplicitAny": true, "strictNullChecks": true
```

### ✅ Phase 6 Acceptance Criteria
- [ ] Unit test coverage ≥ 80% across both agents
- [ ] All integration tests pass in CI
- [ ] Load test: p95 cached latency < 50ms, cold < 800ms
- [ ] `npm audit` shows 0 critical vulnerabilities
- [ ] No secrets detected in codebase by `detect-secrets`

---

## 9. Phase 7 — Production Deployment & Monitoring

### 🎯 Goal
Containerize both agents, deploy to Kubernetes, configure CI/CD, and bring observability online.

### 9.1 Dockerfiles

```dockerfile
# services/agent1-nudge/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

```dockerfile
# services/agent2-fit/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3002
CMD ["node", "dist/index.js"]
```

### 9.2 Kubernetes Manifests

```yaml
# infra/k8s/agent1-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent1-nudge
spec:
  replicas: 2
  selector:
    matchLabels:
      app: agent1-nudge
  template:
    metadata:
      labels:
        app: agent1-nudge
    spec:
      containers:
        - name: agent1-nudge
          image: myntra-agent1-nudge:latest
          ports:
            - containerPort: 3001
          envFrom:
            - secretRef:
                name: myntra-agent-secrets
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          readinessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 10
```

### 9.3 GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy Myntra AI Agent

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test --workspaces
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build & push Docker images
        run: |
          docker build -t myntra-agent1:${{ github.sha }} services/agent1-nudge
          docker build -t myntra-agent2:${{ github.sha }} services/agent2-fit
          docker push myntra-agent1:${{ github.sha }}
          docker push myntra-agent2:${{ github.sha }}

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/agent1-nudge agent1-nudge=myntra-agent1:${{ github.sha }}
          kubectl set image deployment/agent2-fit   agent2-fit=myntra-agent2:${{ github.sha }}
          kubectl rollout status deployment/agent1-nudge
          kubectl rollout status deployment/agent2-fit
```

### 9.4 Observability Setup

```yaml
# Prometheus scrape config (infra/prometheus.yml)
scrape_configs:
  - job_name: 'agent1-nudge'
    static_configs:
      - targets: ['agent1-nudge:3001']
    metrics_path: '/metrics'

  - job_name: 'agent2-fit'
    static_configs:
      - targets: ['agent2-fit:3002']
    metrics_path: '/metrics'
```

**Key Dashboards to build in Grafana:**

| Dashboard | Metrics |
|-----------|---------|
| Nudge Performance | Nudges sent/hr · Conversion rate by nudge type · 48h dedup hit rate |
| Fit Score Engine | Score computation latency (p50/p95/p99) · Cache hit rate · LLM extraction rate |
| System Health | CPU/Memory per pod · DB query latency · Redis hit ratio · Queue depth |
| Business KPIs | Wishlist → cart conversion rate · % users with body profile set |

### ✅ Phase 7 Acceptance Criteria
- [ ] Both agents containerized and running in K8s with health checks passing
- [ ] CI pipeline: test → build → deploy runs successfully on `main` push
- [ ] Prometheus metrics visible in Grafana dashboards
- [ ] Structured logs flowing to CloudWatch / Datadog
- [ ] Rollback tested: `kubectl rollout undo` restores previous version

---

## 10. Overall Timeline

```
Week 1  │ Phase 0 (Days 1–3)    + Phase 1 (Days 4–8)
Week 2  │ Phase 2 (Days 9–15)   Agent 1 — Smart Nudge
Week 3  │ Phase 3 (Days 16–25)  Agent 2 — Fit-Confidence Match
Week 4  │ Phase 4 (Days 26–29)  + Phase 5 (Days 30–34)
Week 5  │ Phase 6 (Days 35–39)  + Phase 7 (Days 40–42)
```

**Total estimated effort: ~42 developer-days (8–9 weeks for a solo dev)**

---

## 11. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Gemini LLM API rate limits hit during bulk extraction | Medium | High | Implement exponential backoff + batch extraction with queue |
| FCM push token stale/expired for users | High | Medium | Refresh token on app open; handle FCM 404 gracefully |
| Body-type heuristic matrix is inaccurate | Medium | High | A/B test score bands; allow user feedback ("Was this accurate?") |
| Price feed API is unreliable / missing products | Medium | Medium | Cron polling as fallback; log missing product IDs |
| Low onboarding completion rate | High | High | Make onboarding optional, surface score only if profile set; incentivize with "Try it free" |
| DB query performance on large wishlist tables | Low | High | Add composite indexes; use read replicas for wishlist queries |
| Notification fatigue causing opt-outs | Medium | High | Enforce daily cap (3/day); monitor opt-out rate as KPI |

---

*Implementation Plan version: 1.0 · Last updated: August 2026*
