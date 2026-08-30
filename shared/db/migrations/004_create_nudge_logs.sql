-- shared/db/migrations/004_create_nudge_logs.sql
-- Audit log of every nudge dispatched by Agent 1.
-- Used for deduplication checks, conversion tracking, and A/B analytics.

CREATE TABLE IF NOT EXISTS nudge_event_log (
  event_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(user_id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(product_id) ON DELETE CASCADE,
  nudge_type      VARCHAR(30) NOT NULL,   -- price_drop | salary_day | expiry | stock_alert
  channel         VARCHAR(20) NOT NULL,   -- push | in_app
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  converted       BOOLEAN DEFAULT FALSE,
  conversion_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_nudge_log_user
  ON nudge_event_log(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_nudge_log_product
  ON nudge_event_log(product_id);
-- Index for deduplication: check last nudge per user+product within 48h
CREATE INDEX IF NOT EXISTS idx_nudge_log_dedup
  ON nudge_event_log(user_id, product_id, sent_at DESC);
