// ── Nudge & Wishlist Types ───────────────────────────────────────────────────

export type NudgeType =
  | 'price_drop'
  | 'salary_day'
  | 'expiry'
  | 'stock_alert';

export type NudgeChannel = 'push' | 'in_app';

export type FitScoreBand = 'great' | 'likely' | 'risky';

// ── Wishlist Item ────────────────────────────────────────────────────────────

export interface WishlistItem {
  wishlistItemId: string;
  userId: string;
  productId: string;
  addedAt: Date;
  priceAtAdd: number;
  // Agent 1
  lastNudgeSentAt?: Date;
  lastNudgeType?: NudgeType;
  nudgeCount: number;
  // Agent 2
  fitMatchScore?: number;
  fitMatchComputedAt?: Date;
}

/** Enriched wishlist item served to the frontend */
export interface EnrichedWishlistItem extends WishlistItem {
  productTitle: string;
  currentPrice: number;
  stockCount: number;
  priceDrop?: number;         // % drop since wishlist-add
  fitScoreBand?: FitScoreBand;
  fitScoreRationale?: string;
}

// ── Nudge Event Log ──────────────────────────────────────────────────────────

export interface NudgeEvent {
  eventId: string;
  userId: string;
  productId: string;
  nudgeType: NudgeType;
  channel: NudgeChannel;
  sentAt: Date;
  converted: boolean;
  conversionAt?: Date;
}

// ── Queue Payloads ───────────────────────────────────────────────────────────

export interface WishlistAddPayload {
  userId: string;
  productId: string;
  priceAtAdd: number;
}

export interface FitScoreComputePayload {
  userId: string;
  productId: string;
}

export interface NudgeDispatchPayload {
  userId: string;
  productId: string;
  nudgeType: NudgeType;
  deviceToken: string;
  metadata: Record<string, any>;
}
