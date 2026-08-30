// ── Product Attribute Types ──────────────────────────────────────────────────

export type AttributeSource = 'structured' | 'llm_extracted';

export type CutType =
  | 'wrap'
  | 'a-line'
  | 'straight'
  | 'tapered'
  | 'flared'
  | 'asymmetric'
  | 'pleated';

export type FabricType =
  | 'cotton'
  | 'chiffon'
  | 'denim'
  | 'polyester'
  | 'linen'
  | 'silk'
  | 'jersey'
  | 'wool';

export type SilhouetteType =
  | 'fitted'
  | 'relaxed'
  | 'oversized'
  | 'bodycon'
  | 'a-line';

export type FitType = 'slim' | 'regular' | 'plus' | 'petite';

export type LengthType = 'mini' | 'midi' | 'maxi' | 'crop' | 'full';

export interface ProductAttributes {
  cut?: CutType | string;
  fabric?: FabricType | string;
  silhouette?: SilhouetteType | string;
  fitType?: FitType | string;
  length?: LengthType | string;
  source: AttributeSource;
  /** Whether all key attributes (cut + silhouette) are present */
  isComplete: () => boolean;
}

// ── Product Types ────────────────────────────────────────────────────────────

export interface PriceHistoryEntry {
  price: number;
  recordedAt: Date;
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
  priceHistory?: PriceHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Request / Response DTOs ──────────────────────────────────────────────────

export interface PriceChangeEventDTO {
  productId: string;
  newPrice: number;
  eventTimestamp: string; // ISO 8601 — used for out-of-order rejection
}
