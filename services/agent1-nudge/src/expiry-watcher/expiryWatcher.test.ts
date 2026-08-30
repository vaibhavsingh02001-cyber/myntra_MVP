import { ExpiryWatcher } from './expiryWatcher';

jest.mock('../../../../shared/db/client', () => ({
  db: { query: jest.fn() },
}));

jest.mock('../nudge-evaluator/evaluator', () => ({
  NudgeEvaluator: { evaluate: jest.fn().mockResolvedValue(true) },
}));

import { db } from '../../../../shared/db/client';
import { NudgeEvaluator } from '../nudge-evaluator/evaluator';

const mockDb = db as jest.Mocked<typeof db>;
const mockEvaluator = NudgeEvaluator as jest.Mocked<typeof NudgeEvaluator>;

describe('ExpiryWatcher.scan', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 0 when no expiring items found', async () => {
    (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const count = await ExpiryWatcher.scan();
    expect(count).toBe(0);
    expect(mockEvaluator.evaluate).not.toHaveBeenCalled();
  });

  it('fires expiry nudge for items aged 20–30 days', async () => {
    (mockDb.query as jest.Mock).mockResolvedValueOnce({
      rows: [{
        user_id: 'u1', product_id: 'p1', device_token: 'tok',
        days_in_wishlist: 22, stock_count: 20,
      }],
      rowCount: 1,
    });

    const count = await ExpiryWatcher.scan();
    expect(count).toBe(1);
    expect(mockEvaluator.evaluate).toHaveBeenCalledWith(
      expect.objectContaining({ nudgeType: 'expiry', userId: 'u1', productId: 'p1' })
    );
  });

  it('escalates to stock_alert for items with ≤5 stock units', async () => {
    (mockDb.query as jest.Mock).mockResolvedValueOnce({
      rows: [{
        user_id: 'u2', product_id: 'p2', device_token: 'tok',
        days_in_wishlist: 25, stock_count: 3,
      }],
      rowCount: 1,
    });

    await ExpiryWatcher.scan();
    expect(mockEvaluator.evaluate).toHaveBeenCalledWith(
      expect.objectContaining({ nudgeType: 'stock_alert', userId: 'u2' })
    );
  });

  it('processes multiple expiring items independently', async () => {
    (mockDb.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        { user_id: 'u1', product_id: 'p1', device_token: 't1', days_in_wishlist: 21, stock_count: 10 },
        { user_id: 'u2', product_id: 'p2', device_token: 't2', days_in_wishlist: 28, stock_count: 50 },
        { user_id: 'u3', product_id: 'p3', device_token: 't3', days_in_wishlist: 24, stock_count: 2 },
      ],
    });

    const count = await ExpiryWatcher.scan();
    expect(count).toBe(3);
    expect(mockEvaluator.evaluate).toHaveBeenCalledTimes(3);
  });
});
