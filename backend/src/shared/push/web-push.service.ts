import * as webpush from 'web-push';
import { prisma } from '../database/prisma.client';
import { env } from '../../config/env';

export interface WebPushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    offsetMinutes?: number;
    timestamp?: number;
    [key: string]: any;
  };
}

export class WebPushService {
  constructor() {
    this.initVapid();
  }

  private initVapid() {
    if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        env.VAPID_SUBJECT,
        env.VAPID_PUBLIC_KEY,
        env.VAPID_PRIVATE_KEY
      );
    }
  }

  getPublicKey(): string {
    return env.VAPID_PUBLIC_KEY;
  }

  async saveSubscription(
    userId: number,
    data: { endpoint: string; p256dh: string; auth: string; userAgent?: string }
  ) {
    return prisma.pushSubscriptions.upsert({
      where: { endpoint: data.endpoint },
      create: {
        user_id: userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        user_agent: data.userAgent || null,
      },
      update: {
        user_id: userId,
        p256dh: data.p256dh,
        auth: data.auth,
        user_agent: data.userAgent || null,
        updated_at: new Date(),
      },
    });
  }

  async removeSubscription(userId: number, endpoint?: string) {
    if (endpoint) {
      await prisma.pushSubscriptions.deleteMany({
        where: { user_id: userId, endpoint },
      });
    } else {
      await prisma.pushSubscriptions.deleteMany({
        where: { user_id: userId },
      });
    }
  }

  async sendToSubscription(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: WebPushPayload
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      const stringifiedPayload = JSON.stringify(payload);
      const res = await webpush.sendNotification(pushSubscription, stringifiedPayload);
      return { success: true, statusCode: res.statusCode };
    } catch (err: any) {
      return {
        success: false,
        statusCode: err.statusCode,
        error: err.message,
      };
    }
  }

  async sendToUser(
    userId: number,
    payload: WebPushPayload
  ): Promise<{ sentCount: number; failedCount: number }> {
    const subs = await prisma.pushSubscriptions.findMany({
      where: { user_id: userId },
    });

    if (subs.length === 0) {
      return { sentCount: 0, failedCount: 0 };
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const sub of subs) {
      const result = await this.sendToSubscription(sub, payload);
      if (result.success) {
        sentCount++;
      } else {
        failedCount++;
        // Clean up expired / unsubscribed endpoints (HTTP 404 Not Found or 410 Gone)
        if (result.statusCode === 404 || result.statusCode === 410) {
          await prisma.pushSubscriptions.delete({
            where: { subscription_id: sub.subscription_id },
          }).catch(() => null);
        }
      }
    }

    return { sentCount, failedCount };
  }
}

export const webPushService = new WebPushService();
