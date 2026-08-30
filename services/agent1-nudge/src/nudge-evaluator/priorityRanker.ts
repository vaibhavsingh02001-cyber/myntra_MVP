import { NudgeType } from '../../../../shared/models/wishlist.types';

/**
 * Priority ranking for nudge types.
 * When multiple nudge types qualify simultaneously for the same
 * user × product, only the highest-priority one is dispatched.
 *
 * Order (highest → lowest): price_drop > stock_alert > expiry > salary_day
 */
const PRIORITY_MAP: Record<NudgeType, number> = {
  price_drop:  4,
  stock_alert: 3,
  expiry:      2,
  salary_day:  1,
};

export class PriorityRanker {
  /**
   * Returns the nudge type with the highest priority from a list.
   * Used to resolve conflicts when multiple triggers fire at once.
   */
  static highest(nudgeTypes: NudgeType[]): NudgeType {
    if (nudgeTypes.length === 0) {
      throw new Error('[PriorityRanker] Cannot rank an empty nudge list');
    }
    return nudgeTypes.reduce((best, current) =>
      PRIORITY_MAP[current] > PRIORITY_MAP[best] ? current : best
    );
  }

  /**
   * Returns the numeric priority for a nudge type.
   * Higher is more urgent.
   */
  static priorityOf(nudgeType: NudgeType): number {
    return PRIORITY_MAP[nudgeType];
  }

  /**
   * Sort nudge types from highest to lowest priority.
   */
  static sort(nudgeTypes: NudgeType[]): NudgeType[] {
    return [...nudgeTypes].sort((a, b) => PRIORITY_MAP[b] - PRIORITY_MAP[a]);
  }
}
