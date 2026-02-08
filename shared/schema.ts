import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, varchar, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export * from "./models/auth";
import { users } from "./models/auth";

// === TABLE DEFINITIONS ===

// Site Settings (Admin-controlled main page content)
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").$type<any>(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Profile (Candidate Details) - One-to-One with User
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  registrationNumber: text("registration_number").notNull().unique(),
  fullName: text("full_name").notNull(),
  fatherName: text("father_name"),
  motherName: text("mother_name"),
  dob: date("dob").notNull(),
  gender: text("gender").notNull(),
  category: text("category").notNull(),
  mobile: text("mobile").notNull(),
  email: text("email"),
  alternateEmail: text("alternate_email"),
  alternateMobile: text("alternate_mobile"),
  address: text("address").notNull(),
  permanentAddress: text("permanent_address"),
  city: text("city"),
  district: text("district"),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  nationality: text("nationality").default("Indian"),
  religion: text("religion"),
  maritalStatus: text("marital_status"),
  identificationMark1: text("identification_mark_1"),
  identificationMark2: text("identification_mark_2"),
  isPwd: boolean("is_pwd").default(false),
  pwdType: text("pwd_type"),
  pwdPercentage: text("pwd_percentage"),
  isExServiceman: boolean("is_ex_serviceman").default(false),
  qualifications: jsonb("qualifications").$type<{
    tenth?: { 
      board: string; 
      year: string; 
      totalMarks: string; 
      obtainedMarks: string; 
      percentage: string; 
      rollNo?: string; 
      schoolName?: string;
      medium?: string;
    };
    twelfth?: { 
      board: string; 
      year: string; 
      totalMarks: string; 
      obtainedMarks: string; 
      percentage: string; 
      rollNo?: string; 
      schoolName?: string; 
      stream?: string;
      subjects?: string;
      medium?: string;
    };
    graduation?: { 
      degree: string; 
      university: string; 
      year: string; 
      totalMarks: string;
      obtainedMarks: string;
      percentage: string; 
      cgpa?: string;
      college?: string; 
      subject?: string;
      isAppearing?: boolean;
    };
    postGraduation?: { 
      degree: string; 
      university: string; 
      year: string; 
      totalMarks: string;
      obtainedMarks: string;
      percentage: string;
      cgpa?: string;
      college?: string;
      subject?: string;
      isAppearing?: boolean;
    };
    diploma?: {
      name: string;
      institution: string;
      year: string;
      totalMarks: string;
      obtainedMarks: string;
      percentage: string;
      duration?: string;
    };
    professional?: {
      qualification: string;
      institution: string;
      year: string;
      percentage: string;
      specialization?: string;
    };
    other?: { qualification: string; institution: string; year: string; percentage: string }[];
  }>(),
  photoUrl: text("photo_url"),
  signatureUrl: text("signature_url"),
  idProofType: text("id_proof_type"),
  idProofNumber: text("id_proof_number"),
  idProofUrl: text("id_proof_url"),
  isProfileComplete: boolean("is_profile_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exams (Admin Managed) - Comprehensive with 8 sections
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  
  // Section 1: Basic Exam Info
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  conductingBody: text("conducting_body").notNull(), // SSC, RRB, Custom
  postName: text("post_name"),
  totalVacancies: integer("total_vacancies").default(0),
  advertisementNumber: text("advertisement_number"),
  notificationPdfUrl: text("notification_pdf_url"),
  
  // Multi-Post Support (SSC-style multiple posts in one exam)
  posts: jsonb("posts").$type<{
    id: string;
    postCode: string;
    postName: string;
    numberOfPosts: number;
    payScale?: string;
    gradePayLevel?: string;
    minimumQualification?: string;
    ageLimit?: { min: number; max: number };
    fees?: {
      general?: number;
      obc?: number;
      sc?: number;
      st?: number;
      female?: number;
      pwd?: number;
      exServiceman?: number;
      ews?: number;
    };
    notificationPdfUrl?: string;
    vacancyBreakdown?: {
      general?: number;
      obc?: number;
      sc?: number;
      st?: number;
      ews?: number;
      pwd?: number;
    };
  }[]>(),
  
  // Section 2: Important Dates
  applyStartDate: timestamp("apply_start_date").notNull(),
  applyEndDate: timestamp("apply_end_date").notNull(),
  feeLastDate: timestamp("fee_last_date"),
  admitCardDate: timestamp("admit_card_date"),
  examDate: timestamp("exam_date"),
  resultDate: timestamp("result_date"),
  correctionWindowStart: timestamp("correction_window_start"),
  correctionWindowEnd: timestamp("correction_window_end"),
  
  // Section 3: Eligibility
  minAge: integer("min_age").default(18),
  maxAge: integer("max_age").default(35),
  ageRelaxation: jsonb("age_relaxation").$type<{
    sc?: number;
    st?: number;
    obc?: number;
    pwd?: number;
    exServiceman?: number;
    female?: number;
  }>(),
  educationRequired: text("education_required"),
  experienceRequired: text("experience_required"),
  eligibilityNotes: text("eligibility_notes"),
  
  // Section 4: Fees (Category Wise)
  fees: jsonb("fees").$type<{
    general?: number;
    obc?: number;
    sc?: number;
    st?: number;
    female?: number;
    pwd?: number;
    exServiceman?: number;
    ews?: number;
  }>(),
  
  // Section 5: Documents Required
  documentsRequired: jsonb("documents_required").$type<{
    photo?: { required: boolean; maxSize?: string; dimensions?: string };
    signature?: { required: boolean; maxSize?: string; dimensions?: string };
    idProof?: { required: boolean; acceptedTypes?: string[] };
    casteCertificate?: { required: boolean; categories?: string[] };
    educationCertificate?: { required: boolean; types?: string[] };
    domicileCertificate?: { required: boolean };
    incomeCertificate?: { required: boolean };
    pwdCertificate?: { required: boolean };
    exServicemanCertificate?: { required: boolean };
    nocCertificate?: { required: boolean };
    other?: { name: string; required: boolean }[];
  }>(),
  
  // Section 6: Payment System
  paymentMode: text("payment_mode").default("FREE"), // FREE, ONLINE, DD, BOTH
  razorpayEnabled: boolean("razorpay_enabled").default(false),
  razorpayKeyId: text("razorpay_key_id"),
  razorpayKeySecret: text("razorpay_key_secret"),
  paymentMethods: jsonb("payment_methods").$type<{
    upi?: boolean;
    card?: boolean;
    netbanking?: boolean;
    wallet?: boolean;
    emi?: boolean;
    challan?: boolean;
  }>(),
  ddDetails: jsonb("dd_details").$type<{
    payableTo?: string;
    bankName?: string;
    branchAddress?: string;
    sendToAddress?: string;
  }>(),
  
  // Section 7: Exam Centers
  examCenters: jsonb("exam_centers").$type<{
    cities?: { code: string; name: string; state: string }[];
    allowCityChange?: boolean;
    cityChangeLastDate?: string;
    girlOnlyCenter?: boolean;
    manualAllocation?: boolean;
    centerAllocationMode?: string;
  }>(),
  
  // Section 8: Instructions
  examInstructions: text("exam_instructions"),
  uploadInstructions: text("upload_instructions"),
  refundPolicy: text("refund_policy"),
  generalInstructions: text("general_instructions"),
  importantLinks: jsonb("important_links").$type<{ title: string; url: string }[]>(),
  
  // Category-wise Cutoffs (for result display)
  cutoffs: jsonb("cutoffs").$type<{
    general?: number;
    obc?: number;
    sc?: number;
    st?: number;
    ews?: number;
    pwd?: number;
    female?: number;
    exServiceman?: number;
  }>(),
  resultDeclared: boolean("result_declared").default(false),
  
  // Subdomain configuration (e.g., "RRB" for RRB.examinationportal.com)
  subdomain: text("subdomain"),
  
  // Status flags
  isActive: boolean("is_active").default(true),
  isDraft: boolean("is_draft").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Applications (Candidate applies for Exam)
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  applicationNumber: text("application_number").unique(),
  candidateId: integer("candidate_id").notNull().references(() => profiles.id),
  examId: integer("exam_id").notNull().references(() => exams.id),
  
  // Application specific data
  preferredCenters: jsonb("preferred_centers").$type<string[]>(),
  allocatedCenter: text("allocated_center"),
  
  // Form data (may differ from profile)
  formData: jsonb("form_data").$type<{
    personalDetails?: any;
    educationDetails?: any;
    preferences?: any;
    declarations?: boolean;
  }>(),
  
  // Documents uploaded for this application
  documents: jsonb("documents").$type<{
    photo?: string;
    signature?: string;
    idProof?: string;
    casteCertificate?: string;
    educationCertificate?: string;
    other?: { name: string; url: string }[];
  }>(),
  
  // Payment details
  paymentStatus: text("payment_status").default("PENDING"),
  paymentMethod: text("payment_method"),
  paymentAmount: integer("payment_amount"),
  paymentId: text("payment_id"),
  paymentDate: timestamp("payment_date"),
  ddNumber: text("dd_number"),
  ddDate: date("dd_date"),
  ddBankName: text("dd_bank_name"),
  
  // Status
  status: text("status").default("DRAFT"),
  rollNumber: text("roll_number").unique(),
  admitCardGenerated: boolean("admit_card_generated").default(false),
  
  // Timestamps
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notices (Public Announcements)
export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  type: text("type").notNull(),
  linkUrl: text("link_url"),
  pdfUrl: text("pdf_url"),
  examId: integer("exam_id"),
  isNew: boolean("is_new").default(true),
  isActive: boolean("is_active").default(true),
  publishedAt: timestamp("published_at").defaultNow(),
});

// Answer Keys (Admin uploads for exams)
export const answerKeys = pgTable("answer_keys", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  title: text("title").notNull(),
  description: text("description"),
  pdfUrl: text("pdf_url"),
  keyData: jsonb("key_data").$type<{
    paperCode?: string;
    shift?: string;
    date?: string;
    answers?: { questionNo: number; answer: string; marks?: number }[];
  }>(),
  status: text("status").default("DRAFT"), // DRAFT, PROVISIONAL, FINAL
  objectionWindowStart: timestamp("objection_window_start"),
  objectionWindowEnd: timestamp("objection_window_end"),
  objectionFee: integer("objection_fee"),
  isActive: boolean("is_active").default(true),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admit Card Templates (Admin uploads template for exams)
export const admitCardTemplates = pgTable("admit_card_templates", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  templateName: text("template_name").notNull(),
  templateHtml: text("template_html"), // HTML template with placeholders
  headerLogoUrl: text("header_logo_url"),
  footerText: text("footer_text"),
  examVenue: text("exam_venue"),
  reportingTime: text("reporting_time"),
  examDuration: text("exam_duration"),
  instructions: text("instructions"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exam Results (Individual candidate results)
export const examResults = pgTable("exam_results", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  applicationId: integer("application_id").references(() => applications.id),
  rollNumber: text("roll_number").notNull(),
  candidateName: text("candidate_name"),
  fatherName: text("father_name"),
  category: text("category"),
  
  // Marks breakdown
  marks: jsonb("marks").$type<{
    section1?: { name: string; obtained: number; total: number };
    section2?: { name: string; obtained: number; total: number };
    section3?: { name: string; obtained: number; total: number };
    section4?: { name: string; obtained: number; total: number };
    totalObtained?: number;
    totalMarks?: number;
    normalizedScore?: number;
  }>(),
  totalMarks: integer("total_marks"),
  obtainedMarks: integer("obtained_marks"),
  percentage: text("percentage"),
  rank: integer("rank"),
  
  // Result status
  status: text("status").default("PENDING"), // PENDING, QUALIFIED, NOT_QUALIFIED, ABSENT, DISQUALIFIED
  remarks: text("remarks"),
  
  // Tier/Stage specific
  stage: text("stage").default("TIER1"), // TIER1, TIER2, TIER3, FINAL
  
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment Transactions (For fee collection)
export const paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id),
  candidateId: integer("candidate_id").references(() => profiles.id),
  examId: integer("exam_id").references(() => exams.id),
  testSeriesId: integer("test_series_id").references(() => testSeries.id),
  
  // Payment details
  transactionId: text("transaction_id").unique(),
  orderId: text("order_id"),
  paymentGateway: text("payment_gateway"), // STRIPE, RAZORPAY, PAYTM
  amount: integer("amount").notNull(), // Amount in paise/cents
  currency: text("currency").default("INR"),
  
  // Status
  status: text("status").default("PENDING"), // PENDING, SUCCESS, FAILED, REFUNDED
  paymentMethod: text("payment_method"), // CARD, UPI, NETBANKING, WALLET
  
  // Gateway response
  gatewayResponse: jsonb("gateway_response"),
  
  // Timestamps
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Revaluation Requests
export const revaluationRequests = pgTable("revaluation_requests", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id),
  resultId: integer("result_id").references(() => examResults.id),
  candidateId: integer("candidate_id").references(() => profiles.id),
  examId: integer("exam_id").references(() => exams.id),
  
  // Request details
  requestNumber: text("request_number").unique(),
  subjects: jsonb("subjects").$type<string[]>(), // Subjects for revaluation
  reason: text("reason"),
  
  // Fee
  feeAmount: integer("fee_amount"),
  paymentId: integer("payment_id").references(() => paymentTransactions.id),
  isPaid: boolean("is_paid").default(false),
  
  // Status tracking
  status: text("status").default("PENDING"), // PENDING, PROCESSING, COMPLETED, REJECTED
  
  // Result after revaluation
  previousMarks: integer("previous_marks"),
  revisedMarks: integer("revised_marks"),
  marksChanged: boolean("marks_changed").default(false),
  
  // Admin processing
  processedBy: integer("processed_by"),
  processedAt: timestamp("processed_at"),
  remarks: text("remarks"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Certificates (Provisional, Migration, Mark Sheets)
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id),
  candidateId: integer("candidate_id").references(() => profiles.id),
  examId: integer("exam_id").references(() => exams.id),
  
  // Certificate details
  certificateNumber: text("certificate_number").unique(),
  certificateType: text("certificate_type").notNull(), // PROVISIONAL, MARKSHEET, MIGRATION, DEGREE, TRANSCRIPT
  
  // Status
  status: text("status").default("PENDING"), // PENDING, GENERATED, ISSUED, REVOKED
  
  // Issue details
  issuedAt: timestamp("issued_at"),
  issuedBy: integer("issued_by"),
  validUntil: timestamp("valid_until"),
  
  // PDF/Document
  documentUrl: text("document_url"),
  qrCode: text("qr_code"), // For verification
  
  // Metadata
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OTP Verification (For authentication)
export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  email: text("email"),
  mobile: text("mobile"),
  otp: text("otp").notNull(),
  purpose: text("purpose").notNull(), // LOGIN, REGISTRATION, PASSWORD_RESET, VERIFICATION
  isVerified: boolean("is_verified").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications (SMS/Email alerts)
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  candidateId: integer("candidate_id").references(() => profiles.id),
  
  // Notification type and channel
  type: text("type").notNull(), // APPLICATION_SUBMITTED, ADMIT_CARD_RELEASED, RESULT_DECLARED, REVALUATION_STATUS, PAYMENT_SUCCESS
  channel: text("channel").notNull(), // EMAIL, SMS, BOTH
  
  // Content
  subject: text("subject"),
  message: text("message").notNull(),
  
  // Recipient info
  email: text("email"),
  mobile: text("mobile"),
  
  // Status
  status: text("status").default("PENDING"), // PENDING, SENT, FAILED, DELIVERED
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  failureReason: text("failure_reason"),
  
  // Retry handling
  retryCount: integer("retry_count").default(0),
  nextRetryAt: timestamp("next_retry_at"),
  
  // Gateway response
  gatewayResponse: jsonb("gateway_response"),
  
  // Reference
  referenceType: text("reference_type"), // APPLICATION, EXAM, RESULT, REVALUATION, PAYMENT
  referenceId: integer("reference_id"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  applications: many(applications),
}));

export const examsRelations = relations(exams, ({ many }) => ({
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  profile: one(profiles, {
    fields: [applications.candidateId],
    references: [profiles.id],
  }),
  exam: one(exams, {
    fields: [applications.examId],
    references: [exams.id],
  }),
}));

// === INSERT SCHEMAS ===
export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({ 
  id: true, 
  updatedAt: true 
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ 
  id: true, 
  userId: true, 
  registrationNumber: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertExamSchema = createInsertSchema(exams).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

export const insertApplicationSchema = createInsertSchema(applications).omit({ 
  id: true, 
  applicationNumber: true,
  candidateId: true, 
  status: true, 
  rollNumber: true, 
  submittedAt: true, 
  createdAt: true,
  updatedAt: true 
});

export const insertNoticeSchema = createInsertSchema(notices).omit({ 
  id: true, 
  publishedAt: true 
});

export const insertAnswerKeySchema = createInsertSchema(answerKeys).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

export const insertExamResultSchema = createInsertSchema(examResults).omit({ 
  id: true, 
  createdAt: true 
});

export const insertAdmitCardTemplateSchema = createInsertSchema(admitCardTemplates).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

export const insertRevaluationRequestSchema = createInsertSchema(revaluationRequests).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

export const insertOtpVerificationSchema = createInsertSchema(otpVerifications).omit({ 
  id: true, 
  createdAt: true 
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ 
  id: true, 
  createdAt: true 
});

// === TYPES ===
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Notice = typeof notices.$inferSelect;
export type InsertNotice = z.infer<typeof insertNoticeSchema>;
export type AnswerKey = typeof answerKeys.$inferSelect;
export type InsertAnswerKey = z.infer<typeof insertAnswerKeySchema>;
export type ExamResult = typeof examResults.$inferSelect;
export type InsertExamResult = z.infer<typeof insertExamResultSchema>;
export type AdmitCardTemplate = typeof admitCardTemplates.$inferSelect;
export type InsertAdmitCardTemplate = z.infer<typeof insertAdmitCardTemplateSchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type RevaluationRequest = typeof revaluationRequests.$inferSelect;
export type InsertRevaluationRequest = z.infer<typeof insertRevaluationRequestSchema>;
export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Company Certificates (for tender verification)
export const companyCertificates = pgTable("company_certificates", {
  id: serial("id").primaryKey(),
  certificateNumber: text("certificate_number").notNull().unique(),
  certificateType: text("certificate_type").notNull(), // INFRASTRUCTURE, SECURITY, UPTIME, GIGW, DATA_PROTECTION
  title: text("title").notNull(),
  description: text("description"),
  issuedTo: text("issued_to").notNull(), // Company name
  issuedBy: text("issued_by").notNull(), // Issuing authority
  issueDate: date("issue_date").notNull(),
  validUntil: date("valid_until"),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, EXPIRED, REVOKED
  documentUrl: text("document_url"),
  verificationCode: text("verification_code").notNull(), // Unique code for QR verification
  metadata: jsonb("metadata").$type<{
    signatoryName?: string;
    signatoryDesignation?: string;
    companyAddress?: string;
    specifications?: Record<string, string>;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompanyCertificateSchema = createInsertSchema(companyCertificates).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

export type CompanyCertificate = typeof companyCertificates.$inferSelect;
export type InsertCompanyCertificate = z.infer<typeof insertCompanyCertificateSchema>;

// Secure Exam Browser Configuration (per exam)
export const secureExamConfigs = pgTable("secure_exam_configs", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  
  // SEB Settings
  sebEnabled: boolean("seb_enabled").default(false),
  sebConfigKey: text("seb_config_key"), // Unique key for SEB configuration
  sebVersion: text("seb_version").default("3.0"),
  
  // Browser Lockdown Settings
  allowedBrowsers: jsonb("allowed_browsers").$type<{
    seb?: boolean;        // Safe Exam Browser
    chrome?: boolean;     // Chrome Kiosk Mode
    custom?: boolean;     // Custom Browser
    customBrowserName?: string;
    customBrowserAgent?: string;
  }>(),
  
  // Lockdown Features
  lockdownSettings: jsonb("lockdown_settings").$type<{
    disableRightClick?: boolean;
    disableCopyPaste?: boolean;
    disablePrintScreen?: boolean;
    disableTaskSwitching?: boolean;
    disableWebcam?: boolean;
    enableWebcamProctoring?: boolean;
    disableMicrophone?: boolean;
    disableNetwork?: boolean;
    allowedUrls?: string[];
    blockedUrls?: string[];
    browserUserAgent?: string;
    fullScreenMode?: boolean;
    quitPassword?: string;
    adminPassword?: string;
  }>(),
  
  // Session Settings
  sessionSettings: jsonb("session_settings").$type<{
    maxAttempts?: number;
    sessionTimeout?: number; // in minutes
    autoSubmitOnTimeout?: boolean;
    allowResume?: boolean;
    ipRestriction?: boolean;
    allowedIpRanges?: string[];
    requireCenterToken?: boolean;
    singleDeviceLogin?: boolean;
  }>(),
  
  // Exam Window Settings
  examWindow: jsonb("exam_window").$type<{
    width?: number;
    height?: number;
    resizable?: boolean;
    toolbarVisible?: boolean;
    statusBarVisible?: boolean;
    allowZoom?: boolean;
  }>(),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Center-wise Exam Links (unique tokens for each center)
export const examCenterLinks = pgTable("exam_center_links", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  
  // Center Information
  centerCode: text("center_code").notNull(),
  centerName: text("center_name").notNull(),
  centerAddress: text("center_address"),
  centerCity: text("center_city"),
  centerState: text("center_state"),
  
  // Unique Access Token
  accessToken: text("access_token").notNull().unique(),
  tokenExpiresAt: timestamp("token_expires_at"),
  
  // Lab Configuration
  labDetails: jsonb("lab_details").$type<{
    labNumber?: string;
    totalSeats?: number;
    ipRange?: string;
    labIncharge?: string;
    labInchargeContact?: string;
  }>(),
  
  // Shift Configuration
  shiftDetails: jsonb("shift_details").$type<{
    shiftNumber?: number;
    shiftName?: string;
    reportingTime?: string;
    examStartTime?: string;
    examEndTime?: string;
    gateClosingTime?: string;
  }>(),
  
  // Link Status
  status: text("status").default("ACTIVE"), // ACTIVE, EXPIRED, DISABLED, USED
  activatedAt: timestamp("activated_at"),
  usageCount: integer("usage_count").default(0),
  maxUsage: integer("max_usage"), // null = unlimited
  
  // Subdomain routing
  subdomain: text("subdomain"), // e.g., "cgl", "chsl" for cgl.portal.gov.in
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Secure Exam Sessions (track active exam sessions)
export const secureExamSessions = pgTable("secure_exam_sessions", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  examId: integer("exam_id").notNull().references(() => exams.id),
  centerLinkId: integer("center_link_id").references(() => examCenterLinks.id),
  
  // Session Details
  sessionToken: text("session_token").notNull().unique(),
  rollNumber: text("roll_number"),
  
  // Device & Browser Info
  deviceInfo: jsonb("device_info").$type<{
    userAgent?: string;
    browserName?: string;
    browserVersion?: string;
    osName?: string;
    osVersion?: string;
    screenResolution?: string;
    ipAddress?: string;
    macAddress?: string;
    sebVersion?: string;
    sebConfigHash?: string;
  }>(),
  
  // Session Status
  status: text("status").default("INITIATED"), // INITIATED, ACTIVE, PAUSED, COMPLETED, TERMINATED, EXPIRED
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  lastActivityAt: timestamp("last_activity_at"),
  
  // Exam Progress
  progress: jsonb("progress").$type<{
    questionsAttempted?: number;
    questionsTotal?: number;
    currentSection?: string;
    timeRemaining?: number; // in seconds
    answersSaved?: boolean;
  }>(),
  
  // Security Events
  securityEvents: jsonb("security_events").$type<{
    timestamp: string;
    event: string;
    details?: string;
    severity?: string;
  }[]>(),
  
  // Termination Details
  terminationReason: text("termination_reason"),
  terminatedBy: text("terminated_by"), // SYSTEM, ADMIN, CANDIDATE, TIMEOUT
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for new tables
export const insertSecureExamConfigSchema = createInsertSchema(secureExamConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExamCenterLinkSchema = createInsertSchema(examCenterLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSecureExamSessionSchema = createInsertSchema(secureExamSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for new tables
export type SecureExamConfig = typeof secureExamConfigs.$inferSelect;
export type InsertSecureExamConfig = z.infer<typeof insertSecureExamConfigSchema>;
export type ExamCenterLink = typeof examCenterLinks.$inferSelect;
export type InsertExamCenterLink = z.infer<typeof insertExamCenterLinkSchema>;
export type SecureExamSession = typeof secureExamSessions.$inferSelect;
export type InsertSecureExamSession = z.infer<typeof insertSecureExamSessionSchema>;

// === EXAM CANDIDATE DATA (Uploaded by Admin for each exam) ===
export const examCandidates = pgTable("exam_candidates", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  centerLinkId: integer("center_link_id").references(() => examCenterLinks.id),
  
  // Candidate Details
  registrationNumber: text("registration_number").notNull(),
  rollNumber: text("roll_number").notNull(),
  candidateName: text("candidate_name").notNull(),
  fatherName: text("father_name"),
  motherName: text("mother_name"),
  dob: date("dob"),
  gender: text("gender"),
  category: text("category"),
  mobile: text("mobile"),
  email: text("email"),
  photoUrl: text("photo_url"),
  signatureUrl: text("signature_url"),
  
  // Exam Assignment
  shiftId: integer("shift_id"),
  seatNumber: text("seat_number"),
  labNumber: text("lab_number"),
  
  // Attendance & Status
  isPresent: boolean("is_present").default(false),
  attendanceMarkedAt: timestamp("attendance_marked_at"),
  attendanceMarkedBy: text("attendance_marked_by"),
  
  // Biometric Verification
  biometricVerified: boolean("biometric_verified").default(false),
  biometricData: jsonb("biometric_data").$type<{
    fingerprint?: string;
    faceMatch?: boolean;
    matchScore?: number;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === EXAM SHIFTS (Multiple shifts per exam center) ===
export const examShifts = pgTable("exam_shifts", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  centerLinkId: integer("center_link_id").references(() => examCenterLinks.id),
  
  // Shift Details
  shiftNumber: integer("shift_number").notNull(),
  shiftName: text("shift_name").notNull(), // e.g., "Morning Shift", "Afternoon Shift"
  shiftDate: date("shift_date").notNull(),
  
  // Timings
  reportingTime: text("reporting_time").notNull(), // e.g., "08:00 AM"
  gateClosingTime: text("gate_closing_time"), // e.g., "09:00 AM"
  examStartTime: text("exam_start_time").notNull(), // e.g., "10:00 AM"
  examEndTime: text("exam_end_time").notNull(), // e.g., "12:00 PM"
  examDuration: integer("exam_duration_minutes").default(120), // in minutes
  
  // Capacity
  totalSeats: integer("total_seats"),
  allocatedCandidates: integer("allocated_candidates").default(0),
  
  // Status
  status: text("status").default("SCHEDULED"), // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === QUESTION PAPERS (Encrypted for secure delivery) ===
export const questionPapers = pgTable("question_papers", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  
  // Paper Details
  paperCode: text("paper_code").notNull(),
  paperName: text("paper_name").notNull(),
  language: text("language").default("English"), // English, Hindi, Bilingual
  version: text("version").default("A"), // A, B, C, D (different sets)
  
  // Question Data (Encrypted)
  encryptedData: text("encrypted_data"), // AES-256 encrypted JSON of questions
  encryptionKey: text("encryption_key"), // Encrypted key (only decrypted at exam center)
  encryptionIv: text("encryption_iv"), // Initialization vector
  dataHash: text("data_hash"), // SHA-256 hash for integrity verification
  
  // Question Details
  totalQuestions: integer("total_questions"),
  totalMarks: integer("total_marks"),
  negativeMarking: boolean("negative_marking").default(true),
  negativeMarkValue: text("negative_mark_value").default("0.25"),
  
  // Sections
  sections: jsonb("sections").$type<{
    sectionId: string;
    sectionName: string;
    questionsCount: number;
    marksPerQuestion: number;
    mandatoryQuestions?: number;
    timeLimit?: number; // section-wise time in minutes
  }[]>(),
  
  // Upload Info
  uploadedBy: text("uploaded_by"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  
  // Activation (When paper becomes available for download)
  activationTime: timestamp("activation_time"),
  expiryTime: timestamp("expiry_time"),
  isActive: boolean("is_active").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === OFFLINE EXAM PACKAGES (Downloadable by exam centers) ===
export const offlineExamPackages = pgTable("offline_exam_packages", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  centerLinkId: integer("center_link_id").references(() => examCenterLinks.id),
  shiftId: integer("shift_id").references(() => examShifts.id),
  
  // Package Details
  packageCode: text("package_code").notNull().unique(),
  packageName: text("package_name").notNull(),
  
  // Package Contents (Encrypted)
  encryptedPackageUrl: text("encrypted_package_url"), // URL to download encrypted package
  packageSize: integer("package_size"), // in bytes
  packageHash: text("package_hash"), // SHA-256 for integrity check
  
  // Decryption Key (Sent separately or via secure channel)
  decryptionKeyEncrypted: text("decryption_key_encrypted"),
  keyActivationTime: timestamp("key_activation_time"), // When key becomes valid
  
  // Package Contents Summary
  contents: jsonb("contents").$type<{
    questionPaperIds: number[];
    candidateCount: number;
    includesPhotos: boolean;
    includesSignatures: boolean;
    totalSize: number;
  }>(),
  
  // Download Status
  downloadCount: integer("download_count").default(0),
  lastDownloadAt: timestamp("last_download_at"),
  lastDownloadIp: text("last_download_ip"),
  
  // Activation Status
  status: text("status").default("PENDING"), // PENDING, READY, DOWNLOADED, ACTIVATED, EXPIRED
  activatedAt: timestamp("activated_at"),
  activatedBy: text("activated_by"),
  
  // Sync Status (for uploading results back)
  syncStatus: text("sync_status").default("NOT_SYNCED"), // NOT_SYNCED, SYNCING, SYNCED, FAILED
  lastSyncAt: timestamp("last_sync_at"),
  syncErrors: jsonb("sync_errors").$type<string[]>(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === EXAM RESPONSES (Candidate answers - stored offline, synced later) ===
export const examResponses = pgTable("exam_responses", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  candidateId: integer("candidate_id").notNull().references(() => examCandidates.id),
  sessionId: integer("session_id").references(() => secureExamSessions.id),
  questionPaperId: integer("question_paper_id").references(() => questionPapers.id),
  
  // Response Data
  responses: jsonb("responses").$type<{
    questionId: string;
    selectedOption: string | null;
    markedForReview: boolean;
    timeTaken: number; // seconds spent on question
    visitCount: number; // how many times visited
    answeredAt: string; // ISO timestamp
  }[]>(),
  
  // Summary
  totalAnswered: integer("total_answered").default(0),
  totalMarkedForReview: integer("total_marked_for_review").default(0),
  totalNotVisited: integer("total_not_visited").default(0),
  
  // Timing
  examStartTime: timestamp("exam_start_time"),
  examEndTime: timestamp("exam_end_time"),
  totalTimeTaken: integer("total_time_taken"), // in seconds
  
  // Submission
  submittedAt: timestamp("submitted_at"),
  submissionType: text("submission_type"), // MANUAL, AUTO_TIMEOUT, FORCED
  
  // Offline Data
  offlineRecorded: boolean("offline_recorded").default(false),
  syncedAt: timestamp("synced_at"),
  localStorageKey: text("local_storage_key"), // Key used for offline storage
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert Schemas for new tables
export const insertExamCandidateSchema = createInsertSchema(examCandidates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExamShiftSchema = createInsertSchema(examShifts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuestionPaperSchema = createInsertSchema(questionPapers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOfflineExamPackageSchema = createInsertSchema(offlineExamPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExamResponseSchema = createInsertSchema(examResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for new tables
export type ExamCandidate = typeof examCandidates.$inferSelect;
export type InsertExamCandidate = z.infer<typeof insertExamCandidateSchema>;
export type ExamShift = typeof examShifts.$inferSelect;
export type InsertExamShift = z.infer<typeof insertExamShiftSchema>;
export type QuestionPaper = typeof questionPapers.$inferSelect;
export type InsertQuestionPaper = z.infer<typeof insertQuestionPaperSchema>;
export type OfflineExamPackage = typeof offlineExamPackages.$inferSelect;
export type InsertOfflineExamPackage = z.infer<typeof insertOfflineExamPackageSchema>;
export type ExamResponse = typeof examResponses.$inferSelect;
export type InsertExamResponse = z.infer<typeof insertExamResponseSchema>;

// Job Alerts / Sarkari Result Style News
export const jobAlerts = pgTable("job_alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  shortDescription: text("short_description"),
  content: text("content"),
  
  // Category: ADMIT_CARD, RESULT, ANSWER_KEY, SYLLABUS, LATEST_JOB, ADMISSION, IMPORTANT
  category: text("category").notNull(),
  
  // Job Type: GOVERNMENT, PRIVATE
  jobType: text("job_type").default("GOVERNMENT"),
  
  // Organization/Department
  organization: text("organization").notNull(),
  
  // Post details
  postName: text("post_name"),
  totalVacancies: integer("total_vacancies"),
  qualifications: text("qualifications"),
  
  // Important dates
  applicationStartDate: date("application_start_date"),
  applicationEndDate: date("application_end_date"),
  examDate: date("exam_date"),
  resultDate: date("result_date"),
  admitCardDate: date("admit_card_date"),
  
  // Age limit
  ageLimit: text("age_limit"),
  
  // Application fee
  applicationFee: jsonb("application_fee").$type<{
    general?: number;
    obc?: number;
    scSt?: number;
    female?: number;
    pwd?: number;
  }>(),
  
  // Links
  officialWebsite: text("official_website"),
  applyOnlineLink: text("apply_online_link"),
  notificationPdfLink: text("notification_pdf_link"),
  syllabusLink: text("syllabus_link"),
  admitCardLink: text("admit_card_link"),
  resultLink: text("result_link"),
  answerKeyLink: text("answer_key_link"),
  
  // Tags for filtering
  tags: text("tags").array(),
  
  // State/Region
  state: text("state"),
  
  // Status flags
  isHot: boolean("is_hot").default(false),
  isNew: boolean("is_new").default(true),
  isActive: boolean("is_active").default(true),
  
  // View count
  viewCount: integer("view_count").default(0),
  
  // SEO
  slug: text("slug").unique(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJobAlertSchema = createInsertSchema(jobAlerts).omit({
  id: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
});

export type JobAlert = typeof jobAlerts.$inferSelect;
export type InsertJobAlert = z.infer<typeof insertJobAlertSchema>;

// Job Alert Subscribers (Email subscription for new job notifications)
export const jobAlertSubscribers = pgTable("job_alert_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  
  // Subscription preferences
  categories: text("categories").array(), // ADMIT_CARD, RESULT, ANSWER_KEY, SYLLABUS, LATEST_JOB
  states: text("states").array(), // State preferences
  organizations: text("organizations").array(), // Org preferences
  
  // Verification
  isVerified: boolean("is_verified").default(false),
  verificationToken: text("verification_token"),
  
  // Status
  isActive: boolean("is_active").default(true),
  unsubscribeToken: text("unsubscribe_token"),
  
  // Stats
  emailsSent: integer("emails_sent").default(0),
  lastEmailSentAt: timestamp("last_email_sent_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJobAlertSubscriberSchema = createInsertSchema(jobAlertSubscribers).omit({
  id: true,
  isVerified: true,
  verificationToken: true,
  unsubscribeToken: true,
  emailsSent: true,
  lastEmailSentAt: true,
  createdAt: true,
  updatedAt: true,
});

export type JobAlertSubscriber = typeof jobAlertSubscribers.$inferSelect;
export type InsertJobAlertSubscriber = z.infer<typeof insertJobAlertSubscriberSchema>;

// Push Notification Subscriptions (Browser push for new jobs)
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(), // Public key
  auth: text("auth").notNull(), // Auth secret
  
  // User agent info
  userAgent: text("user_agent"),
  
  // Subscription preferences
  categories: text("categories").array(),
  
  // Status
  isActive: boolean("is_active").default(true),
  failureCount: integer("failure_count").default(0),
  lastPushAt: timestamp("last_push_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  failureCount: true,
  lastPushAt: true,
  createdAt: true,
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;

// Custom Request Types
export type CreateProfileRequest = InsertProfile;
export type UpdateProfileRequest = Partial<InsertProfile>;

// Test Series (Mock Tests / Practice Tests for Students)
export const testSeries = pgTable("test_series", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  
  // Category: SSC, UPSC, RAILWAY, BANK, STATE_PSC, POLICE, DEFENCE, OTHER
  examCategory: text("exam_category").notNull(),
  
  // Specific exam (e.g., SSC CGL, IBPS PO)
  examName: text("exam_name"),
  
  // Test details
  totalQuestions: integer("total_questions").default(100),
  totalMarks: integer("total_marks").default(200),
  duration: integer("duration").default(60), // in minutes
  negativeMarking: text("negative_marking").default("0.25"), // marks deducted per wrong answer
  
  // Difficulty: EASY, MEDIUM, HARD
  difficulty: text("difficulty").default("MEDIUM"),
  
  // Language options
  languages: text("languages").array().default(["ENGLISH", "HINDI"]),
  
  // Subjects/Sections
  sections: jsonb("sections").$type<{
    name: string;
    questions: number;
    marks: number;
    duration?: number;
  }[]>(),
  
  // Instructions
  instructions: text("instructions"),
  
  // Pricing (0 = free)
  price: integer("price").default(0),
  isFree: boolean("is_free").default(true),
  
  // Status
  isActive: boolean("is_active").default(true),
  isPopular: boolean("is_popular").default(false),
  
  // Attempt count
  attemptCount: integer("attempt_count").default(0),
  
  // External link to take test on partner platform
  externalLink: text("external_link"),
  
  // SEO
  slug: text("slug").unique(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTestSeriesSchema = createInsertSchema(testSeries).omit({
  id: true,
  attemptCount: true,
  createdAt: true,
  updatedAt: true,
});

export type TestSeries = typeof testSeries.$inferSelect;
export type InsertTestSeries = z.infer<typeof insertTestSeriesSchema>;

// Test Questions (Questions for each Test Series)
export const testQuestions = pgTable("test_questions", {
  id: serial("id").primaryKey(),
  testSeriesId: integer("test_series_id").notNull().references(() => testSeries.id),
  
  // Paragraph/Passage for comprehension questions
  paragraph: text("paragraph"), // Shared passage for grouped questions
  paragraphImage: text("paragraph_image"), // Optional image for the paragraph
  
  // Question content
  questionText: text("question_text").notNull(),
  questionImage: text("question_image"), // Optional image URL
  
  // Option images (for visual questions)
  optionAImage: text("option_a_image"),
  optionBImage: text("option_b_image"),
  optionCImage: text("option_c_image"),
  optionDImage: text("option_d_image"),
  
  // Options (A, B, C, D)
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c"),
  optionD: text("option_d"),
  
  // Correct answer: A, B, C, D
  correctAnswer: text("correct_answer").notNull(),
  
  // Explanation for correct answer
  explanation: text("explanation"),
  
  // Section/Subject
  section: text("section"),
  
  // Marks for this question
  marks: integer("marks").default(2),
  
  // Question order in test
  questionOrder: integer("question_order").default(1),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestQuestionSchema = createInsertSchema(testQuestions).omit({
  id: true,
  createdAt: true,
});

export type TestQuestion = typeof testQuestions.$inferSelect;
export type InsertTestQuestion = z.infer<typeof insertTestQuestionSchema>;

// Test Attempts (Track user test taking sessions and results)
export const testAttempts = pgTable("test_attempts", {
  id: serial("id").primaryKey(),
  testSeriesId: integer("test_series_id").notNull().references(() => testSeries.id),
  
  // Guest session or user identification
  sessionId: text("session_id").notNull(), // For guests - browser session ID
  userId: varchar("user_id").references(() => users.id), // Optional - for logged in users
  
  // User info for result display
  candidateName: text("candidate_name"),
  candidateEmail: text("candidate_email"),
  candidateMobile: text("candidate_mobile"),
  
  // Test progress
  status: text("status").default("IN_PROGRESS"), // IN_PROGRESS, SUBMITTED, EXPIRED
  
  // Answers: { questionId: "A" | "B" | "C" | "D" | null }
  answers: jsonb("answers").$type<Record<string, string | null>>().default({}),
  
  // Bookmarked questions
  bookmarkedQuestions: jsonb("bookmarked_questions").$type<number[]>().default([]),
  
  // Timing
  startedAt: timestamp("started_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  
  // Time spent in seconds
  timeSpent: integer("time_spent").default(0),
  
  // Results (calculated after submission)
  totalQuestions: integer("total_questions"),
  attempted: integer("attempted").default(0),
  correct: integer("correct").default(0),
  incorrect: integer("incorrect").default(0),
  unanswered: integer("unanswered").default(0),
  
  // Scores
  marksObtained: integer("marks_obtained").default(0),
  totalMarks: integer("total_marks"),
  percentage: text("percentage"),
  
  // Section-wise results
  sectionResults: jsonb("section_results").$type<{
    section: string;
    attempted: number;
    correct: number;
    incorrect: number;
    marks: number;
  }[]>(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestAttemptSchema = createInsertSchema(testAttempts).omit({
  id: true,
  createdAt: true,
});

export type TestAttempt = typeof testAttempts.$inferSelect;
export type InsertTestAttempt = z.infer<typeof insertTestAttemptSchema>;

// ==================== EXAM CENTER MANAGEMENT ====================

// Exam Centers - Physical exam center locations with admin credentials
export const examCentersTable = pgTable("exam_centers_table", {
  id: serial("id").primaryKey(),
  
  // Center Details
  centerCode: text("center_code").notNull().unique(),
  centerName: text("center_name").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  
  // Center Admin Credentials
  adminUsername: text("admin_username").notNull().unique(),
  adminPassword: text("admin_password").notNull(), // Hashed
  adminEmail: text("admin_email"),
  adminMobile: text("admin_mobile"),
  
  // Center Capacity
  totalSeats: integer("total_seats").default(30),
  totalComputers: integer("total_computers").default(30),
  
  // LAN Server Configuration
  lanServerIp: text("lan_server_ip"), // e.g., 192.168.1.1
  lanServerPort: integer("lan_server_port").default(3000),
  
  // Access Token for Main Admin Sync
  syncToken: text("sync_token").notNull().unique(),
  lastSyncAt: timestamp("last_sync_at"),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertExamCenterTableSchema = createInsertSchema(examCentersTable).omit({
  id: true,
  lastSyncAt: true,
  createdAt: true,
  updatedAt: true,
});

export type ExamCenterTable = typeof examCentersTable.$inferSelect;
export type InsertExamCenterTable = z.infer<typeof insertExamCenterTableSchema>;

// Center Exam Assignments - Which exams are assigned to which centers
export const centerExamAssignments = pgTable("center_exam_assignments", {
  id: serial("id").primaryKey(),
  centerId: integer("center_id").notNull().references(() => examCentersTable.id),
  examId: integer("exam_id").notNull().references(() => exams.id),
  shiftId: integer("shift_id").references(() => examShifts.id),
  testSeriesId: integer("test_series_id").references(() => testSeries.id), // Linked test series for questions
  
  // Assignment Details
  assignedCandidates: integer("assigned_candidates").default(0),
  reportingTime: text("reporting_time"),
  gateClosingTime: text("gate_closing_time"),
  
  // Package Download Status
  packageDownloaded: boolean("package_downloaded").default(false),
  packageDownloadedAt: timestamp("package_downloaded_at"),
  
  // Decryption Key (sent separately at exam time)
  decryptionKeySent: boolean("decryption_key_sent").default(false),
  decryptionKeySentAt: timestamp("decryption_key_sent_at"),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCenterExamAssignmentSchema = createInsertSchema(centerExamAssignments).omit({
  id: true,
  packageDownloadedAt: true,
  decryptionKeySentAt: true,
  createdAt: true,
});

export type CenterExamAssignment = typeof centerExamAssignments.$inferSelect;
export type InsertCenterExamAssignment = z.infer<typeof insertCenterExamAssignmentSchema>;

// Student Exam Sessions - Student connections via LAN to Center Admin
export const studentExamSessions = pgTable("student_exam_sessions", {
  id: serial("id").primaryKey(),
  centerId: integer("center_id").notNull().references(() => examCentersTable.id),
  examId: integer("exam_id").notNull().references(() => exams.id),
  candidateId: integer("candidate_id").notNull().references(() => examCandidates.id),
  shiftId: integer("shift_id").references(() => examShifts.id),
  
  // Session Details
  sessionToken: text("session_token").notNull().unique(),
  seatNumber: text("seat_number"),
  computerNumber: text("computer_number"),
  
  // LAN Connection Details
  studentIpAddress: text("student_ip_address"),
  macAddress: text("mac_address"),
  
  // Biometric/Photo Verification
  photoVerified: boolean("photo_verified").default(false),
  biometricVerified: boolean("biometric_verified").default(false),
  
  // Session Status: WAITING, STARTED, IN_PROGRESS, PAUSED, SUBMITTED, TERMINATED
  status: text("status").default("WAITING"),
  
  // Timing
  loginTime: timestamp("login_time"),
  examStartTime: timestamp("exam_start_time"),
  examEndTime: timestamp("exam_end_time"),
  submissionTime: timestamp("submission_time"),
  
  // Responses (stored locally, synced later)
  responses: jsonb("responses").$type<{
    questionId: number;
    selectedAnswer: string;
    markedForReview: boolean;
    timeSpent: number;
  }[]>(),
  
  // Scoring
  totalQuestions: integer("total_questions").default(0),
  attempted: integer("attempted").default(0),
  correct: integer("correct").default(0),
  wrong: integer("wrong").default(0),
  score: real("score").default(0),
  
  // Sync Status
  syncedToCenter: boolean("synced_to_center").default(true), // Already at center
  syncedToMain: boolean("synced_to_main").default(false), // Synced to main server
  syncedToMainAt: timestamp("synced_to_main_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentExamSessionSchema = createInsertSchema(studentExamSessions).omit({
  id: true,
  syncedToMainAt: true,
  createdAt: true,
  updatedAt: true,
});

export type StudentExamSession = typeof studentExamSessions.$inferSelect;
export type InsertStudentExamSession = z.infer<typeof insertStudentExamSessionSchema>;

// Center Sync Logs - Track sync between Center Admin and Main Admin
export const centerSyncLogs = pgTable("center_sync_logs", {
  id: serial("id").primaryKey(),
  centerId: integer("center_id").notNull().references(() => examCentersTable.id),
  examId: integer("exam_id").references(() => exams.id),
  
  // Sync Type: PACKAGE_DOWNLOAD, RESPONSE_UPLOAD, STATUS_UPDATE, FULL_SYNC
  syncType: text("sync_type").notNull(),
  
  // Sync Details
  recordsUploaded: integer("records_uploaded").default(0),
  recordsFailed: integer("records_failed").default(0),
  
  // Status: INITIATED, IN_PROGRESS, COMPLETED, FAILED
  status: text("status").default("INITIATED"),
  errorMessage: text("error_message"),
  
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertCenterSyncLogSchema = createInsertSchema(centerSyncLogs).omit({
  id: true,
  completedAt: true,
  startedAt: true,
});

export type CenterSyncLog = typeof centerSyncLogs.$inferSelect;
export type InsertCenterSyncLog = z.infer<typeof insertCenterSyncLogSchema>;

// =====================================================
// SEB ADMIN TABLES (Separate from Registration Portal)
// =====================================================

// SEB Admin Users
export const sebAdminUsers = pgTable("seb_admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  email: text("email"),
  role: text("role").default("admin"), // admin, supervisor
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// SEB Exams
export const sebExams = pgTable("seb_exams", {
  id: serial("id").primaryKey(),
  examCode: text("exam_code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  clientLogo: text("client_logo"),
  examLogo: text("exam_logo"),
  headerText: text("header_text"),
  footerText: text("footer_text"),
  watermarkText: text("watermark_text"),
  examDate: date("exam_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  shift: text("shift").default("SHIFT-1"),
  duration: integer("duration").notNull().default(60),
  totalMarks: integer("total_marks").default(100),
  passingMarks: integer("passing_marks").default(35),
  negativeMarking: real("negative_marking").default(0.25),
  totalQuestions: integer("total_questions").default(100),
  sectionsCount: integer("sections_count").default(1),
  instructions: text("instructions"),
  category: text("category"),
  language: text("language").default("English"),
  isActive: boolean("is_active").default(true),
  status: text("status").default("DRAFT"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SEB Students (uploaded by admin)
export const sebStudents = pgTable("seb_students", {
  id: serial("id").primaryKey(),
  rollNumber: text("roll_number").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  centerCode: text("center_code").notNull(),
  examCode: text("exam_code").notNull(),
  shift: text("shift").default("Shift 1"),
  password: text("password"),
  photoUrl: text("photo_url"),
  signatureUrl: text("signature_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// SEB Settings (branding, logos)
export const sebSettings = pgTable("seb_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SEB Question Papers (encrypted)
export const sebQuestionPapers = pgTable("seb_question_papers", {
  id: serial("id").primaryKey(),
  paperCode: text("paper_code").notNull().unique(),
  examCode: text("exam_code").notNull(),
  subject: text("subject").notNull(),
  encryptedData: text("encrypted_data").notNull(), // AES-256 encrypted questions
  questionCount: integer("question_count").default(0),
  encryptionSalt: text("encryption_salt"), // for key derivation
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// SEB Student Responses
export const sebResponses = pgTable("seb_responses", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => sebStudents.id),
  examCode: text("exam_code").notNull(),
  paperCode: text("paper_code").notNull(),
  centerCode: text("center_code").notNull(),
  responses: jsonb("responses").$type<any[]>(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  status: text("status").default("NOT_STARTED"), // NOT_STARTED, IN_PROGRESS, SUBMITTED, TERMINATED
  score: real("score"),
  syncedToMain: boolean("synced_to_main").default(false),
  syncedAt: timestamp("synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === VISITOR TRACKING ===
export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  portal: text("portal").notNull(), // "exam" or "jobs"
  page: text("page").notNull(),
  sessionId: text("session_id"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  ip: text("ip"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const visitorStats = pgTable("visitor_stats", {
  id: serial("id").primaryKey(),
  portal: text("portal").notNull(), // "exam" or "jobs"
  date: date("date").notNull(),
  totalViews: integer("total_views").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
});

export type PageView = typeof pageViews.$inferSelect;
export type VisitorStat = typeof visitorStats.$inferSelect;
