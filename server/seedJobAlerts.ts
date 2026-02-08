import { db } from "./db";
import { jobAlerts } from "@shared/schema";
import { eq, sql, and, or, inArray, isNotNull } from "drizzle-orm";

const JOB_ALERTS_DATA = [
  {
    title: "RRB Group D Recruitment 2026 - 22,000+ Posts",
    shortDescription: "Indian Railways announces mega recruitment for Group D (Helper, Track Maintainer) across all zones. 10th pass eligible.",
    category: "LATEST_JOB",
    organization: "Railway Recruitment Board",
    totalVacancies: 22000,
    officialWebsite: "https://rrbcdg.gov.in",
    applyOnlineLink: "https://rrbcdg.gov.in",
    state: "All India",
    isHot: true,
    isNew: true,
    isActive: true,
    slug: "rrb-group-d-2026",
    viewCount: 15420,
  },
  {
    title: "SSC CGL 2026 Notification",
    shortDescription: "Combined Graduate Level Exam for Group B & C posts in various Ministries. Graduate candidates eligible.",
    category: "LATEST_JOB",
    organization: "Staff Selection Commission",
    totalVacancies: 8500,
    officialWebsite: "https://ssc.gov.in",
    applyOnlineLink: "https://ssc.gov.in",
    state: "All India",
    isHot: true,
    isNew: true,
    isActive: true,
    slug: "ssc-cgl-2026",
    viewCount: 12340,
  },
  {
    title: "UPSC Civil Services 2026",
    shortDescription: "Prelims notification for IAS, IPS, IFS and other Central Services. Age 21-32 years.",
    category: "LATEST_JOB",
    organization: "Union Public Service Commission",
    totalVacancies: 1200,
    officialWebsite: "https://upsc.gov.in",
    applyOnlineLink: "https://upsc.gov.in",
    state: "All India",
    isHot: true,
    isNew: true,
    isActive: true,
    slug: "upsc-cse-2026",
    viewCount: 18500,
  },
  {
    title: "SBI Clerk 2026 - 8,000 Vacancies",
    shortDescription: "State Bank of India Junior Associate recruitment. Graduate with computer knowledge required.",
    category: "LATEST_JOB",
    organization: "State Bank of India",
    totalVacancies: 8000,
    officialWebsite: "https://sbi.co.in",
    applyOnlineLink: "https://sbi.co.in",
    state: "All India",
    isHot: true,
    isNew: true,
    isActive: true,
    slug: "sbi-clerk-2026",
    viewCount: 9800,
  },
  {
    title: "SSC CHSL 2026 Notification",
    shortDescription: "Combined Higher Secondary Level exam for LDC, DEO, PA/SA posts. 12th pass eligible.",
    category: "LATEST_JOB",
    organization: "Staff Selection Commission",
    totalVacancies: 4500,
    officialWebsite: "https://ssc.gov.in",
    applyOnlineLink: "https://ssc.gov.in",
    state: "All India",
    isHot: false,
    isNew: true,
    isActive: true,
    slug: "ssc-chsl-2026",
    viewCount: 7600,
  },
  {
    title: "SSC GD Constable 2026 Result",
    shortDescription: "Result declared for General Duty Constable in BSF, CISF, CRPF, SSB, ITBP, AR, NIA, SSF.",
    category: "RESULT",
    organization: "Staff Selection Commission",
    totalVacancies: 24369,
    officialWebsite: "https://ssc.gov.in",
    state: "All India",
    isHot: true,
    isNew: true,
    isActive: true,
    slug: "ssc-gd-result-2026",
    viewCount: 22000,
  },
  {
    title: "IBPS PO 2025 Final Result",
    shortDescription: "Probationary Officer final result with scorecard available for download.",
    category: "RESULT",
    organization: "IBPS",
    totalVacancies: 4000,
    officialWebsite: "https://ibps.in",
    state: "All India",
    isHot: false,
    isNew: true,
    isActive: true,
    slug: "ibps-po-result-2025",
    viewCount: 5600,
  },
  {
    title: "SSC CGL 2025 Tier-II Result",
    shortDescription: "Combined Graduate Level Tier-II result with category-wise cut-offs.",
    category: "RESULT",
    organization: "Staff Selection Commission",
    totalVacancies: 8500,
    officialWebsite: "https://ssc.gov.in",
    state: "All India",
    isHot: false,
    isNew: true,
    isActive: true,
    slug: "ssc-cgl-tier2-result-2025",
    viewCount: 8900,
  },
  {
    title: "UPSC CSE 2025 Final Result",
    shortDescription: "Civil Services Examination final result with rank list and marks.",
    category: "RESULT",
    organization: "UPSC",
    totalVacancies: 1016,
    officialWebsite: "https://upsc.gov.in",
    state: "All India",
    isHot: true,
    isNew: true,
    isActive: true,
    slug: "upsc-cse-final-result-2025",
    viewCount: 25000,
  },
  {
    title: "SSC MTS 2026 Admit Card",
    shortDescription: "Multi Tasking Staff exam admit card released for all regions.",
    category: "ADMIT_CARD",
    organization: "Staff Selection Commission",
    totalVacancies: 8000,
    officialWebsite: "https://ssc.gov.in",
    state: "All India",
    isHot: true,
    isNew: true,
    isActive: true,
    slug: "ssc-mts-admit-card-2026",
    viewCount: 11200,
  },
  {
    title: "RRB NTPC 2025 Admit Card",
    shortDescription: "Non-Technical Popular Categories admit card for CBT-2.",
    category: "ADMIT_CARD",
    organization: "Railway Recruitment Board",
    totalVacancies: 35000,
    officialWebsite: "https://rrbcdg.gov.in",
    state: "All India",
    isHot: false,
    isNew: true,
    isActive: true,
    slug: "rrb-ntpc-admit-card-2025",
    viewCount: 8700,
  },
  {
    title: "IBPS Clerk 2026 Admit Card",
    shortDescription: "Prelims admit card for clerical cadre posts in 11 PSU banks.",
    category: "ADMIT_CARD",
    organization: "IBPS",
    totalVacancies: 6000,
    officialWebsite: "https://ibps.in",
    state: "All India",
    isHot: false,
    isNew: true,
    isActive: true,
    slug: "ibps-clerk-admit-card-2026",
    viewCount: 4500,
  },
  {
    title: "SSC CGL 2025 Answer Key",
    shortDescription: "Tier-I answer key with response sheet. Objection window open till Feb 10.",
    category: "ANSWER_KEY",
    organization: "Staff Selection Commission",
    officialWebsite: "https://ssc.gov.in",
    state: "All India",
    isHot: true,
    isNew: true,
    isActive: true,
    slug: "ssc-cgl-answer-key-2025",
    viewCount: 14300,
  },
  {
    title: "UPSC ESE 2025 Answer Key",
    shortDescription: "Engineering Services Prelims answer key for all branches.",
    category: "ANSWER_KEY",
    organization: "UPSC",
    officialWebsite: "https://upsc.gov.in",
    state: "All India",
    isHot: false,
    isNew: true,
    isActive: true,
    slug: "upsc-ese-answer-key-2025",
    viewCount: 3200,
  },
  {
    title: "Army Agniveer Recruitment 2026",
    shortDescription: "Indian Army Agniveer Rally for General Duty, Technical, Clerk/SKT, Tradesman.",
    category: "LATEST_JOB",
    organization: "Indian Army",
    totalVacancies: 50000,
    officialWebsite: "https://joinindianarmy.nic.in",
    applyOnlineLink: "https://joinindianarmy.nic.in",
    state: "All India",
    isHot: true,
    isNew: true,
    isActive: true,
    slug: "army-agniveer-2026",
    viewCount: 32000,
  },
  {
    title: "UP Police Constable 2026",
    shortDescription: "Uttar Pradesh Police recruitment for 25,000+ constable posts.",
    category: "LATEST_JOB",
    organization: "UP Police Recruitment Board",
    totalVacancies: 25000,
    officialWebsite: "https://uppbpb.gov.in",
    applyOnlineLink: "https://uppbpb.gov.in",
    state: "Uttar Pradesh",
    isHot: true,
    isNew: true,
    isActive: true,
    slug: "up-police-constable-2026",
    viewCount: 18900,
  },
  {
    title: "Rajasthan Patwari 2026",
    shortDescription: "Revenue Department Patwari recruitment for 5000+ posts.",
    category: "LATEST_JOB",
    organization: "RSMSSB",
    totalVacancies: 5000,
    officialWebsite: "https://rsmssb.rajasthan.gov.in",
    applyOnlineLink: "https://rsmssb.rajasthan.gov.in",
    state: "Rajasthan",
    isHot: false,
    isNew: true,
    isActive: true,
    slug: "rajasthan-patwari-2026",
    viewCount: 6700,
  },
  {
    title: "Delhi Police Head Constable 2026",
    shortDescription: "Head Constable (Ministerial) recruitment in Delhi Police.",
    category: "LATEST_JOB",
    organization: "Delhi Police",
    totalVacancies: 1500,
    officialWebsite: "https://delhipolice.nic.in",
    applyOnlineLink: "https://delhipolice.nic.in",
    state: "Delhi",
    isHot: false,
    isNew: true,
    isActive: true,
    slug: "delhi-police-hc-2026",
    viewCount: 4100,
  },
  {
    title: "Navy SSC Officer 2026",
    shortDescription: "Short Service Commission Officer entry for various branches.",
    category: "LATEST_JOB",
    organization: "Indian Navy",
    totalVacancies: 250,
    officialWebsite: "https://joinindiannavy.gov.in",
    applyOnlineLink: "https://joinindiannavy.gov.in",
    state: "All India",
    isHot: false,
    isNew: true,
    isActive: true,
    slug: "navy-ssc-2026",
    viewCount: 2800,
  },
  {
    title: "Bihar Teacher Recruitment 2026",
    shortDescription: "BPSC TRE 4.0 for PGT, TGT, PRT posts across Bihar.",
    category: "LATEST_JOB",
    organization: "Bihar PSC",
    totalVacancies: 90000,
    officialWebsite: "https://bpsc.bih.nic.in",
    applyOnlineLink: "https://bpsc.bih.nic.in",
    state: "Bihar",
    isHot: true,
    isNew: true,
    isActive: true,
    slug: "bihar-teacher-2026",
    viewCount: 45000,
  },
];

const SEEDED_SLUGS = JOB_ALERTS_DATA.map(j => j.slug);

export async function cleanSeededJobDates() {
  try {
    const dirty = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobAlerts)
      .where(
        and(
          inArray(jobAlerts.slug, SEEDED_SLUGS),
          or(
            isNotNull(jobAlerts.applicationStartDate),
            isNotNull(jobAlerts.applicationEndDate),
            isNotNull(jobAlerts.examDate)
          )
        )
      );
    const dirtyCount = Number(dirty[0]?.count) || 0;
    if (dirtyCount === 0) return;

    await db
      .update(jobAlerts)
      .set({
        applicationStartDate: null,
        applicationEndDate: null,
        examDate: null,
      })
      .where(
        and(
          inArray(jobAlerts.slug, SEEDED_SLUGS),
          or(
            isNotNull(jobAlerts.applicationStartDate),
            isNotNull(jobAlerts.applicationEndDate),
            isNotNull(jobAlerts.examDate)
          )
        )
      );
    console.log(`[Seed] Cleared fake dates from ${dirtyCount} seeded job alerts`);
  } catch (error) {
    console.error("[Seed] Error cleaning seeded job dates:", error);
  }
}

export async function seedJobAlerts() {
  try {
    const existingCount = await db.select({ count: sql<number>`count(*)::int` }).from(jobAlerts);
    const count = Number(existingCount[0].count) || 0;
    
    if (count === 0) {
      console.log("Seeding job alerts...");
      for (const alert of JOB_ALERTS_DATA) {
        await db.insert(jobAlerts).values(alert as any);
      }
      console.log(`Seeded ${JOB_ALERTS_DATA.length} job alerts successfully`);
    } else {
      console.log(`Job alerts already exist (${count} found), skipping seed`);
    }

    await cleanSeededJobDates();
  } catch (error) {
    console.error("Error seeding job alerts:", error);
  }
}
