import { PriceMonitor } from './priceMonitor';

// Mock DB and NudgeEvaluator — we only test PriceMonitor logic
jest.mock('../../../../shared/db/client', () => ({
  db: {
    query: jest.fn(),
  },
}));

jest.mock('../nudge-evaluator/evaluator', () => ({
  NudgeEvaluator: {
    evaluate: jest.fn().mockResolvedValue(true),
  },
}));

import { db } from '../../../../shared/db/client';
import { NudgeEvaluator } from '../nudge-evaluator/evaluator';

const mockDb = db as jest.Mocked<typeof db>;
const mockEvaluator = NudgeEvaluator as jest.Mocked<typeof NudgeEvaluator>;

describe('PriceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PRICE_DROP_THRESHOLD_PERCENT = '5';
  });

  describe('isPriceZeroOrNegative', () => {
    it('returns true for price 0', () => {
      expect(PriceMonitor.isPriceZeroOrNegative(0)).toBe(true);
    });
    it('returns true for negative price', () => {
      expect(PriceMonitor.isPriceZeroOrNegative(-100)).toBe(true);
    });
    it('returns false for valid positive price', () => {
      expect(PriceMonitor.isPriceZeroOrNegative(1299)).toBe(false);
    });
    it('returns false for price of 1', () => {
      expect(PriceMonitor.isPriceZeroOrNegative(1)).toBe(false);
    });
  });

  describe('handlePriceChange', () => {
    it('does NOT call NudgeEvaluator if price drop is below threshold', async () => {
      // DB returns one wishlist item with price_at_add = 1000, newPrice = 975 (2.5% drop < 5%)
      mockDb.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)  // UPDATE products
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)  // INSERT price_history
        .mockResolvedValueOnce({ rows: [{ user_id: 'u1', price_at_add: 1000, device_token: 'tok', notif_price_drop: true }], rowCount: 1 } as any); // SELECT wishlist_items

      await PriceMonitor.handlePriceChange('prod1', 975);
      expect(mockEvaluator.evaluate).not.toHaveBeenCalled();
    });

    it('calls NudgeEvaluator when price drop meets threshold', async () => {
      const oldPrice = 1000;
      const newPrice = 900; // 10% drop > 5% threshold

      mockDb.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)  // UPDATE products
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)  // INSERT price_history
        .mockResolvedValueOnce({
          rows: [{ user_id: 'u1', price_at_add: oldPrice, device_token: 'tok', notif_price_drop: true }],
          rowCount: 1,
        } as any); // SELECT wishlist_items

      await PriceMonitor.handlePriceChange('prod1', newPrice);

      expect(mockEvaluator.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          productId: 'prod1',
          nudgeType: 'price_drop',
          metadata: expect.objectContaining({ dropPercent: 10 }),
        })
      );
    });

    it('skips out-of-order events when timestamp is older than DB updated_at', async () => {
      const oldTimestamp = new Date(Date.now() - 60000).toISOString(); // 1 min ago
      const dbUpdatedAt  = new Date().toISOString(); // now (newer)

      mockDb.query.mockResolvedValueOnce({
        rows: [{ updated_at: new Date(dbUpdatedAt) }], rowCount: 1,
      } as any);

      await PriceMonitor.handlePriceChange('prod1', 900, oldTimestamp);

      // Should check timestamp (1 call) and exit before updating or checking wishlist
      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(mockEvaluator.evaluate).not.toHaveBeenCalled();
    });

    it('fans out to multiple users who wishlisted the same product', async () => {
      const newPrice = 800;

      mockDb.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)  // UPDATE products
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)  // INSERT price_history
        .mockResolvedValueOnce({
          rows: [
            { user_id: 'u1', price_at_add: 1000, device_token: 'tok1', notif_price_drop: true },
            { user_id: 'u2', price_at_add: 1000, device_token: 'tok2', notif_price_drop: true },
          ],
          rowCount: 2,
        } as any); // SELECT wishlist_items

      await PriceMonitor.handlePriceChange('prod1', newPrice);
      expect(mockEvaluator.evaluate).toHaveBeenCalledTimes(2);
    });
  });
});
