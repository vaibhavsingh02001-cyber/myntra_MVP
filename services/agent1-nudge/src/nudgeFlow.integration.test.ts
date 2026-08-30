import { PriceMonitor } from './price-monitor/priceMonitor';

// Mock DB, Redis Deduplicator, and FCM
jest.mock('../../../shared/db/client', () => ({
  db: {
    query: jest.fn(),
  },
}));

jest.mock('./nudge-evaluator/deduplicator', () => ({
  Deduplicator: {
    check: jest.fn().mockResolvedValue(false),
    dailyCount: jest.fn().mockResolvedValue(0),
    markSent: jest.fn().mockResolvedValue(undefined),
    incrementDailyCount: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('./notification/fcmDispatcher', () => ({
  FCMDispatcher: {
    send: jest.fn().mockResolvedValue(true),
  },
}));

import { db } from '../../../shared/db/client';
import { FCMDispatcher } from './notification/fcmDispatcher';

const mockDb = db as jest.Mocked<typeof db>;
const mockFcm = FCMDispatcher as jest.Mocked<typeof FCMDispatcher>;

describe('Price Drop Nudge — Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PRICE_DROP_THRESHOLD_PERCENT = '5';
  });

  it('triggers price drop push notification when price drops ≥ 5%', async () => {
    const oldPrice = 2000;
    const newPrice = 1700; // 15% drop > 5% threshold
    const eventTimestamp = new Date().toISOString();

    // 0. Out-of-order timestamp check
    mockDb.query.mockResolvedValueOnce({
      rows: [{ updated_at: new Date(Date.now() - 60000) }],
      rowCount: 1,
    } as any);
    // 1. UPDATE products
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // 2. INSERT price_history
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // 3. SELECT wishlist items
    mockDb.query.mockResolvedValueOnce({
      rows: [
        {
          user_id: 'user-123',
          price_at_add: oldPrice,
          device_token: 'fcm-device-token-123',
          notif_price_drop: true,
        },
      ],
      rowCount: 1,
    } as any);

    // 4. Evaluator queries:
    // a. SELECT stock_count, title FROM products
    mockDb.query.mockResolvedValueOnce({
      rows: [{ stock_count: 10, title: 'Floral Dress' }],
      rowCount: 1,
    } as any);
    // b. INSERT INTO nudge_event_log
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // c. UPDATE wishlist_items
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await PriceMonitor.handlePriceChange('product-123', newPrice, eventTimestamp);

    expect(mockFcm.send).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        productId: 'product-123',
        nudgeType: 'price_drop',
        deviceToken: 'fcm-device-token-123',
      })
    );
  });
});
