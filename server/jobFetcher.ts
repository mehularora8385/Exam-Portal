import Parser from "rss-parser";
import { db } from "./db";
import { jobAlerts } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";

const parser = new Parser({
  customFields: {
    item: ["content:encoded", "description"],
  },
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
  },
  timeout: 15000,
});

const RSS_FEEDS = [
  // Government Jobs - India
  {
    url: "https://www.freejobalert.com/feed/",
    source: "FreeJobAlert", 
    type: "GOVERNMENT" as const,
  },
  // Private Jobs - WeWorkRemotely (working feeds with https)
  {
    url: "https://weworkremotely.com/remote-jobs.rss",
    source: "WeWorkRemotely",
    type: "PRIVATE" as const,
  },
  // Private Jobs - Remotive (working feeds)
  {
    url: "https://remotive.com/remote-jobs/software-dev/feed",
    source: "Remotive",
    type: "PRIVATE" as const,
  },
  {
    url: "https://remotive.com/remote-jobs/marketing/feed",
    source: "Remotive",
    type: "PRIVATE" as const,
  },
  // Private Jobs - Himalayas (Remote Jobs Platform)
  {
    url: "https://himalayas.app/jobs/rss",
    source: "Himalayas",
    type: "PRIVATE" as const,
  },
];

interface ParsedJob {
  title: string;
  shortDescription: string;
  content: string | null;
  link: string;
  publishedDate: string;
  source: string;
  jobType: "GOVERNMENT" | "PRIVATE";
}

function extractOrganization(title: string, jobType: "GOVERNMENT" | "PRIVATE"): string {
  // Government organizations
  const govtOrgs = [
    { pattern: /UPSC|Union Public Service/i, name: "UPSC" },
    { pattern: /SSC|Staff Selection/i, name: "SSC" },
    { pattern: /RRB|Railway Recruitment|Indian Railway/i, name: "Indian Railways" },
    { pattern: /IBPS|Banking Personnel/i, name: "IBPS" },
    { pattern: /SBI|State Bank/i, name: "SBI" },
    { pattern: /RBI|Reserve Bank/i, name: "RBI" },
    { pattern: /DRDO|Defence Research/i, name: "DRDO" },
    { pattern: /ISRO|Space Research/i, name: "ISRO" },
    { pattern: /Army|Navy|Air Force|Defence/i, name: "Defence" },
    { pattern: /Police|Constable/i, name: "Police" },
    { pattern: /PSC|Public Service Commission/i, name: "State PSC" },
    { pattern: /ESIC/i, name: "ESIC" },
    { pattern: /NTA|National Testing/i, name: "NTA" },
    { pattern: /NEET|JEE/i, name: "NTA" },
    { pattern: /AIIMS/i, name: "AIIMS" },
    { pattern: /Court|High Court|Supreme Court/i, name: "Judiciary" },
    { pattern: /Bank|Banking/i, name: "Banking Sector" },
    { pattern: /LIC|Life Insurance/i, name: "LIC" },
    { pattern: /Post Office|India Post/i, name: "India Post" },
  ];

  // Private companies
  const privateOrgs = [
    { pattern: /TCS|Tata Consultancy/i, name: "TCS" },
    { pattern: /Infosys/i, name: "Infosys" },
    { pattern: /Wipro/i, name: "Wipro" },
    { pattern: /HCL/i, name: "HCL Technologies" },
    { pattern: /Tech Mahindra/i, name: "Tech Mahindra" },
    { pattern: /Cognizant/i, name: "Cognizant" },
    { pattern: /Accenture/i, name: "Accenture" },
    { pattern: /Capgemini/i, name: "Capgemini" },
    { pattern: /Amazon/i, name: "Amazon" },
    { pattern: /Google/i, name: "Google" },
    { pattern: /Microsoft/i, name: "Microsoft" },
    { pattern: /Meta|Facebook/i, name: "Meta" },
    { pattern: /Apple/i, name: "Apple" },
    { pattern: /Flipkart/i, name: "Flipkart" },
    { pattern: /Swiggy/i, name: "Swiggy" },
    { pattern: /Zomato/i, name: "Zomato" },
    { pattern: /Paytm/i, name: "Paytm" },
    { pattern: /Reliance|Jio/i, name: "Reliance" },
    { pattern: /HDFC/i, name: "HDFC" },
    { pattern: /ICICI/i, name: "ICICI" },
    { pattern: /Axis/i, name: "Axis Bank" },
    { pattern: /Deloitte/i, name: "Deloitte" },
    { pattern: /KPMG/i, name: "KPMG" },
    { pattern: /PwC|PricewaterhouseCoopers/i, name: "PwC" },
    { pattern: /EY|Ernst.*Young/i, name: "EY" },
  ];

  const orgs = jobType === "PRIVATE" ? [...privateOrgs, ...govtOrgs] : govtOrgs;

  for (const org of orgs) {
    if (org.pattern.test(title)) {
      return org.name;
    }
  }
  
  return jobType === "PRIVATE" ? "Private Company" : "Government of India";
}

function extractCategory(title: string): string {
  if (/result|answer key/i.test(title)) return "RESULT";
  if (/admit card|hall ticket/i.test(title)) return "ADMIT_CARD";
  if (/syllabus/i.test(title)) return "SYLLABUS";
  if (/apply|recruitment|vacancy|notification/i.test(title)) return "LATEST_JOB";
  return "LATEST_JOB";
}

function extractState(title: string): string {
  const states = [
    { pattern: /Delhi/i, name: "Delhi" },
    { pattern: /Maharashtra|Mumbai/i, name: "Maharashtra" },
    { pattern: /Karnataka|Bangalore|Bengaluru/i, name: "Karnataka" },
    { pattern: /Tamil Nadu|Chennai/i, name: "Tamil Nadu" },
    { pattern: /Uttar Pradesh|UP\s/i, name: "Uttar Pradesh" },
    { pattern: /Rajasthan|Jaipur/i, name: "Rajasthan" },
    { pattern: /Gujarat|Ahmedabad/i, name: "Gujarat" },
    { pattern: /West Bengal|Kolkata/i, name: "West Bengal" },
    { pattern: /Punjab/i, name: "Punjab" },
    { pattern: /Haryana/i, name: "Haryana" },
    { pattern: /Madhya Pradesh|MP\s|Bhopal/i, name: "Madhya Pradesh" },
    { pattern: /Bihar|Patna/i, name: "Bihar" },
    { pattern: /Odisha|Orissa/i, name: "Odisha" },
    { pattern: /Kerala/i, name: "Kerala" },
    { pattern: /Andhra Pradesh|AP\s/i, name: "Andhra Pradesh" },
    { pattern: /Telangana|Hyderabad/i, name: "Telangana" },
    { pattern: /Jharkhand/i, name: "Jharkhand" },
    { pattern: /Chhattisgarh/i, name: "Chhattisgarh" },
    { pattern: /Assam/i, name: "Assam" },
    { pattern: /Uttarakhand/i, name: "Uttarakhand" },
    { pattern: /Himachal Pradesh|HP\s/i, name: "Himachal Pradesh" },
    { pattern: /Jammu|Kashmir|J&K/i, name: "Jammu & Kashmir" },
    { pattern: /Goa/i, name: "Goa" },
  ];

  for (const state of states) {
    if (state.pattern.test(title)) {
      return state.name;
    }
  }
  return "All India";
}

function extractVacancies(text: string): number | null {
  const match = text.match(/(\d{1,6})\s*(vacancies|posts|vacancy|post)/i);
  if (match) {
    return parseInt(match[1]);
  }
  const match2 = text.match(/(\d{1,6})\s*\+?\s*(vacancies|posts)/i);
  if (match2) {
    return parseInt(match2[1]);
  }
  return null;
}

function parseDate(dateStr: string): string | null {
  const months: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12",
    jan: "01", feb: "02", mar: "03", apr: "04",
    jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };

  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = dateStr.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // DD Month YYYY (e.g. "05 February 2026")
  const longDate = dateStr.match(/(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/i);
  if (longDate) {
    const [, d, m, y] = longDate;
    const monthNum = months[m.toLowerCase()];
    if (monthNum) return `${y}-${monthNum}-${d.padStart(2, "0")}`;
  }

  // Month DD, YYYY (e.g. "February 05, 2026")
  const mdyDate = dateStr.match(/(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (mdyDate) {
    const [, m, d, y] = mdyDate;
    const monthNum = months[m.toLowerCase()];
    if (monthNum) return `${y}-${monthNum}-${d.padStart(2, "0")}`;
  }

  return null;
}

function extractDates(text: string): { startDate: string | null; endDate: string | null; examDate: string | null } {
  let startDate: string | null = null;
  let endDate: string | null = null;
  let examDate: string | null = null;

  // "opens on DD-MM-YYYY" or "starts on DD-MM-YYYY" or "start date DD-MM-YYYY"
  const startMatch = text.match(/(?:opens?\s+on|start(?:s|ing)?\s+(?:on|from|date)?)\s*:?\s*([0-9]{1,2}[-\/][0-9]{1,2}[-\/][0-9]{4}|[0-9]{1,2}\s+\w+\s+[0-9]{4})/i);
  if (startMatch) {
    startDate = parseDate(startMatch[1]);
  }

  // "closes on DD-MM-YYYY" or "last date DD-MM-YYYY" or "ends on" or "last date to apply"
  const endMatch = text.match(/(?:closes?\s+on|(?:last|end)\s+date\s*(?:to\s+apply|of\s+application|for\s+apply|of\s+online)?\s*(?:is)?|ends?\s+on)\s*:?\s*([0-9]{1,2}[-\/][0-9]{1,2}[-\/][0-9]{4}|[0-9]{1,2}\s+\w+\s+[0-9]{4})/i);
  if (endMatch) {
    endDate = parseDate(endMatch[1]);
  }

  // "exam date DD-MM-YYYY" or "exam on" or "conducted on" or "will be held on"
  const examMatch = text.match(/(?:exam(?:ination)?\s+(?:date|on)|conducted\s+on|will\s+be\s+held\s+on|CBT\s+(?:Examination\s+)?will\s+be\s+conducted\s+on)\s*:?\s*([0-9]{1,2}[-\/][0-9]{1,2}[-\/][0-9]{4}|[0-9]{1,2}\s+\w+\s+[0-9]{4})/i);
  if (examMatch) {
    examDate = parseDate(examMatch[1]);
  }

  return { startDate, endDate, examDate };
}

function generateSlug(title: string, source: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 80);
  return `${baseSlug}-${source.toLowerCase()}`;
}

function cleanHtml(html: string | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 500);
}

async function fetchFeed(feedConfig: typeof RSS_FEEDS[0]): Promise<ParsedJob[]> {
  try {
    console.log(`[JobFetcher] Fetching from ${feedConfig.source}...`);
    const feed = await parser.parseURL(feedConfig.url);
    
    const jobs: ParsedJob[] = feed.items.slice(0, 20).map((item) => ({
      title: item.title || "Untitled Job",
      shortDescription: cleanHtml(item.contentSnippet || item.description || item["content:encoded"]),
      content: item["content:encoded"] || item.content || null,
      link: item.link || "",
      publishedDate: item.pubDate || new Date().toISOString(),
      source: feedConfig.source,
      jobType: feedConfig.type,
    }));

    console.log(`[JobFetcher] Found ${jobs.length} jobs from ${feedConfig.source}`);
    return jobs;
  } catch (error) {
    console.error(`[JobFetcher] Error fetching ${feedConfig.source}:`, error);
    return [];
  }
}

async function saveJob(job: ParsedJob): Promise<boolean> {
  try {
    const slug = generateSlug(job.title, job.source);
    
    const existing = await db
      .select()
      .from(jobAlerts)
      .where(eq(jobAlerts.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      return false;
    }

    const category = extractCategory(job.title);
    const organization = extractOrganization(job.title, job.jobType);
    const state = extractState(job.title);
    const fullText = job.title + " " + job.shortDescription + " " + (job.content ? cleanHtml(job.content) : "");
    const vacancies = extractVacancies(fullText);
    const dates = extractDates(fullText);

    if (dates.startDate && dates.endDate && dates.startDate > dates.endDate) {
      dates.startDate = null;
    }

    await db.insert(jobAlerts).values({
      title: job.title.substring(0, 255),
      shortDescription: job.shortDescription.substring(0, 500),
      content: job.content,
      category,
      jobType: job.jobType,
      organization,
      state,
      totalVacancies: vacancies,
      applicationStartDate: dates.startDate,
      applicationEndDate: dates.endDate,
      examDate: dates.examDate,
      officialWebsite: job.link,
      applyOnlineLink: job.link,
      isActive: true,
      isNew: true,
      slug,
      createdAt: new Date(job.publishedDate),
    });

    console.log(`[JobFetcher] Saved: ${job.title.substring(0, 50)}...`);
    return true;
  } catch (error) {
    console.error(`[JobFetcher] Error saving job:`, error);
    return false;
  }
}

export async function fetchAllJobs(): Promise<{ fetched: number; saved: number }> {
  console.log("[JobFetcher] Starting job fetch...");
  
  let totalFetched = 0;
  let totalSaved = 0;

  for (const feedConfig of RSS_FEEDS) {
    const jobs = await fetchFeed(feedConfig);
    totalFetched += jobs.length;

    for (const job of jobs) {
      const saved = await saveJob(job);
      if (saved) totalSaved++;
    }
  }

  console.log(`[JobFetcher] Completed: ${totalFetched} fetched, ${totalSaved} new jobs saved`);
  return { fetched: totalFetched, saved: totalSaved };
}

export async function backfillJobDates(): Promise<number> {
  try {
    const jobs = await db
      .select()
      .from(jobAlerts)
      .where(
        and(
          isNull(jobAlerts.applicationStartDate),
          isNull(jobAlerts.applicationEndDate),
          isNull(jobAlerts.examDate)
        )
      );

    let updated = 0;
    for (const job of jobs) {
      if (!job.content && (!job.shortDescription || job.shortDescription.length < 100)) {
        continue;
      }

      const fullText = (job.title || "") + " " + (job.shortDescription || "") + " " + (job.content ? cleanHtml(job.content) : "");
      const dates = extractDates(fullText);

      if (dates.startDate && dates.endDate && dates.startDate > dates.endDate) {
        dates.startDate = null;
      }

      if (dates.startDate || dates.endDate || dates.examDate) {
        await db
          .update(jobAlerts)
          .set({
            applicationStartDate: dates.startDate,
            applicationEndDate: dates.endDate,
            examDate: dates.examDate,
          })
          .where(eq(jobAlerts.id, job.id));
        updated++;
      }
    }

    console.log(`[JobFetcher] Backfilled dates for ${updated} existing jobs`);
    return updated;
  } catch (error) {
    console.error("[JobFetcher] Error backfilling dates:", error);
    return 0;
  }
}

export function startJobFetchScheduler(intervalHours: number = 6) {
  console.log(`[JobFetcher] Scheduler started - will fetch every ${intervalHours} hours`);
  
  fetchAllJobs().catch(console.error);
  
  setInterval(() => {
    fetchAllJobs().catch(console.error);
  }, intervalHours * 60 * 60 * 1000);
}
