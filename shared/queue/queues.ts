/**
 * All RabbitMQ queue name constants.
 * Both agents must reference this file — never hardcode queue names inline.
 */
export const QUEUES = {
  /** Agent 1: Dispatches a push notification nudge to a user */
  NUDGE_DISPATCH: 'nudge.dispatch',

  /** Agent 2: Triggers fit-score computation for a user × product */
  FIT_SCORE_COMPUTE: 'fit.score.compute',

  /** Agent 2: Triggers bulk re-score of all wishlist items after profile update */
  FIT_SCORE_BULK_RECOMPUTE: 'fit.score.bulk_recompute',

  /** Agent 1: Processes an incoming price-change event */
  PRICE_CHANGE: 'price.change',

  /** Shared: New wishlist-add event (fan-out to both agents) */
  WISHLIST_ADD: 'wishlist.add',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
