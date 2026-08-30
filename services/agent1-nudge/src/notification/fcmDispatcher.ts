import * as admin from 'firebase-admin';
import { logger } from '../../../../shared/middleware/logger';
import { NudgeTemplates, NotificationPayload } from './templates';
import { NudgeType } from '../../../../shared/models/wishlist.types';

// Initialise Firebase Admin SDK once (singleton guard)
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    logger.info('[FCM] Firebase Admin initialised');
  } else {
    // Dev fallback: log-only mode (no real FCM calls)
    logger.warn('[FCM] Firebase credentials missing — running in DRY RUN mode');
  }
}

export interface FCMPayload {
  userId: string;
  productId: string;
  nudgeType: NudgeType;
  deviceToken: string;
  metadata: Record<string, any>;
  productTitle?: string;
}

export class FCMDispatcher {
  /**
   * Sends a push notification via Firebase Cloud Messaging.
   * Handles stale/invalid tokens and falls back gracefully.
   *
   * @returns `true`  if sent successfully
   * @returns `false` if no valid token, or Firebase is in dry-run mode
   */
  static async send(payload: FCMPayload): Promise<boolean> {
    // Guard: no device token
    if (!payload.deviceToken) {
      logger.warn({ userId: payload.userId }, '[FCM] No device token — skipping push');
      return false;
    }

    const notification = FCMDispatcher.buildNotification(payload);

    // Dev / test: if Firebase not initialised, log and return
    if (!admin.apps.length || !admin.apps[0]) {
      logger.info(
        { userId: payload.userId, nudgeType: payload.nudgeType, notification },
        '[FCM] DRY RUN — would send push'
      );
      return true; // treat as success so dedup logic still runs
    }

    try {
      const message: admin.messaging.Message = {
        token: payload.deviceToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          nudgeType: payload.nudgeType,
          productId: payload.productId,
          userId: payload.userId,
          ...Object.fromEntries(
            Object.entries(payload.metadata).map(([k, v]) => [k, String(v)])
          ),
        },
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      };

      const messageId = await admin.messaging().send(message);
      logger.info(
        { messageId, userId: payload.userId, nudgeType: payload.nudgeType },
        '[FCM] Push sent successfully'
      );
      return true;
    } catch (err: any) {
      // Handle expired/invalid tokens — clear from DB
      if (
        err.code === 'messaging/registration-token-not-registered' ||
        err.code === 'messaging/invalid-registration-token'
      ) {
        logger.warn(
          { userId: payload.userId, code: err.code },
          '[FCM] Stale token detected — should clear from DB'
        );
        await FCMDispatcher.clearStaleToken(payload.userId);
      } else {
        logger.error({ err, userId: payload.userId }, '[FCM] Failed to send push');
      }
      return false;
    }
  }

  /**
   * Build the notification payload based on nudge type and metadata.
   */
  private static buildNotification(payload: FCMPayload): NotificationPayload {
    const title = payload.productTitle ?? 'Your wishlist item';
    switch (payload.nudgeType) {
      case 'price_drop':
        return NudgeTemplates.price_drop(
          title,
          Number(payload.metadata.oldPrice),
          Number(payload.metadata.newPrice)
        );
      case 'salary_day':
        return NudgeTemplates.salary_day(Number(payload.metadata.wishlistCount ?? 1));
      case 'expiry':
        return NudgeTemplates.expiry(title, Number(payload.metadata.daysInWishlist));
      case 'stock_alert':
        return NudgeTemplates.stock_alert(title, Number(payload.metadata.stockCount));
      default:
        return { title: '🛍️ Myntra', body: 'Check your wishlist!' };
    }
  }

  /**
   * Clears a stale FCM device token from the users table.
   */
  private static async clearStaleToken(userId: string): Promise<void> {
    try {
      const { db } = await import('../../../../shared/db/client');
      await db.query(
        `UPDATE users SET device_token = NULL WHERE user_id = $1`,
        [userId]
      );
      logger.info({ userId }, '[FCM] Stale token cleared');
    } catch (err) {
      logger.error({ err, userId }, '[FCM] Failed to clear stale token');
    }
  }
}
