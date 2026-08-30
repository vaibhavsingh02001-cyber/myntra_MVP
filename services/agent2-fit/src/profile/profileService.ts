import { db } from '../../../../shared/db/client';
import { logger } from '../../../../shared/middleware/logger';
import { UserBodyProfile, CreateBodyProfileDTO } from '../../../../shared/models/user.types';
import { FitScoreCache } from '../cache/fitScoreCache';

export class ProfileService {
  /**
   * Fetch a user's body profile from the database.
   */
  static async getProfile(userId: string): Promise<UserBodyProfile | null> {
    const { rows } = await db.query(
      `SELECT body_height_range, body_shape, fit_preference, comfort_priority, body_profile_updated_at
       FROM users WHERE user_id = $1`,
      [userId]
    );

    if (!rows.length || !rows[0].body_shape) {
      return null;
    }

    const r = rows[0];
    return {
      heightRange:     r.body_height_range,
      bodyShape:       r.body_shape,
      fitPreference:   r.fit_preference,
      comfortPriority: r.comfort_priority,
      updatedAt:       r.body_profile_updated_at ?? new Date(),
    };
  }

  /**
   * Create or update a user's body profile.
   * Invalidates Redis score caches so next fetch recomputes scores with new profile.
   */
  static async saveProfile(dto: CreateBodyProfileDTO): Promise<UserBodyProfile> {
    const { userId, heightRange, bodyShape, fitPreference, comfortPriority } = dto;

    await db.query(
      `UPDATE users
       SET body_height_range       = $1,
           body_shape              = $2,
           fit_preference          = $3,
           comfort_priority        = $4,
           body_profile_updated_at = NOW(),
           updated_at              = NOW()
       WHERE user_id = $5`,
      [heightRange, bodyShape, fitPreference, comfortPriority, userId]
    );

    logger.info({ userId, bodyShape, fitPreference }, '[ProfileService] Body profile saved');

    // Invalidate cached scores since body parameters changed
    await FitScoreCache.invalidateUserScores(userId);

    return {
      heightRange,
      bodyShape,
      fitPreference,
      comfortPriority,
      updatedAt: new Date(),
    };
  }
}
