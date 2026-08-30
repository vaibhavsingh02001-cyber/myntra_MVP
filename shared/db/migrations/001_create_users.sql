-- shared/db/migrations/001_create_users.sql
-- Creates the users table with body profile fields (Agent 2),
-- purchase history summary (Agent 1), and notification preferences.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  user_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  device_token    VARCHAR(500),           -- FCM push token

  -- Body profile (Agent 2)
  body_height_range       VARCHAR(20),    -- e.g. "5'2"-5'5""
  body_shape              VARCHAR(30),    -- pear | apple | hourglass | rectangle | inverted_triangle
  fit_preference          VARCHAR(20),    -- slim | regular | relaxed
  comfort_priority        VARCHAR(20),    -- stretch | structure | drape | any
  body_profile_updated_at TIMESTAMPTZ,

  -- Purchase history summary (Agent 1)
  avg_order_day       SMALLINT,           -- 1–31
  salary_profile      VARCHAR(20) DEFAULT 'IRREGULAR', -- EARLY | LATE | IRREGULAR
  orders_per_month    DECIMAL(4,2) DEFAULT 0,

  -- Notification preferences
  notif_price_drop    BOOLEAN DEFAULT TRUE,
  notif_salary_nudge  BOOLEAN DEFAULT TRUE,
  notif_expiry        BOOLEAN DEFAULT TRUE,
  notif_stock_alert   BOOLEAN DEFAULT TRUE,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_salary_profile ON users(salary_profile);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
