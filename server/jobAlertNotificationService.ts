import { db } from "./db";
import { jobAlertSubscribers, pushSubscriptions, jobAlerts } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { notificationService } from "./notification-service";
import crypto from "crypto";

export class JobAlertNotificationService {

  async subscribeEmail(data: {
    email: string;
    name?: string;
    categories?: string[];
    states?: string[];
    organizations?: string[];
  }) {
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const unsubscribeToken = crypto.randomBytes(32).toString("hex");

    try {
      const existing = await db
        .select()
        .from(jobAlertSubscribers)
        .where(eq(jobAlertSubscribers.email, data.email))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(jobAlertSubscribers)
          .set({
            name: data.name,
            categories: data.categories,
            states: data.states,
            organizations: data.organizations,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(jobAlertSubscribers.email, data.email));

        return { success: true, message: "Subscription updated successfully" };
      }

      await db.insert(jobAlertSubscribers).values({
        email: data.email,
        name: data.name,
        categories: data.categories,
        states: data.states,
        organizations: data.organizations,
        verificationToken,
        unsubscribeToken,
        isVerified: true,
      });

      console.log(`[JobAlertNotification] New email subscriber: ${data.email}`);
      return { success: true, message: "Subscribed successfully" };
    } catch (error: any) {
      console.error("[JobAlertNotification] Subscription error:", error);
      throw new Error("Failed to subscribe. Please try again.");
    }
  }

  async unsubscribeEmail(token: string) {
    try {
      const result = await db
        .update(jobAlertSubscribers)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(jobAlertSubscribers.unsubscribeToken, token));

      return { success: true, message: "Unsubscribed successfully" };
    } catch (error) {
      console.error("[JobAlertNotification] Unsubscribe error:", error);
      throw new Error("Failed to unsubscribe");
    }
  }

  async subscribePush(data: {
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string;
    categories?: string[];
  }) {
    try {
      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, data.endpoint))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(pushSubscriptions)
          .set({
            p256dh: data.p256dh,
            auth: data.auth,
            categories: data.categories,
            isActive: true,
          })
          .where(eq(pushSubscriptions.endpoint, data.endpoint));

        return { success: true, message: "Push subscription updated" };
      }

      await db.insert(pushSubscriptions).values({
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        userAgent: data.userAgent,
        categories: data.categories,
      });

      console.log("[JobAlertNotification] New push subscriber");
      return { success: true, message: "Push subscription created" };
    } catch (error) {
      console.error("[JobAlertNotification] Push subscription error:", error);
      throw new Error("Failed to subscribe to push notifications");
    }
  }

  async notifyNewJobAlert(jobAlertId: number) {
    try {
      const jobAlertResults = await db
        .select()
        .from(jobAlerts)
        .where(eq(jobAlerts.id, jobAlertId))
        .limit(1);

      if (jobAlertResults.length === 0) {
        console.error("[JobAlertNotification] Job alert not found:", jobAlertId);
        return;
      }

      const jobAlert = jobAlertResults[0];
      const category = jobAlert.category;

      const subscribers = await db
        .select()
        .from(jobAlertSubscribers)
        .where(
          and(
            eq(jobAlertSubscribers.isActive, true),
            eq(jobAlertSubscribers.isVerified, true)
          )
        );

      const matchingSubscribers = subscribers.filter((sub) => {
        if (!sub.categories || sub.categories.length === 0) return true;
        return sub.categories.includes(category);
      });

      console.log(
        `[JobAlertNotification] Sending notifications to ${matchingSubscribers.length} subscribers for job: ${jobAlert.title}`
      );

      for (const subscriber of matchingSubscribers) {
        const subject = `New ${category.replace("_", " ")}: ${jobAlert.title}`;
        const message = `
New Government Job Alert!

${jobAlert.title}
Organization: ${jobAlert.organization}
${jobAlert.postName ? `Post: ${jobAlert.postName}` : ""}
${jobAlert.totalVacancies ? `Vacancies: ${jobAlert.totalVacancies}` : ""}
${jobAlert.applicationEndDate ? `Last Date: ${jobAlert.applicationEndDate}` : ""}

Visit RojgarHub for more details: /job-alerts/${jobAlert.slug}

---
You received this because you subscribed to job alerts on RojgarHub.
        `.trim();

        try {
          await notificationService.sendNotification({
            type: "JOB_ALERT_NEW",
            channel: "EMAIL",
            subject,
            message,
            email: subscriber.email,
          });

          await db
            .update(jobAlertSubscribers)
            .set({
              emailsSent: (subscriber.emailsSent || 0) + 1,
              lastEmailSentAt: new Date(),
            })
            .where(eq(jobAlertSubscribers.id, subscriber.id));
        } catch (error) {
          console.error(
            `[JobAlertNotification] Failed to send to ${subscriber.email}:`,
            error
          );
        }
      }

      await this.sendPushNotifications(jobAlert);
    } catch (error) {
      console.error("[JobAlertNotification] Notify error:", error);
    }
  }

  private async sendPushNotifications(jobAlert: any) {
    const pushSubs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.isActive, true));

    const matchingSubs = pushSubs.filter((sub) => {
      if (!sub.categories || sub.categories.length === 0) return true;
      return sub.categories.includes(jobAlert.category);
    });

    console.log(
      `[JobAlertNotification] Sending ${matchingSubs.length} push notifications`
    );

    for (const sub of matchingSubs) {
      try {
        console.log(
          `[JobAlertNotification] Push notification queued for: ${sub.endpoint.substring(0, 50)}...`
        );
        
        await db
          .update(pushSubscriptions)
          .set({ lastPushAt: new Date() })
          .where(eq(pushSubscriptions.id, sub.id));
      } catch (error) {
        console.error("[JobAlertNotification] Push send error:", error);
        
        await db
          .update(pushSubscriptions)
          .set({ failureCount: (sub.failureCount || 0) + 1 })
          .where(eq(pushSubscriptions.id, sub.id));
      }
    }
  }

  async getSubscriberStats() {
    const emailCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobAlertSubscribers)
      .where(eq(jobAlertSubscribers.isActive, true));

    const pushCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.isActive, true));

    return {
      emailSubscribers: Number(emailCount[0]?.count || 0),
      pushSubscribers: Number(pushCount[0]?.count || 0),
    };
  }
}

export const jobAlertNotificationService = new JobAlertNotificationService();
