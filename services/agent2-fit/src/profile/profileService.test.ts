import { ProfileService } from './profileService';

jest.mock('../../../../shared/db/client', () => ({
  db: { query: jest.fn() },
}));

jest.mock('../cache/fitScoreCache', () => ({
  FitScoreCache: { invalidateUserScores: jest.fn().mockResolvedValue(undefined) },
}));

import { db } from '../../../../shared/db/client';
import { FitScoreCache } from '../cache/fitScoreCache';

const mockDb = db as jest.Mocked<typeof db>;

describe('ProfileService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getProfile', () => {
    it('returns null if user does not exist or has no body profile', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const profile = await ProfileService.getProfile('u1');
      expect(profile).toBeNull();
    });

    it('returns mapped UserBodyProfile object when profile exists', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          body_height_range: "5'2\"-5'5\"",
          body_shape: 'pear',
          fit_preference: 'regular',
          comfort_priority: 'drape',
          body_profile_updated_at: new Date('2026-08-01'),
        }],
        rowCount: 1,
      });

      const profile = await ProfileService.getProfile('u1');
      expect(profile).not.toBeNull();
      expect(profile?.bodyShape).toBe('pear');
      expect(profile?.fitPreference).toBe('regular');
    });
  });

  describe('saveProfile', () => {
    it('updates DB and invalidates user score cache', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });

      const result = await ProfileService.saveProfile({
        userId: 'u1',
        heightRange: "5'5\"-5'8\"",
        bodyShape: 'hourglass',
        fitPreference: 'slim',
        comfortPriority: 'structure',
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        ["5'5\"-5'8\"", 'hourglass', 'slim', 'structure', 'u1']
      );
      expect(FitScoreCache.invalidateUserScores).toHaveBeenCalledWith('u1');
      expect(result.bodyShape).toBe('hourglass');
    });
  });
});
