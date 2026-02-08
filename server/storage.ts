import { db } from "./db";
import { eq, desc, and, gt } from "drizzle-orm";
import { 
  users, profiles, exams, applications, notices, siteSettings, answerKeys, examResults, admitCardTemplates, revaluationRequests, paymentTransactions, otpVerifications, certificates, companyCertificates,
  secureExamConfigs, examCenterLinks, secureExamSessions, jobAlerts,
  type User, type Profile, type Exam, type Application, type Notice, type SiteSetting,
  type AnswerKey, type ExamResult, type InsertAnswerKey, type InsertExamResult,
  type InsertExam, type InsertApplication, type InsertNotice,
  type UpdateProfileRequest, type AdmitCardTemplate, type InsertAdmitCardTemplate,
  type RevaluationRequest, type InsertRevaluationRequest,
  type PaymentTransaction, type InsertPaymentTransaction,
  type OtpVerification, type InsertOtpVerification,
  type Certificate, type InsertCertificate,
  type CompanyCertificate, type InsertCompanyCertificate,
  type SecureExamConfig, type InsertSecureExamConfig,
  type ExamCenterLink, type InsertExamCenterLink,
  type SecureExamSession, type InsertSecureExamSession,
  type JobAlert, type InsertJobAlert
} from "@shared/schema";

type CreateProfileInput = {
  userId: string;
  fullName: string;
  dob: string;
  gender: string;
  category: string;
  mobile: string;
  address: string;
  state: string;
  pincode: string;
  fatherName?: string | null;
  motherName?: string | null;
  email?: string | null;
  city?: string | null;
  district?: string | null;
  qualifications?: any;
  photoUrl?: string | null;
  signatureUrl?: string | null;
  isProfileComplete?: boolean | null;
};

export interface IStorage {
  // Site Settings
  getSetting(key: string): Promise<SiteSetting | undefined>;
  setSetting(key: string, value: any): Promise<SiteSetting>;
  getAllSettings(): Promise<SiteSetting[]>;
  
  // Exams
  getExams(): Promise<Exam[]>;
  getActiveExams(): Promise<Exam[]>;
  getExam(id: number): Promise<Exam | undefined>;
  createExam(exam: any): Promise<Exam>;
  updateExam(id: number, data: Partial<Exam>): Promise<Exam>;
  deleteExam(id: number): Promise<void>;
  
  // Notices
  getNotices(): Promise<Notice[]>;
  getActiveNotices(): Promise<Notice[]>;
  createNotice(notice: InsertNotice): Promise<Notice>;
  updateNotice(id: number, data: Partial<Notice>): Promise<Notice>;
  deleteNotice(id: number): Promise<void>;
  
  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: CreateProfileInput): Promise<Profile>;
  updateProfile(userId: string, profile: UpdateProfileRequest): Promise<Profile>;
  
  // Applications
  getApplications(userId: string): Promise<(Application & { exam: Exam })[]>;
  getAllApplications(): Promise<any[]>;
  getApplicationsByExam(examId: number): Promise<Application[]>;
  createApplication(app: any): Promise<Application>;
  getApplication(id: number): Promise<Application | undefined>;
  getApplicationByRollNumber(rollNumber: string): Promise<Application | undefined>;
  updateApplication(id: number, data: Partial<Application>): Promise<Application>;
  updateApplicationStatus(id: number, data: Partial<Application>): Promise<Application>;
  
  // Profiles
  getProfileById(profileId: number): Promise<Profile | undefined>;
  
  // Users (Admin)
  getAllUsers(): Promise<any[]>;
  
  // Answer Keys
  getAnswerKeys(): Promise<AnswerKey[]>;
  getAnswerKeysByExam(examId: number): Promise<AnswerKey[]>;
  getAnswerKey(id: number): Promise<AnswerKey | undefined>;
  createAnswerKey(data: InsertAnswerKey): Promise<AnswerKey>;
  updateAnswerKey(id: number, data: Partial<AnswerKey>): Promise<AnswerKey>;
  deleteAnswerKey(id: number): Promise<void>;
  
  // Exam Results
  getExamResults(examId: number): Promise<ExamResult[]>;
  getExamResultByRoll(examId: number, rollNumber: string): Promise<ExamResult | undefined>;
  getExamResultByApplication(applicationId: number): Promise<ExamResult | undefined>;
  createExamResult(data: InsertExamResult): Promise<ExamResult>;
  createBulkResults(results: InsertExamResult[]): Promise<ExamResult[]>;
  updateExamResult(id: number, data: Partial<ExamResult>): Promise<ExamResult>;
  deleteExamResult(id: number): Promise<void>;
  publishResults(examId: number): Promise<void>;
  getPublishedResults(examId: number): Promise<ExamResult[]>;
  
  // Admit Card Templates
  getAllAdmitCardTemplates(): Promise<AdmitCardTemplate[]>;
  getAdmitCardTemplates(examId: number): Promise<AdmitCardTemplate[]>;
  getAdmitCardTemplate(id: number): Promise<AdmitCardTemplate | undefined>;
  createAdmitCardTemplate(data: InsertAdmitCardTemplate): Promise<AdmitCardTemplate>;
  updateAdmitCardTemplate(id: number, data: Partial<AdmitCardTemplate>): Promise<AdmitCardTemplate>;
  deleteAdmitCardTemplate(id: number): Promise<void>;
  
  // Revaluation
  getCandidateResults(candidateId: number): Promise<ExamResult[]>;
  getExamResult(id: number): Promise<ExamResult | undefined>;
  getCandidateRevaluationRequests(candidateId: number): Promise<any[]>;
  getAllRevaluationRequests(): Promise<any[]>;
  createRevaluationRequest(data: any): Promise<any>;
  updateRevaluationRequest(id: number, data: any): Promise<any>;
  
  // Job Alerts
  getJobAlerts(): Promise<JobAlert[]>;
  getActiveJobAlerts(): Promise<JobAlert[]>;
  getJobAlert(id: number): Promise<JobAlert | undefined>;
  getJobAlertBySlug(slug: string): Promise<JobAlert | undefined>;
  createJobAlert(data: InsertJobAlert): Promise<JobAlert>;
  updateJobAlert(id: number, data: Partial<JobAlert>): Promise<JobAlert>;
  deleteJobAlert(id: number): Promise<void>;
  incrementJobAlertViews(id: number): Promise<void>;
  incrementJobAlertViewsBySlug(slug: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Site Settings
  async getSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting;
  }

  async setSetting(key: string, value: any): Promise<SiteSetting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [updated] = await db.update(siteSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(siteSettings.key, key))
        .returning();
      return updated;
    }
    const [newSetting] = await db.insert(siteSettings).values({ key, value }).returning();
    return newSetting;
  }

  async getAllSettings(): Promise<SiteSetting[]> {
    return await db.select().from(siteSettings);
  }

  // Exams
  async getExams(): Promise<Exam[]> {
    return await db.select().from(exams).orderBy(desc(exams.createdAt));
  }

  async getActiveExams(): Promise<Exam[]> {
    const allExams = await db.select().from(exams).where(eq(exams.isActive, true)).orderBy(desc(exams.createdAt));
    return allExams.filter(e => !e.isDraft);
  }

  async getExam(id: number): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async createExam(exam: any): Promise<Exam> {
    // Convert date strings to Date objects for timestamp columns
    const processedExam = { ...exam };
    const dateFields = [
      'applyStartDate', 'applyEndDate', 'feeLastDate', 'admitCardDate', 
      'examDate', 'answerKeyDate', 'resultDate', 'applicationStartDate', 'applicationEndDate'
    ];
    for (const field of dateFields) {
      if (processedExam[field] && typeof processedExam[field] === 'string') {
        processedExam[field] = new Date(processedExam[field]);
      }
    }
    // Map new field names to old column names for backward compatibility
    if (processedExam.applyStartDate && !processedExam.applicationStartDate) {
      processedExam.applicationStartDate = processedExam.applyStartDate;
    }
    if (processedExam.applyEndDate && !processedExam.applicationEndDate) {
      processedExam.applicationEndDate = processedExam.applyEndDate;
    }
    // Ensure required fields have defaults if not provided
    if (!processedExam.applicationStartDate) {
      processedExam.applicationStartDate = new Date();
    }
    if (!processedExam.applicationEndDate) {
      processedExam.applicationEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    }
    const [newExam] = await db.insert(exams).values(processedExam as any).returning();
    return newExam;
  }

  async updateExam(id: number, data: Partial<Exam>): Promise<Exam> {
    // Convert date strings to Date objects for timestamp columns
    const processedData: any = { ...data, updatedAt: new Date() };
    const dateFields = [
      'applyStartDate', 'applyEndDate', 'feeLastDate', 'admitCardDate', 
      'examDate', 'answerKeyDate', 'resultDate', 'applicationStartDate', 'applicationEndDate'
    ];
    for (const field of dateFields) {
      if (processedData[field] && typeof processedData[field] === 'string') {
        processedData[field] = new Date(processedData[field]);
      }
    }
    const [updated] = await db.update(exams).set(processedData).where(eq(exams.id, id)).returning();
    return updated;
  }

  async deleteExam(id: number): Promise<void> {
    await db.delete(exams).where(eq(exams.id, id));
  }

  // Notices
  async getNotices(): Promise<Notice[]> {
    return await db.select().from(notices).orderBy(desc(notices.publishedAt));
  }

  async getActiveNotices(): Promise<Notice[]> {
    return await db.select().from(notices).where(eq(notices.isActive, true)).orderBy(desc(notices.publishedAt));
  }

  async createNotice(notice: InsertNotice): Promise<Notice> {
    const [newNotice] = await db.insert(notices).values(notice as any).returning();
    return newNotice;
  }

  async updateNotice(id: number, data: Partial<Notice>): Promise<Notice> {
    const [updated] = await db.update(notices).set(data as any).where(eq(notices.id, id)).returning();
    return updated;
  }

  async deleteNotice(id: number): Promise<void> {
    await db.delete(notices).where(eq(notices.id, id));
  }

  // Profiles
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(profile: CreateProfileInput): Promise<Profile> {
    const regNumber = `REG${Date.now()}${Math.floor(Math.random() * 1000)}`;
    // Handle empty date strings - convert to null or default
    const processedProfile = { ...profile } as any;
    if (processedProfile.dob === '' || processedProfile.dob === null || processedProfile.dob === undefined) {
      // Set a default DOB if not provided (required field)
      processedProfile.dob = '1990-01-01';
    } else if (typeof processedProfile.dob === 'object' && processedProfile.dob.toISOString) {
      processedProfile.dob = processedProfile.dob.toISOString().split('T')[0];
    }
    const [newProfile] = await db.insert(profiles).values({
      ...processedProfile,
      registrationNumber: regNumber,
    } as any).returning();
    return newProfile;
  }

  async updateProfile(userId: string, update: UpdateProfileRequest): Promise<Profile> {
    const [updatedProfile] = await db
      .update(profiles)
      .set({ ...update, updatedAt: new Date() } as any)
      .where(eq(profiles.userId, userId))
      .returning();
    return updatedProfile;
  }

  // Applications
  async getApplications(userId: string): Promise<(Application & { exam: Exam })[]> {
    const profile = await this.getProfile(userId);
    if (!profile) return [];

    const rows = await db
      .select({
        application: applications,
        exam: exams,
      })
      .from(applications)
      .innerJoin(exams, eq(applications.examId, exams.id))
      .where(eq(applications.candidateId, profile.id))
      .orderBy(desc(applications.createdAt));
      
    return rows.map(row => ({ ...row.application, exam: row.exam }));
  }

  async getAllApplications(): Promise<any[]> {
    const rows = await db
      .select({
        application: applications,
        exam: exams,
        profile: profiles,
      })
      .from(applications)
      .innerJoin(exams, eq(applications.examId, exams.id))
      .innerJoin(profiles, eq(applications.candidateId, profiles.id))
      .orderBy(desc(applications.createdAt));
      
    return rows.map(row => ({
      ...row.application,
      exam: row.exam,
      candidate: row.profile,
    }));
  }

  async createApplication(app: any): Promise<Application> {
    const appNumber = `APP${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const [newApp] = await db.insert(applications).values({
      ...app,
      applicationNumber: appNumber,
    } as any).returning();
    return newApp;
  }

  async getApplication(id: number): Promise<Application | undefined> {
    const [app] = await db.select().from(applications).where(eq(applications.id, id));
    return app;
  }

  async getApplicationByRollNumber(rollNumber: string): Promise<Application | undefined> {
    const [app] = await db.select().from(applications).where(eq(applications.rollNumber, rollNumber));
    return app;
  }

  async updateApplicationStatus(id: number, data: Partial<Application>): Promise<Application> {
    const [updated] = await db.update(applications).set({ ...data, updatedAt: new Date() } as any).where(eq(applications.id, id)).returning();
    return updated;
  }

  async updateApplication(id: number, data: Partial<Application>): Promise<Application> {
    const [updated] = await db.update(applications).set({ ...data, updatedAt: new Date() } as any).where(eq(applications.id, id)).returning();
    return updated;
  }

  async getApplicationsByExam(examId: number): Promise<Application[]> {
    const rows = await db.select().from(applications).where(eq(applications.examId, examId));
    return rows;
  }

  async getProfileById(profileId: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId));
    return profile;
  }

  // Users (Admin)
  async getAllUsers(): Promise<any[]> {
    const usersList = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    return usersList;
  }

  // Answer Keys
  async getAnswerKeys(): Promise<AnswerKey[]> {
    return await db.select().from(answerKeys).orderBy(desc(answerKeys.createdAt));
  }

  async getAnswerKeysByExam(examId: number): Promise<AnswerKey[]> {
    return await db.select().from(answerKeys).where(eq(answerKeys.examId, examId)).orderBy(desc(answerKeys.createdAt));
  }

  async getAnswerKey(id: number): Promise<AnswerKey | undefined> {
    const [key] = await db.select().from(answerKeys).where(eq(answerKeys.id, id));
    return key;
  }

  async createAnswerKey(data: InsertAnswerKey): Promise<AnswerKey> {
    const [key] = await db.insert(answerKeys).values(data as any).returning();
    return key;
  }

  async updateAnswerKey(id: number, data: Partial<AnswerKey>): Promise<AnswerKey> {
    const [updated] = await db.update(answerKeys).set({ ...data, updatedAt: new Date() } as any).where(eq(answerKeys.id, id)).returning();
    return updated;
  }

  async deleteAnswerKey(id: number): Promise<void> {
    await db.delete(answerKeys).where(eq(answerKeys.id, id));
  }

  // Exam Results
  async getExamResults(examId: number): Promise<ExamResult[]> {
    return await db.select().from(examResults).where(eq(examResults.examId, examId)).orderBy(desc(examResults.createdAt));
  }

  async getExamResultByRoll(examId: number, rollNumber: string): Promise<ExamResult | undefined> {
    const [result] = await db.select().from(examResults).where(and(eq(examResults.examId, examId), eq(examResults.rollNumber, rollNumber)));
    return result;
  }

  async createExamResult(data: InsertExamResult): Promise<ExamResult> {
    const [result] = await db.insert(examResults).values(data as any).returning();
    return result;
  }

  async createBulkResults(results: InsertExamResult[]): Promise<ExamResult[]> {
    if (results.length === 0) return [];
    const inserted = await db.insert(examResults).values(results as any).returning();
    return inserted;
  }

  async updateExamResult(id: number, data: Partial<ExamResult>): Promise<ExamResult> {
    const [updated] = await db.update(examResults).set(data as any).where(eq(examResults.id, id)).returning();
    return updated;
  }

  async deleteExamResult(id: number): Promise<void> {
    await db.delete(examResults).where(eq(examResults.id, id));
  }

  async publishResults(examId: number): Promise<void> {
    await db.update(examResults).set({ isPublished: true, publishedAt: new Date() }).where(eq(examResults.examId, examId));
    await db.update(exams).set({ resultDeclared: true }).where(eq(exams.id, examId));
  }

  async getPublishedResults(examId: number): Promise<ExamResult[]> {
    return await db.select().from(examResults).where(and(eq(examResults.examId, examId), eq(examResults.isPublished, true))).orderBy(examResults.rank);
  }

  async getExamResultByApplication(applicationId: number): Promise<ExamResult | undefined> {
    const [result] = await db.select().from(examResults).where(eq(examResults.applicationId, applicationId));
    return result;
  }

  // Admit Card Templates
  async getAllAdmitCardTemplates(): Promise<AdmitCardTemplate[]> {
    return await db.select().from(admitCardTemplates).orderBy(desc(admitCardTemplates.createdAt));
  }

  async getAdmitCardTemplates(examId: number): Promise<AdmitCardTemplate[]> {
    return await db.select().from(admitCardTemplates).where(eq(admitCardTemplates.examId, examId)).orderBy(desc(admitCardTemplates.createdAt));
  }

  async getAdmitCardTemplate(id: number): Promise<AdmitCardTemplate | undefined> {
    const [template] = await db.select().from(admitCardTemplates).where(eq(admitCardTemplates.id, id));
    return template;
  }

  async createAdmitCardTemplate(data: InsertAdmitCardTemplate): Promise<AdmitCardTemplate> {
    const [template] = await db.insert(admitCardTemplates).values(data as any).returning();
    return template;
  }

  async updateAdmitCardTemplate(id: number, data: Partial<AdmitCardTemplate>): Promise<AdmitCardTemplate> {
    const [updated] = await db.update(admitCardTemplates).set({ ...data, updatedAt: new Date() } as any).where(eq(admitCardTemplates.id, id)).returning();
    return updated;
  }

  async deleteAdmitCardTemplate(id: number): Promise<void> {
    await db.delete(admitCardTemplates).where(eq(admitCardTemplates.id, id));
  }

  // Revaluation methods
  async getCandidateResults(candidateId: number): Promise<ExamResult[]> {
    // Get applications for this candidate first
    const candidateApps = await db.select().from(applications).where(eq(applications.candidateId, candidateId));
    const appIds = candidateApps.map(a => a.id);
    
    if (appIds.length === 0) return [];
    
    const results = await db.select().from(examResults);
    return results.filter(r => r.applicationId && appIds.includes(r.applicationId));
  }

  async getExamResult(id: number): Promise<ExamResult | undefined> {
    const [result] = await db.select().from(examResults).where(eq(examResults.id, id));
    return result;
  }

  async getCandidateRevaluationRequests(candidateId: number): Promise<RevaluationRequest[]> {
    return await db.select().from(revaluationRequests)
      .where(eq(revaluationRequests.candidateId, candidateId))
      .orderBy(desc(revaluationRequests.createdAt));
  }

  async getAllRevaluationRequests(): Promise<RevaluationRequest[]> {
    return await db.select().from(revaluationRequests)
      .orderBy(desc(revaluationRequests.createdAt));
  }

  async createRevaluationRequest(data: InsertRevaluationRequest): Promise<RevaluationRequest> {
    const [request] = await db.insert(revaluationRequests).values(data as any).returning();
    return request;
  }

  async updateRevaluationRequest(id: number, data: Partial<RevaluationRequest>): Promise<RevaluationRequest> {
    const [updated] = await db.update(revaluationRequests)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(revaluationRequests.id, id))
      .returning();
    return updated;
  }

  // Payment Transaction methods
  async createPaymentTransaction(data: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const [payment] = await db.insert(paymentTransactions).values(data as any).returning();
    return payment;
  }

  async getPaymentTransaction(id: number): Promise<PaymentTransaction | undefined> {
    const [payment] = await db.select().from(paymentTransactions).where(eq(paymentTransactions.id, id));
    return payment;
  }

  async getPaymentByTransactionId(transactionId: string): Promise<PaymentTransaction | undefined> {
    const [payment] = await db.select().from(paymentTransactions).where(eq(paymentTransactions.transactionId, transactionId));
    return payment;
  }

  async updatePaymentTransaction(id: number, data: Partial<PaymentTransaction>): Promise<PaymentTransaction> {
    const [updated] = await db.update(paymentTransactions)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(paymentTransactions.id, id))
      .returning();
    return updated;
  }

  async getCandidatePayments(candidateId: number): Promise<PaymentTransaction[]> {
    return await db.select().from(paymentTransactions)
      .where(eq(paymentTransactions.candidateId, candidateId))
      .orderBy(desc(paymentTransactions.createdAt));
  }

  async getAllPayments(): Promise<PaymentTransaction[]> {
    return await db.select().from(paymentTransactions)
      .orderBy(desc(paymentTransactions.createdAt));
  }

  // OTP Verification methods
  async createOtp(data: InsertOtpVerification): Promise<OtpVerification> {
    const [otp] = await db.insert(otpVerifications).values(data as any).returning();
    return otp;
  }

  async getValidOtp(target: string, purpose: string, isEmail: boolean = false): Promise<OtpVerification | undefined> {
    const field = isEmail ? otpVerifications.email : otpVerifications.mobile;
    const [otp] = await db.select().from(otpVerifications)
      .where(and(
        eq(field, target),
        eq(otpVerifications.purpose, purpose),
        eq(otpVerifications.isVerified, false),
        gt(otpVerifications.expiresAt, new Date())
      ))
      .orderBy(desc(otpVerifications.createdAt))
      .limit(1);
    return otp;
  }

  async verifyOtp(id: number): Promise<void> {
    await db.update(otpVerifications)
      .set({ isVerified: true } as any)
      .where(eq(otpVerifications.id, id));
  }

  async incrementOtpAttempts(id: number): Promise<void> {
    const [otp] = await db.select().from(otpVerifications).where(eq(otpVerifications.id, id));
    if (otp) {
      await db.update(otpVerifications)
        .set({ attempts: (otp.attempts || 0) + 1 } as any)
        .where(eq(otpVerifications.id, id));
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByMobile(mobile: string): Promise<User | undefined> {
    const allProfiles = await db.select().from(profiles).where(eq(profiles.mobile, mobile));
    if (allProfiles.length === 0) return undefined;
    const [user] = await db.select().from(users).where(eq(users.id, allProfiles[0].userId));
    return user;
  }

  // Certificate methods
  async createCertificate(data: InsertCertificate): Promise<Certificate> {
    const [certificate] = await db.insert(certificates).values(data as any).returning();
    return certificate;
  }

  async getCertificate(id: number): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(certificates).where(eq(certificates.id, id));
    return certificate;
  }

  async getCertificateByNumber(certificateNumber: string): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(certificates).where(eq(certificates.certificateNumber, certificateNumber));
    return certificate;
  }

  async getCandidateCertificates(candidateId: number): Promise<Certificate[]> {
    return await db.select().from(certificates)
      .where(eq(certificates.candidateId, candidateId))
      .orderBy(desc(certificates.createdAt));
  }

  async getExamCertificates(examId: number): Promise<Certificate[]> {
    return await db.select().from(certificates)
      .where(eq(certificates.examId, examId))
      .orderBy(desc(certificates.createdAt));
  }

  async getAllCertificates(): Promise<Certificate[]> {
    return await db.select().from(certificates).orderBy(desc(certificates.createdAt));
  }

  async updateCertificate(id: number, data: Partial<Certificate>): Promise<Certificate> {
    const [updated] = await db.update(certificates)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(certificates.id, id))
      .returning();
    return updated;
  }

  async generateCertificateNumber(examCode: string, type: string): Promise<string> {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    const typeCode = type.substring(0, 3).toUpperCase();
    return `${examCode}-${typeCode}-${year}-${random}`;
  }

  // Company Certificates (for tender verification)
  async createCompanyCertificate(data: InsertCompanyCertificate): Promise<CompanyCertificate> {
    const [cert] = await db.insert(companyCertificates).values(data as any).returning();
    return cert;
  }

  async getCompanyCertificates(): Promise<CompanyCertificate[]> {
    return await db.select().from(companyCertificates).orderBy(desc(companyCertificates.createdAt));
  }

  async getCompanyCertificate(id: number): Promise<CompanyCertificate | undefined> {
    const [cert] = await db.select().from(companyCertificates).where(eq(companyCertificates.id, id));
    return cert;
  }

  async getCompanyCertificateByNumber(certificateNumber: string): Promise<CompanyCertificate | undefined> {
    const [cert] = await db.select().from(companyCertificates).where(eq(companyCertificates.certificateNumber, certificateNumber));
    return cert;
  }

  async getCompanyCertificateByVerificationCode(code: string): Promise<CompanyCertificate | undefined> {
    const [cert] = await db.select().from(companyCertificates).where(eq(companyCertificates.verificationCode, code));
    return cert;
  }

  async updateCompanyCertificate(id: number, data: Partial<CompanyCertificate>): Promise<CompanyCertificate> {
    const [updated] = await db.update(companyCertificates)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(companyCertificates.id, id))
      .returning();
    return updated;
  }

  async deleteCompanyCertificate(id: number): Promise<void> {
    await db.delete(companyCertificates).where(eq(companyCertificates.id, id));
  }

  async generateCompanyCertificateNumber(type: string): Promise<string> {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    const typeCode = type.substring(0, 3).toUpperCase();
    return `SEPL/${typeCode}/${year}/${random}`;
  }

  async generateVerificationCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 16; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // ========== SECURE EXAM BROWSER METHODS ==========
  
  // Secure Exam Configs
  async getSecureExamConfig(examId: number): Promise<SecureExamConfig | undefined> {
    const [config] = await db.select().from(secureExamConfigs).where(eq(secureExamConfigs.examId, examId));
    return config;
  }

  async getAllSecureExamConfigs(): Promise<SecureExamConfig[]> {
    return await db.select().from(secureExamConfigs).orderBy(desc(secureExamConfigs.createdAt));
  }

  async createSecureExamConfig(data: InsertSecureExamConfig): Promise<SecureExamConfig> {
    const [config] = await db.insert(secureExamConfigs).values(data).returning();
    return config;
  }

  async updateSecureExamConfig(examId: number, data: Partial<SecureExamConfig>): Promise<SecureExamConfig> {
    const [updated] = await db.update(secureExamConfigs)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(secureExamConfigs.examId, examId))
      .returning();
    return updated;
  }

  async deleteSecureExamConfig(examId: number): Promise<void> {
    await db.delete(secureExamConfigs).where(eq(secureExamConfigs.examId, examId));
  }

  // Exam Center Links
  async getExamCenterLinks(examId: number): Promise<ExamCenterLink[]> {
    return await db.select().from(examCenterLinks).where(eq(examCenterLinks.examId, examId)).orderBy(examCenterLinks.centerCode);
  }

  async getAllExamCenterLinks(): Promise<ExamCenterLink[]> {
    return await db.select().from(examCenterLinks).orderBy(desc(examCenterLinks.createdAt));
  }

  async getExamCenterLink(id: number): Promise<ExamCenterLink | undefined> {
    const [link] = await db.select().from(examCenterLinks).where(eq(examCenterLinks.id, id));
    return link;
  }

  async getExamCenterLinkByToken(token: string): Promise<ExamCenterLink | undefined> {
    const [link] = await db.select().from(examCenterLinks).where(eq(examCenterLinks.accessToken, token));
    return link;
  }

  async createExamCenterLink(data: InsertExamCenterLink): Promise<ExamCenterLink> {
    const [link] = await db.insert(examCenterLinks).values(data).returning();
    return link;
  }

  async updateExamCenterLink(id: number, data: Partial<ExamCenterLink>): Promise<ExamCenterLink> {
    const [updated] = await db.update(examCenterLinks)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(examCenterLinks.id, id))
      .returning();
    return updated;
  }

  async deleteExamCenterLink(id: number): Promise<void> {
    await db.delete(examCenterLinks).where(eq(examCenterLinks.id, id));
  }

  async incrementCenterLinkUsage(id: number): Promise<void> {
    const link = await this.getExamCenterLink(id);
    if (link) {
      await db.update(examCenterLinks)
        .set({ usageCount: (link.usageCount || 0) + 1, updatedAt: new Date() })
        .where(eq(examCenterLinks.id, id));
    }
  }

  async generateCenterAccessToken(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = 'CTR-';
    for (let i = 0; i < 24; i++) {
      if (i > 0 && i % 6 === 0) token += '-';
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  // Secure Exam Sessions
  async getSecureExamSession(sessionToken: string): Promise<SecureExamSession | undefined> {
    const [session] = await db.select().from(secureExamSessions).where(eq(secureExamSessions.sessionToken, sessionToken));
    return session;
  }

  async getSecureExamSessionsByExam(examId: number): Promise<SecureExamSession[]> {
    return await db.select().from(secureExamSessions).where(eq(secureExamSessions.examId, examId)).orderBy(desc(secureExamSessions.createdAt));
  }

  async getSecureExamSessionsByApplication(applicationId: number): Promise<SecureExamSession[]> {
    return await db.select().from(secureExamSessions).where(eq(secureExamSessions.applicationId, applicationId)).orderBy(desc(secureExamSessions.createdAt));
  }

  async getActiveSecureExamSessions(examId: number): Promise<SecureExamSession[]> {
    return await db.select().from(secureExamSessions)
      .where(and(eq(secureExamSessions.examId, examId), eq(secureExamSessions.status, 'ACTIVE')))
      .orderBy(desc(secureExamSessions.startTime));
  }

  async createSecureExamSession(data: InsertSecureExamSession): Promise<SecureExamSession> {
    const [session] = await db.insert(secureExamSessions).values(data).returning();
    return session;
  }

  async updateSecureExamSession(sessionToken: string, data: Partial<SecureExamSession>): Promise<SecureExamSession> {
    const [updated] = await db.update(secureExamSessions)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(secureExamSessions.sessionToken, sessionToken))
      .returning();
    return updated;
  }

  async terminateSecureExamSession(sessionToken: string, reason: string, terminatedBy: string): Promise<SecureExamSession> {
    const [updated] = await db.update(secureExamSessions)
      .set({ 
        status: 'TERMINATED', 
        terminationReason: reason, 
        terminatedBy: terminatedBy,
        endTime: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(secureExamSessions.sessionToken, sessionToken))
      .returning();
    return updated;
  }

  async generateSessionToken(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = 'SES-';
    for (let i = 0; i < 32; i++) {
      if (i > 0 && i % 8 === 0) token += '-';
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  // Job Alerts Implementation
  async getJobAlerts(): Promise<JobAlert[]> {
    return await db.select().from(jobAlerts).orderBy(desc(jobAlerts.createdAt));
  }

  async getActiveJobAlerts(): Promise<JobAlert[]> {
    return await db.select().from(jobAlerts)
      .where(eq(jobAlerts.isActive, true))
      .orderBy(desc(jobAlerts.createdAt));
  }

  async getJobAlert(id: number): Promise<JobAlert | undefined> {
    const [alert] = await db.select().from(jobAlerts).where(eq(jobAlerts.id, id));
    return alert;
  }

  async getJobAlertBySlug(slug: string): Promise<JobAlert | undefined> {
    const [alert] = await db.select().from(jobAlerts).where(eq(jobAlerts.slug, slug));
    return alert;
  }

  async createJobAlert(data: InsertJobAlert): Promise<JobAlert> {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();
    const [alert] = await db.insert(jobAlerts).values({ ...data, slug }).returning();
    return alert;
  }

  async updateJobAlert(id: number, data: Partial<JobAlert>): Promise<JobAlert> {
    const [updated] = await db.update(jobAlerts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobAlerts.id, id))
      .returning();
    return updated;
  }

  async deleteJobAlert(id: number): Promise<void> {
    await db.delete(jobAlerts).where(eq(jobAlerts.id, id));
  }

  async incrementJobAlertViews(id: number): Promise<void> {
    const alert = await this.getJobAlert(id);
    if (alert) {
      await db.update(jobAlerts)
        .set({ viewCount: (alert.viewCount || 0) + 1 })
        .where(eq(jobAlerts.id, id));
    }
  }

  async incrementJobAlertViewsBySlug(slug: string): Promise<void> {
    const alert = await this.getJobAlertBySlug(slug);
    if (alert) {
      await db.update(jobAlerts)
        .set({ viewCount: (alert.viewCount || 0) + 1 })
        .where(eq(jobAlerts.slug, slug));
    }
  }
}

export const storage = new DatabaseStorage();
