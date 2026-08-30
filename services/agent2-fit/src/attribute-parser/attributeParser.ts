import { db } from '../../../../shared/db/client';
import { logger } from '../../../../shared/middleware/logger';
import { ProductAttributes } from '../../../../shared/models/product.types';

export class AttributeParser {
  /**
   * Reads structured attribute columns from a database product row.
   */
  static extract(productRow: any): ProductAttributes {
    const cut        = productRow.attr_cut        || undefined;
    const fabric     = productRow.attr_fabric     || undefined;
    const silhouette = productRow.attr_silhouette || undefined;
    const fitType    = productRow.attr_fit_type   || undefined;
    const length     = productRow.attr_length     || undefined;
    const source     = productRow.attr_source     || 'structured';

    return {
      cut,
      fabric,
      silhouette,
      fitType,
      length,
      source,
      isComplete: () => Boolean(silhouette || cut),
    };
  }

  /**
   * Persists extracted (e.g. LLM-generated) attributes back into the products table
   * so future scoring requests use fast DB reads rather than calling Gemini.
   */
  static async persist(productId: string, attrs: ProductAttributes): Promise<void> {
    try {
      await db.query(
        `UPDATE products
         SET attr_cut        = COALESCE($1, attr_cut),
             attr_fabric     = COALESCE($2, attr_fabric),
             attr_silhouette = COALESCE($3, attr_silhouette),
             attr_fit_type   = COALESCE($4, attr_fit_type),
             attr_length     = COALESCE($5, attr_length),
             attr_source     = $6,
             updated_at      = NOW()
         WHERE product_id = $7`,
        [
          attrs.cut ?? null,
          attrs.fabric ?? null,
          attrs.silhouette ?? null,
          attrs.fitType ?? null,
          attrs.length ?? null,
          attrs.source,
          productId,
        ]
      );
      logger.info({ productId, source: attrs.source }, '[AttributeParser] Attributes persisted');
    } catch (err) {
      logger.error({ err, productId }, '[AttributeParser] Failed to persist attributes');
    }
  }
}
