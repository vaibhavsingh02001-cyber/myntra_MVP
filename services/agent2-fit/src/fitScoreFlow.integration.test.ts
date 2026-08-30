import { FitOrchestrator } from './fit-orchestrator/orchestrator';

jest.mock('../../../shared/db/client', () => ({
  db: {
    query: jest.fn(),
  },
}));

jest.mock('./cache/fitScoreCache', () => ({
  FitScoreCache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  },
}));

import { db } from '../../../shared/db/client';

const mockDb = db as jest.Mocked<typeof db>;

describe('Fit Score Computation — Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('computes and stores fit match score end-to-end for a structured product', async () => {
    // 1. SELECT user profile
    mockDb.query.mockResolvedValueOnce({
      rows: [
        {
          body_height_range: "5'2\"-5'5\"",
          body_shape: 'pear',
          fit_preference: 'regular',
          comfort_priority: 'drape',
          body_profile_updated_at: new Date(),
        },
      ],
      rowCount: 1,
    } as any);

    // 2. SELECT product
    mockDb.query.mockResolvedValueOnce({
      rows: [
        {
          product_id: 'product-999',
          title: 'Floral Wrap Dress',
          attr_cut: 'wrap',
          attr_silhouette: 'a-line',
          attr_fit_type: 'regular',
          attr_fabric: 'chiffon',
          attr_source: 'structured',
        },
      ],
      rowCount: 1,
    } as any);

    // 3. UPDATE wishlist_items
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const result = await FitOrchestrator.getScore('user-111', 'product-999');

    expect(result).not.toBeNull();
    expect(result?.score).toBeGreaterThanOrEqual(80);
    expect(result?.band).toBe('great');
    expect(result?.rationale).toContain('pear body shapes');
  });
});
