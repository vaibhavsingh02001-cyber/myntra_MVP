-- shared/db/migrations/002_create_products.sql
-- Creates the products table with structured attributes for Agent 2 scoring,
-- plus a price history sub-table for Agent 1 price drop tracking.

CREATE TABLE IF NOT EXISTS products (
  product_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id     VARCHAR(100) UNIQUE,    -- Myntra's internal product ID
  title           VARCHAR(500) NOT NULL,
  category        VARCHAR(100),           -- e.g. women/dresses, men/shirts
  current_price   DECIMAL(10,2) NOT NULL,
  stock_count     INT DEFAULT 0,

  -- Structured attributes (Agent 2)
  attr_cut        VARCHAR(50),            -- wrap | a-line | straight | tapered | flared | asymmetric
  attr_fabric     VARCHAR(50),            -- cotton | chiffon | denim | polyester | linen | silk | jersey
  attr_silhouette VARCHAR(50),            -- fitted | relaxed | oversized | bodycon | a-line
  attr_fit_type   VARCHAR(30),            -- slim | regular | plus | petite
  attr_length     VARCHAR(20),            -- mini | midi | maxi | crop | full
  attr_source     VARCHAR(20) DEFAULT 'structured',  -- structured | llm_extracted

  -- Raw description for LLM fallback (Agent 2)
  description     TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_external  ON products(external_id);
CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock     ON products(stock_count);

-- Separate price history table for trend tracking (Agent 1)
CREATE TABLE IF NOT EXISTS product_price_history (
  id              SERIAL PRIMARY KEY,
  product_id      UUID REFERENCES products(product_id) ON DELETE CASCADE,
  price           DECIMAL(10,2) NOT NULL,
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product
  ON product_price_history(product_id, recorded_at DESC);
