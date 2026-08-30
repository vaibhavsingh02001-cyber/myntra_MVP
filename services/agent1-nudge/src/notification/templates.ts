/**
 * Notification message templates for all 4 nudge types.
 * Templates are pure functions — no side effects, fully testable.
 */

export interface NotificationPayload {
  title: string;
  body: string;
}

export const NudgeTemplates = {
  /**
   * Price has dropped since user added item to wishlist.
   * @param item    - Product title (truncated to 40 chars)
   * @param oldPrice - Price when user wishlisted the item
   * @param newPrice - Current discounted price
   */
  price_drop: (item: string, oldPrice: number, newPrice: number): NotificationPayload => ({
    title: '📉 Price Drop Alert!',
    body: `${truncate(item, 40)} just dropped from ₹${fmt(oldPrice)} to ₹${fmt(newPrice)} — grab it now!`,
  }),

  /**
   * User is in their salary pay window — prompt to review wishlist.
   * @param count - Number of wishlisted items
   */
  salary_day: (count: number): NotificationPayload => ({
    title: '💰 Payday treat time!',
    body: count === 1
      ? `Your wishlisted item is waiting for you. Treat yourself! 🛍️`
      : `${count} wishlisted items are waiting for you. Treat yourself! 🛍️`,
  }),

  /**
   * Item has been in wishlist for 20–30 days with no action.
   * @param item - Product title (truncated)
   * @param days - Number of days the item has been wishlisted
   */
  expiry: (item: string, days: number): NotificationPayload => ({
    title: "⏳ Don't lose this!",
    body: `${truncate(item, 40)} has been in your wishlist for ${days} day${days !== 1 ? 's' : ''} — still interested?`,
  }),

  /**
   * Product stock is critically low (≤ 5 units).
   * @param item  - Product title
   * @param stock - Remaining stock count
   */
  stock_alert: (item: string, stock: number): NotificationPayload => ({
    title: '🔥 Almost gone!',
    body: `Only ${stock} left! ${truncate(item, 35)} from your wishlist is almost gone.`,
  }),
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Format a price number as Indian currency string. */
function fmt(price: number): string {
  return price.toLocaleString('en-IN');
}

/** Truncate a string to a max length with ellipsis. */
function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? `${str.slice(0, maxLen - 1)}…` : str;
}

export type NudgeTemplateKey = keyof typeof NudgeTemplates;
