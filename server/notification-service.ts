import { db } from "./db";
import { eq, and, lte } from "drizzle-orm";
import { notifications, profiles, users, type InsertNotification, type Notification } from "@shared/schema";
import twilio from "twilio";

type NotificationType = 
  | "APPLICATION_SUBMITTED"
  | "ADMIT_CARD_RELEASED"
  | "RESULT_DECLARED"
  | "REVALUATION_STATUS"
  | "PAYMENT_SUCCESS"
  | "OTP_VERIFICATION"
  | "REGISTRATION_SUCCESS"
  | "JOB_ALERT_NEW";

type NotificationChannel = "EMAIL" | "SMS" | "BOTH";

interface SendNotificationParams {
  userId?: string;
  candidateId?: number;
  email?: string;
  mobile?: string;
  type: NotificationType;
  channel?: NotificationChannel;
  subject?: string;
  message: string;
  referenceType?: string;
  referenceId?: number;
}

class NotificationService {
  private twilioClient: twilio.Twilio | null = null;

  constructor() {
    // Initialize Twilio client if credentials are available
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (accountSid && authToken) {
      this.twilioClient = twilio(accountSid, authToken);
      console.log("[NotificationService] Twilio SMS gateway initialized");
    } else {
      console.log("[NotificationService] Twilio credentials not found - SMS will use demo mode");
    }
  }

  private isSMSDemoMode(): boolean {
    return !this.twilioClient || !process.env.TWILIO_PHONE_NUMBER;
  }

  private isEmailDemoMode(): boolean {
    return !process.env.EMAIL_API_KEY;
  }

  private isDemoMode(): boolean {
    return this.isSMSDemoMode() && this.isEmailDemoMode();
  }

  async sendNotification(params: SendNotificationParams): Promise<Notification | null> {
    const {
      userId,
      candidateId,
      email,
      mobile,
      type,
      channel = "BOTH",
      subject,
      message,
      referenceType,
      referenceId,
    } = params;

    try {
      const [notification] = await db.insert(notifications).values({
        userId,
        candidateId,
        type,
        channel,
        subject,
        message,
        email,
        mobile,
        referenceType,
        referenceId,
        status: "PENDING",
      } as any).returning();

      if (this.isDemoMode()) {
        console.log(`[NOTIFICATION - DEMO MODE] Type: ${type}, Channel: ${channel}`);
        console.log(`  Email: ${email || "N/A"}, Mobile: ${mobile || "N/A"}`);
        console.log(`  Subject: ${subject || "N/A"}`);
        console.log(`  Message: ${message.substring(0, 100)}${message.length > 100 ? "..." : ""}`);
        
        await db.update(notifications)
          .set({ 
            status: "SENT", 
            sentAt: new Date(),
            gatewayResponse: { mode: "DEMO", loggedAt: new Date().toISOString() }
          } as any)
          .where(eq(notifications.id, notification.id));
          
        return notification;
      }

      if (channel === "EMAIL" || channel === "BOTH") {
        await this.sendEmail(notification.id, email!, subject!, message);
      }

      if (channel === "SMS" || channel === "BOTH") {
        await this.sendSMS(notification.id, mobile!, message);
      }

      return notification;
    } catch (error) {
      console.error("Failed to send notification:", error);
      return null;
    }
  }

  private async sendEmail(notificationId: number, email: string, subject: string, message: string): Promise<void> {
    try {
      console.log(`[EMAIL] Sending to ${email}: ${subject}`);
      await db.update(notifications)
        .set({ 
          status: "SENT", 
          sentAt: new Date(),
          gatewayResponse: { channel: "EMAIL", status: "simulated" }
        } as any)
        .where(eq(notifications.id, notificationId));
    } catch (error) {
      await db.update(notifications)
        .set({ 
          status: "FAILED", 
          failureReason: String(error),
          retryCount: 1
        } as any)
        .where(eq(notifications.id, notificationId));
    }
  }

  private async sendSMS(notificationId: number, mobile: string, message: string): Promise<void> {
    try {
      // Check if Twilio is available for real SMS
      if (this.twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        // Format mobile number - ensure it has country code
        let formattedMobile = mobile.trim();
        if (!formattedMobile.startsWith('+')) {
          // Assume India (+91) if no country code provided
          formattedMobile = formattedMobile.startsWith('91') 
            ? `+${formattedMobile}` 
            : `+91${formattedMobile}`;
        }

        console.log(`[SMS - TWILIO] Sending to ${formattedMobile}: ${message.substring(0, 50)}...`);
        
        const twilioMessage = await this.twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedMobile
        });

        console.log(`[SMS - TWILIO] Message SID: ${twilioMessage.sid}, Status: ${twilioMessage.status}`);
        
        await db.update(notifications)
          .set({ 
            status: "SENT", 
            sentAt: new Date(),
            gatewayResponse: { 
              channel: "SMS", 
              provider: "TWILIO",
              messageSid: twilioMessage.sid,
              status: twilioMessage.status,
              to: formattedMobile
            }
          } as any)
          .where(eq(notifications.id, notificationId));
      } else {
        // Demo mode - log to console
        console.log(`[SMS - DEMO] Sending to ${mobile}: ${message.substring(0, 50)}...`);
        await db.update(notifications)
          .set({ 
            status: "SENT", 
            sentAt: new Date(),
            gatewayResponse: { channel: "SMS", status: "demo_mode" }
          } as any)
          .where(eq(notifications.id, notificationId));
      }
    } catch (error: any) {
      console.error(`[SMS - ERROR] Failed to send to ${mobile}:`, error.message || error);
      await db.update(notifications)
        .set({ 
          status: "FAILED", 
          failureReason: error.message || String(error),
          retryCount: 1
        } as any)
        .where(eq(notifications.id, notificationId));
    }
  }

  async notifyApplicationSubmitted(profileId: number, examTitle: string, applicationNumber: string): Promise<void> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId));
    if (!profile) return;

    await this.sendNotification({
      candidateId: profileId,
      email: profile.email || undefined,
      mobile: profile.mobile,
      type: "APPLICATION_SUBMITTED",
      subject: `Application Submitted - ${examTitle}`,
      message: `Dear ${profile.fullName}, your application for ${examTitle} has been successfully submitted. Application Number: ${applicationNumber}. Keep this number safe for future reference.`,
      referenceType: "APPLICATION",
    });
  }

  async notifyAdmitCardReleased(profileId: number, examTitle: string, rollNumber: string): Promise<void> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId));
    if (!profile) return;

    await this.sendNotification({
      candidateId: profileId,
      email: profile.email || undefined,
      mobile: profile.mobile,
      type: "ADMIT_CARD_RELEASED",
      subject: `Admit Card Released - ${examTitle}`,
      message: `Dear ${profile.fullName}, your admit card for ${examTitle} is now available. Roll Number: ${rollNumber}. Please login to download your admit card.`,
      referenceType: "APPLICATION",
    });
  }

  async notifyResultDeclared(profileId: number, examTitle: string, rollNumber: string): Promise<void> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId));
    if (!profile) return;

    await this.sendNotification({
      candidateId: profileId,
      email: profile.email || undefined,
      mobile: profile.mobile,
      type: "RESULT_DECLARED",
      subject: `Result Declared - ${examTitle}`,
      message: `Dear ${profile.fullName}, results for ${examTitle} have been declared. Roll Number: ${rollNumber}. Login to view your result.`,
      referenceType: "RESULT",
    });
  }

  async notifyPaymentSuccess(profileId: number, amount: number, transactionId: string, description: string): Promise<void> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId));
    if (!profile) return;

    await this.sendNotification({
      candidateId: profileId,
      email: profile.email || undefined,
      mobile: profile.mobile,
      type: "PAYMENT_SUCCESS",
      subject: "Payment Successful",
      message: `Dear ${profile.fullName}, your payment of Rs. ${amount / 100} has been successfully processed. Transaction ID: ${transactionId}. ${description}`,
      referenceType: "PAYMENT",
    });
  }

  async notifyRevaluationStatus(profileId: number, examTitle: string, status: string, remarks?: string): Promise<void> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId));
    if (!profile) return;

    const statusMessages: Record<string, string> = {
      "PROCESSING": "Your revaluation request is being processed.",
      "COMPLETED": `Your revaluation has been completed. ${remarks || "Please login to view the updated result."}`,
      "REJECTED": `Your revaluation request has been rejected. ${remarks || "Please contact support for more information."}`,
    };

    await this.sendNotification({
      candidateId: profileId,
      email: profile.email || undefined,
      mobile: profile.mobile,
      type: "REVALUATION_STATUS",
      subject: `Revaluation Update - ${examTitle}`,
      message: `Dear ${profile.fullName}, update on your revaluation request for ${examTitle}: ${statusMessages[status] || status}`,
      referenceType: "REVALUATION",
    });
  }

  async sendOTP(target: string, otp: string, purpose: string, isEmail: boolean = false, examName?: string): Promise<void> {
    const examInfo = examName ? `${examName} ` : "";
    const message = `Your OTP for Examination Portal ${examInfo}${purpose} is: ${otp}. Valid for 10 minutes. Do not share this OTP with anyone. - Government Examination Portal`;
    
    await this.sendNotification({
      email: isEmail ? target : undefined,
      mobile: isEmail ? undefined : target,
      type: "OTP_VERIFICATION",
      channel: isEmail ? "EMAIL" : "SMS",
      subject: isEmail ? `OTP for ${purpose}` : undefined,
      message,
    });
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt);
  }

  async getCandidateNotifications(candidateId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.candidateId, candidateId))
      .orderBy(notifications.createdAt);
  }
}

export const notificationService = new NotificationService();
