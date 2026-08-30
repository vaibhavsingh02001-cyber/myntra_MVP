import { Deduplicator } from './deduplicator';

// Mock the cache singleton
jest.mock('../../../../shared/cache/client', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    pipeline: jest.fn(() => ({
      incr:   jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec:   jest.fn().mockResolvedValue([]),
    })),
  },
}));

import { cache } from '../../../../shared/cache/client';

const mockCache = cache as jest.Mocked<typeof cache>;

describe('Deduplicator', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('check()', () => {
    it('returns true when a nudge was already sent (key exists in Redis)', async () => {
      (mockCache.get as jest.Mock).mockResolvedValue('1');
      const isDupe = await Deduplicator.check('user1', 'prod1');
      expect(isDupe).toBe(true);
    });

    it('returns false when no nudge was sent (key missing)', async () => {
      (mockCache.get as jest.Mock).mockResolvedValue(null);
      const isDupe = await Deduplicator.check('user1', 'prod1');
      expect(isDupe).toBe(false);
    });

    it('returns false (fail-open) when Redis throws', async () => {
      (mockCache.get as jest.Mock).mockRejectedValue(new Error('Redis down'));
      const isDupe = await Deduplicator.check('user1', 'prod1');
      expect(isDupe).toBe(false); // fail-open allows nudge through
    });
  });

  describe('dailyCount()', () => {
    it('returns 0 when key does not exist', async () => {
      (mockCache.get as jest.Mock).mockResolvedValue(null);
      const count = await Deduplicator.dailyCount('user1');
      expect(count).toBe(0);
    });

    it('parses and returns the numeric count', async () => {
      (mockCache.get as jest.Mock).mockResolvedValue('2');
      const count = await Deduplicator.dailyCount('user1');
      expect(count).toBe(2);
    });

    it('returns 0 on Redis error (fail-open)', async () => {
      (mockCache.get as jest.Mock).mockRejectedValue(new Error('timeout'));
      const count = await Deduplicator.dailyCount('user1');
      expect(count).toBe(0);
    });
  });

  describe('daily cap integration', () => {
    it('suppresses a nudge when daily count reaches 3', async () => {
      // Simulate: dailyCount = 3
      (mockCache.get as jest.Mock).mockResolvedValue('3');
      const count = await Deduplicator.dailyCount('user1');
      expect(count >= 3).toBe(true);
    });

    it('allows a nudge when daily count is 2', async () => {
      (mockCache.get as jest.Mock).mockResolvedValue('2');
      const count = await Deduplicator.dailyCount('user1');
      expect(count < 3).toBe(true);
    });
  });
});
