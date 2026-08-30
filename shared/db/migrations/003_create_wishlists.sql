-- shared/db/migrations/003_create_wishlists.sql
-- Creates the wishlist_items join table that holds Agent 1 nudge state
-- and Agent 2 fit-match score for each user × product pair.

CREATE TABLE IF NOT EXISTS wishlist_items (
  wishlist_item_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES users(user_id) ON DELETE CASCADE,
  product_id          UUID REFERENCES products(product_id) ON DELETE CASCADE,

  added_at            TIMESTAMPTZ DEFAULT NOW(),
  price_at_add        DECIMAL(10,2) NOT NULL,

  -- Agent 1: nudge tracking state
  last_nudge_sent_at  TIMESTAMPTZ,
  last_nudge_type     VARCHAR(30),        -- price_drop | salary_day | expiry | stock_alert
  nudge_count         INT DEFAULT 0,

  -- Agent 2: fit-match score
  fit_match_score       SMALLINT,         -- 0–100
  fit_match_computed_at TIMESTAMPTZ,

  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user     ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_added_at ON wishlist_items(added_at);
CREATE INDEX IF NOT EXISTS idx_wishlist_nudge    ON wishlist_items(last_nudge_sent_at);
-- Composite index for expiry watcher query
CREATE INDEX IF NOT EXISTS idx_wishlist_expiry
  ON wishlist_items(added_at, last_nudge_sent_at)
  WHERE last_nudge_sent_at IS NULL OR last_nudge_sent_at < NOW() - INTERVAL '48 hours';
