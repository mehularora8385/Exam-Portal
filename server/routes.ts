import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated, isAdmin, getUserFromSession } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { testSeries, testQuestions, testAttempts, paymentTransactions, secureExamConfigs, examCenterLinks, secureExamSessions, examCandidates, examShifts, questionPapers, offlineExamPackages, examResponses, exams, examCentersTable, centerExamAssignments, studentExamSessions, centerSyncLogs, sebAdminUsers, sebExams, sebStudents, sebQuestionPapers, sebResponses, sebSettings, pageViews, visitorStats } from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { notificationService } from "./notification-service";
import { jobAlertNotificationService } from "./jobAlertNotificationService";
import { fetchAllJobs } from "./jobFetcher";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);
  registerAuthRoutes(app);

  app.get("/google7b5620d575392a98.html", (req, res) => {
    res.type("text/html").send("google-site-verification: google7b5620d575392a98.html");
  });

  app.get("/job-alerts/google7b5620d575392a98.html", (req, res) => {
    res.type("text/html").send("google-site-verification: google7b5620d575392a98.html");
  });

  // === SITE SETTINGS (Public for reading) ===
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      const settingsMap: Record<string, any> = {};
      settings.forEach(s => { settingsMap[s.key] = s.value; });
      res.json(settingsMap);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      if (!setting) return res.status(404).json({ message: "Setting not found" });
      res.json(setting.value);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Batch update settings (must be before /:key route)
  app.put("/api/settings", isAdmin, async (req, res) => {
    try {
      const settings = req.body;
      for (const [key, value] of Object.entries(settings)) {
        await storage.setSetting(key, value);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Batch settings save error:", error);
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  app.put("/api/settings/:key", isAdmin, async (req, res) => {
    try {
      const key = req.params.key as string;
      const setting = await storage.setSetting(key, req.body.value);
      res.json(setting);
    } catch (error) {
      console.error("Settings save error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === EXAMS (Public) ===
  app.get("/api/exams", async (req, res) => {
    try {
      const allExams = req.query.all === "true" ? await storage.getExams() : await storage.getActiveExams();
      res.json(allExams);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get("/api/exams/:id", async (req, res) => {
    const exam = await storage.getExam(Number(req.params.id));
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  });

  // === NOTICES (Public) ===
  app.get("/api/notices", async (req, res) => {
    try {
      const allNotices = req.query.all === "true" ? await storage.getNotices() : await storage.getActiveNotices();
      res.json(allNotices);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === JOB ALERTS (Public) ===
  app.get("/api/job-alerts", async (req, res) => {
    try {
      let alerts = req.query.all === "true" ? await storage.getJobAlerts() : await storage.getActiveJobAlerts();
      
      // Filter by jobType if specified (GOVERNMENT or PRIVATE)
      const jobType = req.query.jobType as string | undefined;
      if (jobType && (jobType === "GOVERNMENT" || jobType === "PRIVATE")) {
        alerts = alerts.filter(alert => alert.jobType === jobType);
      }
      
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === XML SITEMAP FOR SEO ===
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const jobs = await storage.getActiveJobAlerts();
      const baseUrl = "https://examinationportal.com";
      const today = new Date().toISOString().split('T')[0];
      
      let urls = `
    <url>
      <loc>${baseUrl}/</loc>
      <lastmod>${today}</lastmod>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
    <url>
      <loc>${baseUrl}/job-alerts</loc>
      <lastmod>${today}</lastmod>
      <changefreq>hourly</changefreq>
      <priority>0.9</priority>
    </url>
    <url>
      <loc>${baseUrl}/sitemap-jobs.html</loc>
      <lastmod>${today}</lastmod>
      <changefreq>hourly</changefreq>
      <priority>0.9</priority>
    </url>`;
      
      // Add individual job pages
      jobs.slice(0, 200).forEach((job: any) => {
        const jobDate = job.updatedAt || job.createdAt;
        const lastmod = jobDate ? new Date(jobDate).toISOString().split('T')[0] : today;
        urls += `
    <url>
      <loc>${baseUrl}/job-alerts/${job.slug || job.id}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`;
      });
      
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
      
      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error("Sitemap error:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // === JOB ALERTS SSR/SEO (Crawlable HTML for search engines) ===
  app.get("/sitemap-jobs.html", async (req, res) => {
    try {
      const jobs = await storage.getActiveJobAlerts();
      const lastUpdated = new Date().toLocaleDateString('en-IN', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });
      
      // Category counts
      const latestJobs = jobs.filter((j: any) => j.category === 'LATEST_JOB');
      const results = jobs.filter((j: any) => j.category === 'RESULT');
      const admitCards = jobs.filter((j: any) => j.category === 'ADMIT_CARD');
      const answerKeys = jobs.filter((j: any) => j.category === 'ANSWER_KEY');
      const syllabus = jobs.filter((j: any) => j.category === 'SYLLABUS');
      
      // Generate JobPosting structured data wrapped in @graph
      const jobPostings = jobs.slice(0, 100).map((job: any) => ({
        "@type": "JobPosting",
        "title": job.title || job.postName,
        "description": job.shortDescription || job.title,
        "datePosted": job.createdAt ? new Date(job.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        ...(job.lastDate && { "validThrough": new Date(job.lastDate).toISOString() }),
        "hiringOrganization": {
          "@type": "Organization",
          "name": job.organization || "Government of India"
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "IN",
            "addressRegion": job.state || "India"
          }
        },
        "employmentType": "FULL_TIME",
        ...(job.vacancies && { "totalJobOpenings": job.vacancies })
      }));
      
      const jobPostingSchema = {
        "@context": "https://schema.org",
        "@graph": jobPostings
      };
      
      const escapeHtml = (text: string) => {
        if (!text) return '';
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      };
      
      // Generate job listings HTML
      let jobListHtml = '';
      jobs.slice(0, 100).forEach((job: any) => {
        jobListHtml += `
          <article class="job-item" itemscope itemtype="https://schema.org/JobPosting">
            <h3 itemprop="title"><a href="/job-alerts/${job.id}">${escapeHtml(job.title || job.postName || 'Job Alert')}</a></h3>
            <p itemprop="description">${escapeHtml(job.shortDescription || '')}</p>
            <p><strong>Organization:</strong> <span itemprop="hiringOrganization" itemscope itemtype="https://schema.org/Organization"><span itemprop="name">${escapeHtml(job.organization || 'Government of India')}</span></span></p>
            ${job.vacancies ? `<p><strong>Vacancies:</strong> <span itemprop="totalJobOpenings">${job.vacancies}</span></p>` : ''}
            ${job.qualification ? `<p><strong>Qualification:</strong> <span itemprop="qualifications">${escapeHtml(job.qualification)}</span></p>` : ''}
            ${job.lastDate ? `<p><strong>Last Date:</strong> <time itemprop="validThrough" datetime="${new Date(job.lastDate).toISOString()}">${new Date(job.lastDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</time></p>` : ''}
            <p itemprop="jobLocation" itemscope itemtype="https://schema.org/Place"><strong>Location:</strong> <span itemprop="address" itemscope itemtype="https://schema.org/PostalAddress"><span itemprop="addressRegion">${escapeHtml(job.state || 'India')}</span></span></p>
            <hr>
          </article>`;
      });
      
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Latest Job Alerts 2026 | Government & Private Jobs in India – ExaminationPortal</title>
  <meta name="description" content="Get daily latest job alerts 2026, government jobs in India, Sarkari Naukri notifications, admit cards, results and exam updates. ${jobs.length}+ active jobs available.">
  <meta name="keywords" content="government jobs, sarkari naukri, sarkari result, SSC, UPSC, railway jobs, bank jobs, police jobs, admit card, answer key, free job alert 2026">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://examinationportal.com/sitemap-jobs.html">
  <style>body{font-family:Arial,sans-serif;max-width:1200px;margin:0 auto;padding:20px;}.job-item{margin-bottom:20px;padding:15px;border:1px solid #ddd;border-radius:5px;}h1{color:#ea580c;}h2{color:#333;border-bottom:2px solid #ea580c;padding-bottom:10px;}nav ul{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:10px;}nav a{background:#ea580c;color:#fff;padding:8px 16px;text-decoration:none;border-radius:5px;}</style>
  <script type="application/ld+json">${JSON.stringify(jobPostingSchema)}</script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7620603008087335" crossorigin="anonymous"></script>
</head>
<body>
  <header>
    <h1>Latest Job Alerts 2026 – Government & Private Jobs in India</h1>
    <p><strong>Last Updated:</strong> ${lastUpdated}</p>
    <p><a href="/job-alerts">← Back to RojgarHub Portal</a></p>
  </header>
  
  <section>
    <h2>Welcome to RojgarHub - India's #1 Government Jobs Portal</h2>
    <p>Find the latest government job notifications, Sarkari Naukri updates, SSC, UPSC, Railway, Bank recruitment news. Get daily free job alerts, admit cards, answer keys and exam results for 2026. Apply online for <strong>${jobs.length}+ active job vacancies</strong> across India.</p>
    <p>RojgarHub provides instant notifications for SSC CGL, SSC CHSL, SSC MTS, UPSC Civil Services, IBPS PO, IBPS Clerk, SBI PO, SBI Clerk, Railway RRB NTPC, RRB Group D, State PSC, Police, Defence, Army, Navy, Air Force and all central & state government jobs in India.</p>
  </section>
  
  <nav>
    <h2>Browse Job Categories</h2>
    <ul>
      <li><a href="/job-alerts">All Updates (${jobs.length})</a></li>
      <li><a href="/job-alerts?category=LATEST_JOB">Latest Government Jobs (${latestJobs.length})</a></li>
      <li><a href="/job-alerts?category=RESULT">Exam Results (${results.length})</a></li>
      <li><a href="/job-alerts?category=ADMIT_CARD">Admit Cards (${admitCards.length})</a></li>
      <li><a href="/job-alerts?category=ANSWER_KEY">Answer Keys (${answerKeys.length})</a></li>
      <li><a href="/job-alerts?category=SYLLABUS">Syllabus (${syllabus.length})</a></li>
    </ul>
  </nav>
  
  <main>
    <h2>Government Job Notifications 2026 - All Active Vacancies</h2>
    ${jobListHtml}
  </main>
  
  <section>
    <h2>Why Choose RojgarHub for Government Jobs?</h2>
    <ul>
      <li><strong>Instant Updates:</strong> Get notified immediately when new government jobs are posted</li>
      <li><strong>Complete Information:</strong> Eligibility, last date, application process, and official links</li>
      <li><strong>All India Coverage:</strong> Central government, state government, PSU, railway, bank, police, defence jobs</li>
      <li><strong>Free Service:</strong> 100% free job alerts via email and push notifications</li>
    </ul>
    
    <h2>Frequently Asked Questions About Government Jobs</h2>
    
    <h3>How to apply for government jobs in India 2026?</h3>
    <p>Visit RojgarHub at examinationportal.com/job-alerts to find latest government job notifications. Click on the job you want to apply for, check eligibility criteria including age limit, educational qualification, and apply through the official recruitment portal before the last date.</p>
    
    <h3>What are the latest SSC jobs available?</h3>
    <p>Staff Selection Commission (SSC) conducts various exams like CGL (Combined Graduate Level), CHSL (Combined Higher Secondary Level), MTS (Multi Tasking Staff), GD Constable, Stenographer, and more. Check RojgarHub for latest SSC job notifications, exam dates, admit cards, answer keys, and results.</p>
    
    <h3>How to check government exam results online?</h3>
    <p>Visit RojgarHub Results section to check latest government exam results for SSC, UPSC, Railway, Bank, Police, and other recruitment exams. We provide direct links to official result portals and PDF downloads.</p>
    
    <h3>Where can I download admit cards for government exams?</h3>
    <p>RojgarHub provides admit card download links for all major government exams including SSC CGL, CHSL, UPSC, Railway RRB, Bank IBPS, State PSC, and Police exams. Visit our Admit Card section for latest updates.</p>
    
    <h3>What is the eligibility for bank jobs in India?</h3>
    <p>Bank jobs in India typically require graduation from a recognized university. Age limit is usually 20-30 years with relaxation for reserved categories. Visit RojgarHub to find latest IBPS PO, IBPS Clerk, SBI PO, SBI Clerk, RBI, and other bank job notifications with complete eligibility details.</p>
    
    <h3>How to prepare for government exams?</h3>
    <p>Start with understanding the exam pattern and syllabus available on RojgarHub. Practice previous year papers, take mock tests, and follow a consistent study schedule. Focus on current affairs, quantitative aptitude, reasoning, and English for most competitive exams.</p>
  </section>
  
  <footer>
    <p><strong>RojgarHub - Government Jobs Portal</strong></p>
    <p>Part of ExaminationPortal - India's trusted source for government recruitment updates</p>
    <p><a href="/job-alerts">Go to RojgarHub Interactive Portal</a> | <a href="/">Go to Main Examination Portal</a></p>
  </footer>
</body>
</html>`;
      
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("SSR job alerts error:", error);
      res.status(500).send("Error generating page");
    }
  });

  // === JOB ALERT SUBSCRIPTIONS (Public) - MUST BE BEFORE :id routes ===
  app.post("/api/job-alerts/subscribe", async (req, res) => {
    try {
      const { email, name, categories, states, organizations } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const result = await jobAlertNotificationService.subscribeEmail({
        email,
        name,
        categories,
        states,
        organizations,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Subscribe error:", error);
      res.status(500).json({ message: error.message || "Failed to subscribe" });
    }
  });

  app.get("/api/job-alerts/unsubscribe/:token", async (req, res) => {
    try {
      const result = await jobAlertNotificationService.unsubscribeEmail(req.params.token);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to unsubscribe" });
    }
  });

  app.post("/api/job-alerts/push-subscribe", async (req, res) => {
    try {
      const { endpoint, keys, userAgent, categories } = req.body;
      
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ message: "Invalid push subscription data" });
      }

      const result = await jobAlertNotificationService.subscribePush({
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
        categories,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Push subscribe error:", error);
      res.status(500).json({ message: error.message || "Failed to subscribe to push notifications" });
    }
  });

  app.get("/api/job-alerts/subscriber-stats", isAdmin, async (req, res) => {
    try {
      const stats = await jobAlertNotificationService.getSubscriberStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  app.get("/api/job-alerts/:id", async (req, res) => {
    try {
      const idParam = req.params.id;
      const numericId = Number(idParam);
      let alert;
      if (!isNaN(numericId)) {
        alert = await storage.getJobAlert(numericId);
      } else {
        alert = await storage.getJobAlertBySlug(idParam);
      }
      if (!alert) return res.status(404).json({ message: "Job alert not found" });
      res.json(alert);
    } catch (error) {
      console.error("Get job alert error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/job-alerts/:id/view", async (req, res) => {
    try {
      const idParam = req.params.id;
      const numericId = Number(idParam);
      if (!isNaN(numericId)) {
        await storage.incrementJobAlertViews(numericId);
      } else {
        await storage.incrementJobAlertViewsBySlug(idParam);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Increment view error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/job-alerts", isAdmin, async (req, res) => {
    try {
      const alert = await storage.createJobAlert(req.body);
      
      // Send notifications to subscribers (async - don't wait)
      jobAlertNotificationService.notifyNewJobAlert(alert.id).catch(err => {
        console.error("Failed to send job alert notifications:", err);
      });
      
      res.status(201).json(alert);
    } catch (error) {
      console.error("Create job alert error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put("/api/job-alerts/:id", isAdmin, async (req, res) => {
    try {
      const alert = await storage.updateJobAlert(Number(req.params.id), req.body);
      res.json(alert);
    } catch (error) {
      console.error("Update job alert error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete("/api/job-alerts/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteJobAlert(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Admin: Manually trigger job fetch from RSS feeds
  app.post("/api/job-alerts/fetch-rss", isAdmin, async (req, res) => {
    try {
      const result = await fetchAllJobs();
      res.json({ 
        success: true, 
        message: `Fetched ${result.fetched} jobs, saved ${result.saved} new jobs`,
        ...result 
      });
    } catch (error) {
      console.error("RSS fetch error:", error);
      res.status(500).json({ message: "Failed to fetch jobs from RSS" });
    }
  });

  // === TEST SERIES (Mock Tests for Students) ===
  app.get("/api/test-series", async (req, res) => {
    try {
      const tests = await db.select().from(testSeries).orderBy(testSeries.createdAt);
      res.json(tests);
    } catch (error) {
      console.error("Error fetching test series:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get("/api/test-series/:id", async (req, res) => {
    try {
      const [test] = await db.select().from(testSeries).where(eq(testSeries.id, Number(req.params.id)));
      if (!test) return res.status(404).json({ message: "Test not found" });
      res.json(test);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/test-series", isAdmin, async (req, res) => {
    try {
      const slug = req.body.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const [test] = await db.insert(testSeries).values({
        ...req.body,
        slug,
      }).returning();
      res.status(201).json(test);
    } catch (error) {
      console.error("Error creating test series:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.patch("/api/test-series/:id", isAdmin, async (req, res) => {
    try {
      const [test] = await db.update(testSeries)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(testSeries.id, Number(req.params.id)))
        .returning();
      res.json(test);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete("/api/test-series/:id", isAdmin, async (req, res) => {
    try {
      await db.delete(testSeries).where(eq(testSeries.id, Number(req.params.id)));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === TEST QUESTIONS (Admin manages questions for tests) ===
  app.get("/api/test-series/:id/questions", async (req, res) => {
    try {
      const questions = await db.select().from(testQuestions)
        .where(eq(testQuestions.testSeriesId, Number(req.params.id)))
        .orderBy(testQuestions.questionOrder);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/test-series/:id/questions", isAdmin, async (req, res) => {
    try {
      const testSeriesId = Number(req.params.id);
      const [question] = await db.insert(testQuestions).values({
        ...req.body,
        testSeriesId,
      }).returning();
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/test-series/:id/questions/bulk", isAdmin, async (req, res) => {
    try {
      const testSeriesId = Number(req.params.id);
      const questionsData = req.body.questions.map((q: any, index: number) => ({
        ...q,
        testSeriesId,
        questionOrder: q.questionOrder || index + 1,
      }));
      const questions = await db.insert(testQuestions).values(questionsData).returning();
      res.status(201).json(questions);
    } catch (error) {
      console.error("Error bulk creating questions:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.patch("/api/test-questions/:id", isAdmin, async (req, res) => {
    try {
      const [question] = await db.update(testQuestions)
        .set(req.body)
        .where(eq(testQuestions.id, Number(req.params.id)))
        .returning();
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete("/api/test-questions/:id", isAdmin, async (req, res) => {
    try {
      await db.delete(testQuestions).where(eq(testQuestions.id, Number(req.params.id)));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === TEST ATTEMPTS (User takes tests - No login required) ===
  
  // Start a new test attempt
  app.post("/api/test-series/:id/start", async (req, res) => {
    try {
      const testSeriesId = Number(req.params.id);
      const { paymentId } = req.body;
      
      // Get test details
      const [test] = await db.select().from(testSeries).where(eq(testSeries.id, testSeriesId));
      if (!test) return res.status(404).json({ message: "Test not found" });
      
      // Check payment for paid tests
      if (!test.isFree) {
        if (!paymentId) {
          return res.status(403).json({ message: "Payment required to start this test" });
        }
        const payment = await storage.getPaymentTransaction(paymentId);
        if (!payment || payment.status !== "SUCCESS" || payment.testSeriesId !== testSeriesId) {
          return res.status(403).json({ message: "Valid payment required to start this test" });
        }
      }
      
      // Check if test has questions
      const questions = await db.select().from(testQuestions)
        .where(eq(testQuestions.testSeriesId, testSeriesId));
      if (questions.length === 0) {
        return res.status(400).json({ message: "This test has no questions yet. Please check back later." });
      }
      
      // Generate session ID if not provided
      const sessionId = req.body.sessionId || `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create new attempt
      const [attempt] = await db.insert(testAttempts).values({
        testSeriesId,
        sessionId,
        candidateName: req.body.candidateName || null,
        candidateEmail: req.body.candidateEmail || null,
        candidateMobile: req.body.candidateMobile || null,
        status: "IN_PROGRESS",
        totalQuestions: questions.length,
        totalMarks: test.totalMarks,
        answers: {},
        bookmarkedQuestions: [],
      }).returning();
      
      // Increment attempt count
      await db.update(testSeries)
        .set({ attemptCount: sql`${testSeries.attemptCount} + 1` })
        .where(eq(testSeries.id, testSeriesId));
      
      // Return attempt ID and questions (without correct answers)
      const questionsForTest = questions.map(q => ({
        id: q.id,
        paragraph: q.paragraph,
        paragraphImage: q.paragraphImage,
        questionText: q.questionText,
        questionImage: q.questionImage,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        optionAImage: q.optionAImage,
        optionBImage: q.optionBImage,
        optionCImage: q.optionCImage,
        optionDImage: q.optionDImage,
        section: q.section,
        marks: q.marks,
        questionOrder: q.questionOrder,
      }));
      
      res.status(201).json({
        attemptId: attempt.id,
        sessionId,
        test: {
          id: test.id,
          title: test.title,
          duration: test.duration,
          totalQuestions: questions.length,
          totalMarks: test.totalMarks,
          negativeMarking: test.negativeMarking,
          sections: test.sections,
          instructions: test.instructions,
        },
        questions: questionsForTest,
        startedAt: attempt.startedAt,
      });
    } catch (error) {
      console.error("Error starting test:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Save answer during test
  app.patch("/api/test-attempts/:id/answer", async (req, res) => {
    try {
      const attemptId = Number(req.params.id);
      const { questionId, answer, bookmarked, timeSpent } = req.body;
      
      // Get current attempt
      const [attempt] = await db.select().from(testAttempts).where(eq(testAttempts.id, attemptId));
      if (!attempt) return res.status(404).json({ message: "Attempt not found" });
      if (attempt.status !== "IN_PROGRESS") return res.status(400).json({ message: "Test already submitted" });
      
      // Update answers
      const currentAnswers = (attempt.answers || {}) as Record<string, string | null>;
      currentAnswers[questionId] = answer;
      
      // Update bookmarks
      let bookmarks = (attempt.bookmarkedQuestions || []) as number[];
      if (bookmarked === true && !bookmarks.includes(questionId)) {
        bookmarks.push(questionId);
      } else if (bookmarked === false) {
        bookmarks = bookmarks.filter(id => id !== questionId);
      }
      
      await db.update(testAttempts)
        .set({ 
          answers: currentAnswers, 
          bookmarkedQuestions: bookmarks,
          timeSpent: timeSpent || attempt.timeSpent,
        })
        .where(eq(testAttempts.id, attemptId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving answer:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Submit test
  app.post("/api/test-attempts/:id/submit", async (req, res) => {
    try {
      const attemptId = Number(req.params.id);
      const { timeSpent } = req.body;
      
      // Get attempt
      const [attempt] = await db.select().from(testAttempts).where(eq(testAttempts.id, attemptId));
      if (!attempt) return res.status(404).json({ message: "Attempt not found" });
      if (attempt.status !== "IN_PROGRESS") return res.status(400).json({ message: "Test already submitted" });
      
      // Get test details
      const [test] = await db.select().from(testSeries).where(eq(testSeries.id, attempt.testSeriesId));
      
      // Get questions with correct answers
      const questions = await db.select().from(testQuestions)
        .where(eq(testQuestions.testSeriesId, attempt.testSeriesId));
      
      // Calculate results
      const answers = (attempt.answers || {}) as Record<string, string | null>;
      let correct = 0;
      let incorrect = 0;
      let unanswered = 0;
      let marksObtained = 0;
      const negativeMarks = parseFloat(test?.negativeMarking || "0.25");
      
      const sectionResults: Record<string, { attempted: number; correct: number; incorrect: number; marks: number }> = {};
      
      questions.forEach(q => {
        const userAnswer = answers[q.id.toString()];
        const section = q.section || "General";
        
        if (!sectionResults[section]) {
          sectionResults[section] = { attempted: 0, correct: 0, incorrect: 0, marks: 0 };
        }
        
        if (!userAnswer) {
          unanswered++;
        } else {
          sectionResults[section].attempted++;
          if (userAnswer === q.correctAnswer) {
            correct++;
            marksObtained += q.marks || 2;
            sectionResults[section].correct++;
            sectionResults[section].marks += q.marks || 2;
          } else {
            incorrect++;
            marksObtained -= negativeMarks;
            sectionResults[section].incorrect++;
            sectionResults[section].marks -= negativeMarks;
          }
        }
      });
      
      const percentage = ((marksObtained / (test?.totalMarks || 200)) * 100).toFixed(2);
      
      // Update attempt with results
      const [updatedAttempt] = await db.update(testAttempts)
        .set({
          status: "SUBMITTED",
          submittedAt: new Date(),
          timeSpent: timeSpent || attempt.timeSpent,
          attempted: correct + incorrect,
          correct,
          incorrect,
          unanswered,
          marksObtained: Math.round(marksObtained), // Round to integer for database
          percentage,
          sectionResults: Object.entries(sectionResults).map(([section, data]) => ({
            section,
            attempted: data.attempted,
            correct: data.correct,
            incorrect: data.incorrect,
            marks: Math.round(data.marks), // Round section marks too
          })),
        })
        .where(eq(testAttempts.id, attemptId))
        .returning();
      
      // Return results with correct answers for review
      const questionsWithAnswers = questions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        questionImage: q.questionImage,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        section: q.section,
        marks: q.marks,
        userAnswer: answers[q.id.toString()] || null,
        isCorrect: answers[q.id.toString()] === q.correctAnswer,
      }));
      
      res.json({
        result: {
          totalQuestions: questions.length,
          attempted: correct + incorrect,
          correct,
          incorrect,
          unanswered,
          marksObtained: Math.round(marksObtained * 100) / 100,
          totalMarks: test?.totalMarks || 200,
          percentage,
          timeSpent: updatedAttempt.timeSpent,
          sectionResults: updatedAttempt.sectionResults,
        },
        questions: questionsWithAnswers,
      });
    } catch (error) {
      console.error("Error submitting test:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get attempt result (for viewing after submission)
  app.get("/api/test-attempts/:id", async (req, res) => {
    try {
      const attemptId = Number(req.params.id);
      const [attempt] = await db.select().from(testAttempts).where(eq(testAttempts.id, attemptId));
      if (!attempt) return res.status(404).json({ message: "Attempt not found" });
      
      // Get test details
      const [test] = await db.select().from(testSeries).where(eq(testSeries.id, attempt.testSeriesId));
      
      // If submitted, include questions with answers
      if (attempt.status === "SUBMITTED") {
        const questions = await db.select().from(testQuestions)
          .where(eq(testQuestions.testSeriesId, attempt.testSeriesId));
        const answers = (attempt.answers || {}) as Record<string, string | null>;
        
        const questionsWithAnswers = questions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          questionImage: q.questionImage,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          section: q.section,
          marks: q.marks,
          userAnswer: answers[q.id.toString()] || null,
          isCorrect: answers[q.id.toString()] === q.correctAnswer,
        }));
        
        res.json({
          attempt,
          test,
          questions: questionsWithAnswers,
        });
      } else {
        res.json({ attempt, test });
      }
    } catch (error) {
      console.error("Error fetching attempt:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === TEST SERIES PAYMENTS (No auth required - for guest users) ===
  
  // Create payment for paid test series
  app.post("/api/test-series/:id/payment/create", async (req, res) => {
    try {
      const testSeriesId = Number(req.params.id);
      const { email, mobile, name } = req.body;
      
      // Get test details
      const [test] = await db.select().from(testSeries).where(eq(testSeries.id, testSeriesId));
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Check if test is free
      if (test.isFree) {
        return res.json({ 
          success: true, 
          isFree: true, 
          message: "This test is free. You can start it directly." 
        });
      }
      
      const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
      const razorpayConfigured = razorpayKeyId && razorpayKeySecret;
      
      // Generate transaction IDs
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
      const transactionId = `TEST${timestamp}${randomStr}`;
      
      let orderId = `ORD${timestamp}${randomStr}`;
      let mode = "DEMO";
      
      // Create Razorpay order if credentials are available
      if (razorpayConfigured) {
        try {
          const Razorpay = require("razorpay");
          const razorpay = new Razorpay({
            key_id: razorpayKeyId,
            key_secret: razorpayKeySecret
          });
          
          const razorpayOrder = await razorpay.orders.create({
            amount: Math.round((test.price || 0) * 100), // Amount in paise
            currency: "INR",
            receipt: transactionId,
            notes: {
              type: "TEST_SERIES",
              testSeriesId: testSeriesId.toString(),
              testTitle: test.title,
              customerName: name || "",
              customerEmail: email || "",
              customerMobile: mobile || ""
            }
          });
          
          orderId = razorpayOrder.id;
          mode = "RAZORPAY";
          console.log(`[Test Payment] Razorpay order created: ${orderId}`);
        } catch (razorpayError: any) {
          console.error("[Test Payment] Razorpay order creation failed:", razorpayError.message);
          mode = "DEMO";
        }
      }
      
      // Create payment record
      const payment = await storage.createPaymentTransaction({
        testSeriesId,
        transactionId,
        orderId,
        paymentGateway: mode,
        amount: Math.round((test.price || 0) * 100), // Store in paise
        currency: "INR",
        status: "PENDING",
        gatewayResponse: { 
          type: "TEST_SERIES", 
          testTitle: test.title,
          customerName: name,
          customerEmail: email,
          customerMobile: mobile 
        },
      });
      
      res.json({
        success: true,
        paymentId: payment.id,
        transactionId,
        orderId,
        amount: test.price,
        currency: "INR",
        mode,
        razorpayKeyId: mode === "RAZORPAY" ? razorpayKeyId : null,
        testTitle: test.title,
        message: mode === "RAZORPAY" 
          ? "Razorpay order created successfully" 
          : "Payment created in demo mode. Click 'Simulate Payment' to proceed."
      });
    } catch (error) {
      console.error("Test payment creation error:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });
  
  // Verify Razorpay payment for test series
  app.post("/api/test-series/:id/payment/verify", async (req, res) => {
    try {
      const testSeriesId = Number(req.params.id);
      const { paymentId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
      
      // Get payment record
      const payment = await storage.getPaymentTransaction(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Verify signature if Razorpay mode
      if (payment.paymentGateway === "RAZORPAY" && razorpay_signature) {
        const crypto = require("crypto");
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
        
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac("sha256", razorpayKeySecret)
          .update(body.toString())
          .digest("hex");
        
        if (expectedSignature !== razorpay_signature) {
          await storage.updatePaymentTransaction(paymentId, {
            status: "FAILED",
            gatewayResponse: {
              ...((payment.gatewayResponse as any) || {}),
              error: "Signature verification failed"
            }
          });
          return res.status(400).json({ message: "Payment verification failed" });
        }
      }
      
      // Update payment status
      await storage.updatePaymentTransaction(paymentId, {
        status: "SUCCESS",
        paymentMethod: razorpay_payment_id ? "RAZORPAY" : "DEMO",
        paidAt: new Date(),
        gatewayResponse: {
          ...((payment.gatewayResponse as any) || {}),
          razorpay_payment_id,
          razorpay_order_id,
          verifiedAt: new Date().toISOString()
        }
      });
      
      console.log(`[Test Payment] Payment verified for test ${testSeriesId}`);
      
      res.json({
        success: true,
        message: "Payment verified successfully. You can now start the test."
      });
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ message: "Payment verification failed" });
    }
  });
  
  // Simulate payment completion for demo mode
  app.post("/api/test-series/:id/payment/simulate", async (req, res) => {
    try {
      const { paymentId } = req.body;
      
      const payment = await storage.getPaymentTransaction(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Update payment as successful
      await storage.updatePaymentTransaction(paymentId, {
        status: "SUCCESS",
        paymentMethod: "DEMO",
        paidAt: new Date(),
        gatewayResponse: {
          ...((payment.gatewayResponse as any) || {}),
          demoMode: true,
          simulatedAt: new Date().toISOString()
        }
      });
      
      res.json({
        success: true,
        message: "Payment simulated successfully. You can now start the test."
      });
    } catch (error) {
      console.error("Payment simulation error:", error);
      res.status(500).json({ message: "Payment simulation failed" });
    }
  });
  
  // Check if user has paid for a test
  app.get("/api/test-series/:id/payment/check", async (req, res) => {
    try {
      const testSeriesId = Number(req.params.id);
      const email = req.query.email as string;
      const mobile = req.query.mobile as string;
      
      // Get test details
      const [test] = await db.select().from(testSeries).where(eq(testSeries.id, testSeriesId));
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // If test is free, return true
      if (test.isFree) {
        return res.json({ hasPaid: true, isFree: true });
      }
      
      // Check for successful payment with matching email or mobile
      const payments = await db.select().from(paymentTransactions)
        .where(and(
          eq(paymentTransactions.testSeriesId, testSeriesId),
          eq(paymentTransactions.status, "SUCCESS")
        ));
      
      const hasPaid = payments.some(p => {
        const response = p.gatewayResponse as any;
        return (email && response?.customerEmail === email) ||
               (mobile && response?.customerMobile === mobile);
      });
      
      res.json({ hasPaid, isFree: false, price: test.price });
    } catch (error) {
      console.error("Payment check error:", error);
      res.status(500).json({ message: "Failed to check payment" });
    }
  });

  // === PROFILE (Authenticated Candidate) ===
  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    const user = await getUserFromSession(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    
    const profile = await storage.getProfile(user.id);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  });

  app.post("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromSession(req);
      if (!user) return res.status(401).json({ message: "Not authenticated" });

      const profile = await storage.createProfile({ ...req.body, userId: user.id });
      res.status(201).json(profile);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromSession(req);
      if (!user) return res.status(401).json({ message: "Not authenticated" });

      const profile = await storage.updateProfile(user.id, req.body);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === APPLICATIONS (Authenticated Candidate) ===
  app.get("/api/applications", isAuthenticated, async (req: any, res) => {
    const user = await getUserFromSession(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    const apps = await storage.getApplications(user.id);
    res.json(apps);
  });

  app.post("/api/applications", isAuthenticated, async (req: any, res) => {
    try {
      const user = await getUserFromSession(req);
      if (!user) return res.status(401).json({ message: "Not authenticated" });

      const profile = await storage.getProfile(user.id);
      if (!profile) {
        return res.status(400).json({ message: "Please complete your profile first." });
      }

      const existingApps = await storage.getApplications(user.id);
      const alreadyApplied = existingApps.find(a => a.examId === req.body.examId);
      if (alreadyApplied) {
        return res.status(400).json({ message: "You have already applied for this exam." });
      }

      // Get exam details for roll number generation
      const exam = await storage.getExam(req.body.examId);
      const examCode = exam?.code || 'EXAM';
      const year = new Date().getFullYear();
      
      // Generate secure unique roll number with collision detection
      const crypto = await import('crypto');
      let rollNumber: string;
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        // Use crypto for secure random generation
        const randomBytes = crypto.randomBytes(4);
        const rollSeq = (randomBytes.readUInt32BE(0) % 900000) + 100000; // 6-digit secure random
        rollNumber = `${examCode}-${year}-${rollSeq}`;
        
        // Check for uniqueness
        const existing = await storage.getApplicationByRollNumber(rollNumber);
        if (!existing) break;
        attempts++;
      } while (attempts < maxAttempts);
      
      if (attempts >= maxAttempts) {
        return res.status(500).json({ message: "Failed to generate unique roll number. Please try again." });
      }
      
      const app = await storage.createApplication({
        ...req.body,
        candidateId: profile.id,
        submittedAt: new Date(),
        status: "SUBMITTED",
        rollNumber
      });
      res.status(201).json(app);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get("/api/applications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const app = await storage.getApplication(Number(req.params.id));
      if (!app) return res.status(404).json({ message: "Application not found" });
      
      // Security: Verify ownership - only the candidate who owns this application or admin can view
      const profile = await storage.getProfile(req.user.id);
      const isOwner = profile && app.candidateId === profile.id;
      const isAdminUser = req.user.role === "admin";
      if (!isOwner && !isAdminUser) {
        return res.status(403).json({ message: "Unauthorized: You can only view your own applications" });
      }
      
      res.json(app);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === ADMIN ROUTES ===
  
  // Exams CRUD
  app.post("/api/exams", isAdmin, async (req, res) => {
    try {
      const exam = await storage.createExam(req.body);
      res.status(201).json(exam);
    } catch (error) {
      console.error("Error creating exam:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put("/api/exams/:id", isAdmin, async (req, res) => {
    try {
      const exam = await storage.updateExam(Number(req.params.id), req.body);
      res.json(exam);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete("/api/exams/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteExam(Number(req.params.id));
      res.json({ message: "Exam deleted" });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === SEB CONFIGURATION ROUTES ===
  
  // Get SEB config for an exam
  app.get("/api/admin/seb-config/:examId", isAdmin, async (req, res) => {
    try {
      const examId = Number(req.params.examId);
      const [config] = await db.select().from(secureExamConfigs).where(eq(secureExamConfigs.examId, examId));
      res.json(config || null);
    } catch (error) {
      console.error("Error fetching SEB config:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Save SEB config for an exam
  app.post("/api/admin/seb-config/:examId", isAdmin, async (req, res) => {
    try {
      const examId = Number(req.params.examId);
      
      // Validate input
      const sebConfigSchema = z.object({
        sebEnabled: z.boolean().optional(),
        sebConfigKey: z.string().optional(),
        sebVersion: z.string().optional(),
        allowedBrowsers: z.object({
          seb: z.boolean().optional(),
          chrome: z.boolean().optional(),
          custom: z.boolean().optional(),
          customBrowserName: z.string().optional(),
          customBrowserAgent: z.string().optional(),
        }).optional(),
        lockdownSettings: z.object({
          disableRightClick: z.boolean().optional(),
          disableCopyPaste: z.boolean().optional(),
          disablePrintScreen: z.boolean().optional(),
          disableTaskSwitching: z.boolean().optional(),
          fullScreenMode: z.boolean().optional(),
          enableWebcamProctoring: z.boolean().optional(),
          disableMicrophone: z.boolean().optional(),
          quitPassword: z.string().optional(),
          adminPassword: z.string().optional(),
        }).optional(),
        sessionSettings: z.object({
          maxAttempts: z.number().optional(),
          sessionTimeout: z.number().optional(),
          autoSubmitOnTimeout: z.boolean().optional(),
          allowResume: z.boolean().optional(),
          singleDeviceLogin: z.boolean().optional(),
          requireCenterToken: z.boolean().optional(),
          ipRestriction: z.boolean().optional(),
        }).optional(),
        examWindow: z.object({
          width: z.number().optional(),
          height: z.number().optional(),
          resizable: z.boolean().optional(),
          toolbarVisible: z.boolean().optional(),
          statusBarVisible: z.boolean().optional(),
          allowZoom: z.boolean().optional(),
        }).optional(),
        isActive: z.boolean().optional(),
      });
      
      const validatedData = sebConfigSchema.parse(req.body);
      const { sebEnabled, sebConfigKey, sebVersion, allowedBrowsers, lockdownSettings, sessionSettings, examWindow, isActive } = validatedData;
      
      // Check if config exists
      const [existingConfig] = await db.select().from(secureExamConfigs).where(eq(secureExamConfigs.examId, examId));
      
      if (existingConfig) {
        // Update existing
        const [updated] = await db.update(secureExamConfigs)
          .set({
            sebEnabled,
            sebConfigKey,
            sebVersion,
            allowedBrowsers,
            lockdownSettings,
            sessionSettings,
            examWindow,
            isActive,
            updatedAt: new Date(),
          })
          .where(eq(secureExamConfigs.examId, examId))
          .returning();
        res.json(updated);
      } else {
        // Create new
        const [created] = await db.insert(secureExamConfigs).values({
          examId,
          sebEnabled,
          sebConfigKey,
          sebVersion,
          allowedBrowsers,
          lockdownSettings,
          sessionSettings,
          examWindow,
          isActive,
        }).returning();
        res.status(201).json(created);
      }
    } catch (error) {
      console.error("Error saving SEB config:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === EXAM CENTER LINKS ROUTES ===
  
  // Get all center links for an exam
  app.get("/api/admin/exam-center-links/:examId", isAdmin, async (req, res) => {
    try {
      const examId = Number(req.params.examId);
      const links = await db.select().from(examCenterLinks).where(eq(examCenterLinks.examId, examId));
      res.json(links);
    } catch (error) {
      console.error("Error fetching center links:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Create a new center link
  app.post("/api/admin/exam-center-links", isAdmin, async (req, res) => {
    try {
      // Validate input
      const centerLinkSchema = z.object({
        examId: z.number(),
        centerCode: z.string().min(1),
        centerName: z.string().min(1),
        centerAddress: z.string().optional(),
        centerCity: z.string().optional(),
        centerState: z.string().optional(),
        labDetails: z.object({
          labNumber: z.string().optional(),
          totalSeats: z.number().optional(),
          ipRange: z.string().optional(),
          labIncharge: z.string().optional(),
          labInchargeContact: z.string().optional(),
        }).optional(),
        shiftDetails: z.object({
          shiftNumber: z.number().optional(),
          shiftName: z.string().optional(),
          reportingTime: z.string().optional(),
          examStartTime: z.string().optional(),
          examEndTime: z.string().optional(),
          gateClosingTime: z.string().optional(),
        }).optional(),
        maxUsage: z.number().optional(),
      });
      
      const validatedData = centerLinkSchema.parse(req.body);
      const { examId, centerCode, centerName, centerAddress, centerCity, centerState, labDetails, shiftDetails, maxUsage } = validatedData;
      
      // Generate cryptographically secure unique access token
      const accessToken = `${centerCode}-${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`;
      
      const [link] = await db.insert(examCenterLinks).values({
        examId,
        centerCode,
        centerName,
        centerAddress,
        centerCity,
        centerState,
        accessToken,
        labDetails,
        shiftDetails,
        maxUsage,
        status: "ACTIVE",
        usageCount: 0,
      }).returning();
      
      res.status(201).json(link);
    } catch (error) {
      console.error("Error creating center link:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Update center link
  app.put("/api/admin/exam-center-links/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { centerName, centerAddress, centerCity, centerState, labDetails, shiftDetails, status, maxUsage } = req.body;
      
      const [updated] = await db.update(examCenterLinks)
        .set({
          centerName,
          centerAddress,
          centerCity,
          centerState,
          labDetails,
          shiftDetails,
          status,
          maxUsage,
          updatedAt: new Date(),
        })
        .where(eq(examCenterLinks.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating center link:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Regenerate access token
  app.post("/api/admin/exam-center-links/:id/regenerate-token", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [link] = await db.select().from(examCenterLinks).where(eq(examCenterLinks.id, id));
      
      if (!link) {
        return res.status(404).json({ message: "Center link not found" });
      }
      
      const newToken = `${link.centerCode}-${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`;
      
      const [updated] = await db.update(examCenterLinks)
        .set({ accessToken: newToken, updatedAt: new Date() })
        .where(eq(examCenterLinks.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Error regenerating token:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Delete center link
  app.delete("/api/admin/exam-center-links/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      await db.delete(examCenterLinks).where(eq(examCenterLinks.id, id));
      res.json({ message: "Center link deleted" });
    } catch (error) {
      console.error("Error deleting center link:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === SECURE EXAM SESSION ROUTES ===
  
  // Get active sessions for an exam
  app.get("/api/admin/exam-sessions/:examId", isAdmin, async (req, res) => {
    try {
      const examId = Number(req.params.examId);
      const sessions = await db.select().from(secureExamSessions).where(eq(secureExamSessions.examId, examId));
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching exam sessions:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Terminate a session
  app.post("/api/admin/exam-sessions/:id/terminate", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { reason } = req.body;
      
      const [updated] = await db.update(secureExamSessions)
        .set({
          status: "TERMINATED",
          terminationReason: reason || "Terminated by admin",
          terminatedBy: "ADMIN",
          endTime: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(secureExamSessions.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Error terminating session:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === EXAM DATA MANAGEMENT ROUTES ===
  
  // Get exam candidates
  app.get("/api/admin/exam-candidates/:examId", isAdmin, async (req, res) => {
    try {
      const examId = Number(req.params.examId);
      const candidates = await db.select().from(examCandidates).where(eq(examCandidates.examId, examId));
      res.json(candidates);
    } catch (error) {
      console.error("Error fetching exam candidates:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Upload exam candidates (CSV)
  app.post("/api/admin/exam-candidates/:examId/upload", isAdmin, async (req, res) => {
    try {
      const examId = Number(req.params.examId);
      
      // For simplicity, accept JSON array of candidates
      // In production, would parse CSV file
      const candidatesData = req.body.candidates || [];
      
      if (!Array.isArray(candidatesData) || candidatesData.length === 0) {
        return res.status(400).json({ message: "No candidates data provided" });
      }
      
      let imported = 0;
      for (const candidate of candidatesData) {
        await db.insert(examCandidates).values({
          examId,
          registrationNumber: candidate.registration_number || candidate.registrationNumber,
          rollNumber: candidate.roll_number || candidate.rollNumber,
          candidateName: candidate.candidate_name || candidate.candidateName || candidate.name,
          fatherName: candidate.father_name || candidate.fatherName,
          motherName: candidate.mother_name || candidate.motherName,
          dob: candidate.dob,
          gender: candidate.gender,
          category: candidate.category,
          mobile: candidate.mobile,
          email: candidate.email,
        });
        imported++;
      }
      
      res.json({ imported, message: `${imported} candidates imported successfully` });
    } catch (error) {
      console.error("Error uploading candidates:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get exam shifts
  app.get("/api/admin/exam-shifts/:examId", isAdmin, async (req, res) => {
    try {
      const examId = Number(req.params.examId);
      const shiftsData = await db.select().from(examShifts).where(eq(examShifts.examId, examId));
      res.json(shiftsData);
    } catch (error) {
      console.error("Error fetching exam shifts:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Create exam shift
  app.post("/api/admin/exam-shifts", isAdmin, async (req, res) => {
    try {
      const shiftSchema = z.object({
        examId: z.number(),
        shiftNumber: z.number(),
        shiftName: z.string(),
        shiftDate: z.string(),
        reportingTime: z.string(),
        gateClosingTime: z.string().optional(),
        examStartTime: z.string(),
        examEndTime: z.string(),
        examDurationMinutes: z.number().optional(),
        totalSeats: z.number().optional(),
      });
      
      const validatedData = shiftSchema.parse(req.body);
      
      const [shift] = await db.insert(examShifts).values({
        ...validatedData,
        status: "SCHEDULED",
      }).returning();
      
      res.json(shift);
    } catch (error) {
      console.error("Error creating exam shift:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get question papers
  app.get("/api/admin/question-papers/:examId", isAdmin, async (req, res) => {
    try {
      const examId = Number(req.params.examId);
      const papers = await db.select().from(questionPapers).where(eq(questionPapers.examId, examId));
      res.json(papers);
    } catch (error) {
      console.error("Error fetching question papers:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Upload and encrypt question paper
  app.post("/api/admin/question-papers", isAdmin, async (req, res) => {
    try {
      const paperSchema = z.object({
        examId: z.number(),
        paperCode: z.string(),
        paperName: z.string(),
        language: z.string().optional(),
        version: z.string().optional(),
        totalQuestions: z.number().optional(),
        totalMarks: z.number().optional(),
        negativeMarking: z.boolean().optional(),
        negativeMarkValue: z.string().optional(),
        questionsJson: z.string().optional(),
      });
      
      const validatedData = paperSchema.parse(req.body);
      
      // Encrypt the questions JSON using AES-256
      let encryptedData = null;
      let encryptionKey = null;
      let encryptionIv = null;
      let dataHash = null;
      
      if (validatedData.questionsJson) {
        const key = crypto.randomBytes(32); // 256-bit key
        const iv = crypto.randomBytes(16); // 128-bit IV
        
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(validatedData.questionsJson, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        
        encryptedData = encrypted;
        encryptionKey = key.toString('base64');
        encryptionIv = iv.toString('base64');
        dataHash = crypto.createHash('sha256').update(validatedData.questionsJson).digest('hex');
      }
      
      const [paper] = await db.insert(questionPapers).values({
        examId: validatedData.examId,
        paperCode: validatedData.paperCode,
        paperName: validatedData.paperName,
        language: validatedData.language || "English",
        version: validatedData.version || "A",
        totalQuestions: validatedData.totalQuestions,
        totalMarks: validatedData.totalMarks,
        negativeMarking: validatedData.negativeMarking ?? true,
        negativeMarkValue: validatedData.negativeMarkValue || "0.25",
        encryptedData,
        encryptionKey,
        encryptionIv,
        dataHash,
        isActive: false,
      }).returning();
      
      res.json({ ...paper, message: "Question paper encrypted and stored successfully" });
    } catch (error) {
      console.error("Error uploading question paper:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get offline packages
  app.get("/api/admin/offline-packages/:examId", isAdmin, async (req, res) => {
    try {
      const examId = Number(req.params.examId);
      const pkgs = await db.select().from(offlineExamPackages).where(eq(offlineExamPackages.examId, examId));
      res.json(pkgs);
    } catch (error) {
      console.error("Error fetching offline packages:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Generate offline exam package
  app.post("/api/admin/offline-packages/generate", isAdmin, async (req, res) => {
    try {
      const { examId, shiftId } = req.body;
      
      if (!examId) {
        return res.status(400).json({ message: "Exam ID is required" });
      }
      
      // Get exam details
      const [exam] = await db.select().from(exams).where(eq(exams.id, examId));
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Get candidates for this exam/shift
      let candidatesQuery = db.select().from(examCandidates).where(eq(examCandidates.examId, examId));
      if (shiftId) {
        candidatesQuery = candidatesQuery.where(eq(examCandidates.shiftId, shiftId));
      }
      const candidatesData = await candidatesQuery;
      
      // Get question papers
      const papers = await db.select().from(questionPapers).where(eq(questionPapers.examId, examId));
      
      // Generate package code
      const packageCode = `${exam.code || 'EXAM'}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      
      const [pkg] = await db.insert(offlineExamPackages).values({
        examId,
        shiftId,
        packageCode,
        packageName: `${exam.title} - Offline Package`,
        contents: {
          questionPaperIds: papers.map(p => p.id),
          candidateCount: candidatesData.length,
          includesPhotos: false,
          includesSignatures: false,
          totalSize: 0,
        },
        status: "READY",
      }).returning();
      
      res.json({ ...pkg, message: "Offline package generated successfully" });
    } catch (error) {
      console.error("Error generating offline package:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Sync exam responses from offline mode
  app.post("/api/admin/offline-packages/:packageId/sync", isAdmin, async (req, res) => {
    try {
      const packageId = Number(req.params.packageId);
      const { responses } = req.body;
      
      if (!Array.isArray(responses)) {
        return res.status(400).json({ message: "Responses array is required" });
      }
      
      // Get the package
      const [pkg] = await db.select().from(offlineExamPackages).where(eq(offlineExamPackages.id, packageId));
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      let synced = 0;
      for (const response of responses) {
        await db.insert(examResponses).values({
          examId: pkg.examId,
          candidateId: response.candidateId,
          questionPaperId: response.questionPaperId,
          responses: response.answers,
          totalAnswered: response.totalAnswered,
          totalMarkedForReview: response.totalMarkedForReview,
          totalNotVisited: response.totalNotVisited,
          examStartTime: response.examStartTime ? new Date(response.examStartTime) : null,
          examEndTime: response.examEndTime ? new Date(response.examEndTime) : null,
          totalTimeTaken: response.totalTimeTaken,
          submittedAt: response.submittedAt ? new Date(response.submittedAt) : new Date(),
          submissionType: response.submissionType || "OFFLINE_SYNC",
          offlineRecorded: true,
          syncedAt: new Date(),
        });
        synced++;
      }
      
      // Update package sync status
      await db.update(offlineExamPackages)
        .set({ 
          syncStatus: "SYNCED", 
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(offlineExamPackages.id, packageId));
      
      res.json({ synced, message: `${synced} responses synced successfully` });
    } catch (error) {
      console.error("Error syncing responses:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === PUBLIC SECURE EXAM ROUTES (for candidates at exam centers) ===
  
  // Validate access token and get center link details
  app.get("/api/secure-exam/validate-token/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      const [link] = await db.select().from(examCenterLinks).where(eq(examCenterLinks.accessToken, token));
      
      if (!link) {
        return res.status(404).json({ message: "Invalid access token" });
      }
      
      if (!link.isActive) {
        return res.status(403).json({ message: "This access link has been deactivated" });
      }
      
      if (link.tokenExpiresAt && new Date(link.tokenExpiresAt) < new Date()) {
        return res.status(403).json({ message: "This access link has expired" });
      }
      
      if (link.maxUsage && link.usageCount && link.usageCount >= link.maxUsage) {
        return res.status(403).json({ message: "This access link has reached maximum usage" });
      }
      
      // Get exam details
      const [exam] = await db.select().from(exams).where(eq(exams.id, link.examId));
      
      // Get SEB config
      const [sebConfig] = await db.select().from(secureExamConfigs).where(eq(secureExamConfigs.examId, link.examId));
      
      res.json({
        ...link,
        exam: exam || null,
        sebConfig: sebConfig || null
      });
    } catch (error) {
      console.error("Error validating access token:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  // Start secure exam session
  app.post("/api/secure-exam/start-session", async (req, res) => {
    try {
      const sessionSchema = z.object({
        accessToken: z.string().min(1),
        candidateId: z.string().min(1),
        rollNumber: z.string().min(1),
      });
      
      const validatedData = sessionSchema.parse(req.body);
      const { accessToken, candidateId, rollNumber } = validatedData;
      
      // Validate access token
      const [link] = await db.select().from(examCenterLinks).where(eq(examCenterLinks.accessToken, accessToken));
      
      if (!link || !link.isActive) {
        return res.status(403).json({ message: "Invalid or inactive access link" });
      }
      
      // Get SEB config for session settings
      const [sebConfig] = await db.select().from(secureExamConfigs).where(eq(secureExamConfigs.examId, link.examId));
      
      // Check for existing active sessions if single device login is enabled
      if (sebConfig?.sessionSettings?.singleDeviceLogin) {
        const existingSession = await db.select()
          .from(secureExamSessions)
          .where(and(
            eq(secureExamSessions.candidateId, candidateId),
            eq(secureExamSessions.examId, link.examId),
            eq(secureExamSessions.status, "ACTIVE")
          ));
        
        if (existingSession.length > 0) {
          return res.status(403).json({ 
            message: "An active session already exists for this candidate. Only one device is allowed." 
          });
        }
      }
      
      // Create unique session ID
      const sessionId = crypto.randomUUID();
      
      // Get client IP
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      
      // Create session
      const [session] = await db.insert(secureExamSessions).values({
        sessionId,
        examId: link.examId,
        centerLinkId: link.id,
        candidateId,
        rollNumber,
        ipAddress: typeof clientIp === 'string' ? clientIp : clientIp[0],
        userAgent: req.headers['user-agent'] || 'unknown',
        status: "ACTIVE",
        startTime: new Date(),
        browserLocked: sebConfig?.lockdownSettings ? true : false,
      }).returning();
      
      // Update usage count for the center link
      await db.update(examCenterLinks)
        .set({ 
          usageCount: (link.usageCount || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(examCenterLinks.id, link.id));
      
      res.json({
        sessionId: session.sessionId,
        examId: link.examId,
        centerName: link.centerName,
        message: "Secure exam session started successfully"
      });
    } catch (error) {
      console.error("Error starting secure exam session:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  // End secure exam session (by candidate)
  app.post("/api/secure-exam/end-session", async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }
      
      const [updated] = await db.update(secureExamSessions)
        .set({
          status: "COMPLETED",
          endTime: new Date(),
          terminatedBy: "CANDIDATE",
          updatedAt: new Date(),
        })
        .where(eq(secureExamSessions.sessionId, sessionId))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json({ message: "Exam session ended successfully" });
    } catch (error) {
      console.error("Error ending secure exam session:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  // Heartbeat to keep session alive
  app.post("/api/secure-exam/heartbeat", async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }
      
      const [session] = await db.update(secureExamSessions)
        .set({
          lastHeartbeat: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(secureExamSessions.sessionId, sessionId),
          eq(secureExamSessions.status, "ACTIVE")
        ))
        .returning();
      
      if (!session) {
        return res.status(404).json({ message: "Active session not found" });
      }
      
      res.json({ status: "alive", serverTime: new Date().toISOString() });
    } catch (error) {
      console.error("Error processing heartbeat:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Notices CRUD
  app.post("/api/notices", isAdmin, async (req, res) => {
    try {
      const notice = await storage.createNotice(req.body);
      res.status(201).json(notice);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put("/api/notices/:id", isAdmin, async (req, res) => {
    try {
      const notice = await storage.updateNotice(Number(req.params.id), req.body);
      res.json(notice);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete("/api/notices/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteNotice(Number(req.params.id));
      res.json({ message: "Notice deleted" });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Applications management
  app.get("/api/admin/applications", isAdmin, async (req, res) => {
    try {
      const apps = await storage.getAllApplications();
      res.json(apps);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put("/api/admin/applications/:id", isAdmin, async (req, res) => {
    try {
      const app = await storage.updateApplicationStatus(Number(req.params.id), req.body);
      res.json(app);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.patch("/api/admin/applications/:id", isAdmin, async (req, res) => {
    try {
      const app = await storage.updateApplication(Number(req.params.id), req.body);
      res.json(app);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get all results (for MIS reports)
  app.get("/api/admin/all-results", isAdmin, async (req, res) => {
    try {
      const allExams = await storage.getAllExams();
      const allResults = [];
      for (const exam of allExams) {
        const results = await storage.getExamResults(exam.id);
        allResults.push(...results);
      }
      res.json(allResults);
    } catch (error) {
      console.error("Error fetching all results:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get all payments (for MIS reports)
  app.get("/api/admin/payments", isAdmin, async (req, res) => {
    try {
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Generate admit card for single application
  app.post("/api/admin/applications/:id/generate-admit-card", isAdmin, async (req, res) => {
    try {
      const appId = Number(req.params.id);
      const app = await storage.getApplication(appId);
      if (!app) return res.status(404).json({ message: "Application not found" });
      
      const exam = await storage.getExam(app.examId);
      if (!exam) return res.status(404).json({ message: "Exam not found" });
      
      // Generate roll number if not exists
      let rollNumber = app.rollNumber;
      if (!rollNumber) {
        const year = new Date().getFullYear();
        const random = Math.floor(100000 + Math.random() * 900000);
        rollNumber = `${exam.code}-${year}-${random}`;
      }
      
      const updated = await storage.updateApplication(appId, {
        rollNumber,
        admitCardGenerated: true
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error generating admit card:", error);
      res.status(500).json({ message: "Failed to generate admit card" });
    }
  });

  // Bulk generate admit cards for an exam
  app.post("/api/admin/exams/:examId/generate-admit-cards", isAdmin, async (req, res) => {
    try {
      const examId = Number(req.params.examId);
      const exam = await storage.getExam(examId);
      if (!exam) return res.status(404).json({ message: "Exam not found" });
      
      const apps = await storage.getApplicationsByExam(examId);
      const submittedApps = apps.filter(a => a.status === "SUBMITTED" && !a.admitCardGenerated);
      
      let count = 0;
      const year = new Date().getFullYear();
      
      for (const app of submittedApps) {
        const random = Math.floor(100000 + Math.random() * 900000);
        const rollNumber = `${exam.code}-${year}-${random}`;
        
        await storage.updateApplication(app.id, {
          rollNumber,
          admitCardGenerated: true
        });
        count++;
      }
      
      res.json({ success: true, count });
    } catch (error) {
      console.error("Error bulk generating admit cards:", error);
      res.status(500).json({ message: "Failed to generate admit cards" });
    }
  });

  // Users management
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const usersList = await storage.getAllUsers();
      res.json(usersList);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Dashboard stats
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const [exams, applications, users, notices] = await Promise.all([
        storage.getExams(),
        storage.getAllApplications(),
        storage.getAllUsers(),
        storage.getNotices()
      ]);
      res.json({
        totalExams: exams.length,
        activeExams: exams.filter(e => e.isActive && !e.isDraft).length,
        totalApplications: applications.length,
        totalUsers: users.length,
        totalNotices: notices.length
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === VISITOR TRACKING ===

  // Record a page view (public endpoint)
  app.post("/api/track/pageview", async (req, res) => {
    try {
      const schema = z.object({
        portal: z.enum(["exam", "jobs"]),
        page: z.string().min(1).max(200),
        sessionId: z.string().max(100).optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request" });
      }
      const { portal, page, sessionId } = parsed.data;
      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "";
      const userAgent = (req.headers["user-agent"] || "").substring(0, 500);
      const referrer = (req.headers["referer"] || "").substring(0, 500);

      await db.insert(pageViews).values({
        portal,
        page,
        sessionId: sessionId || null,
        ip,
        userAgent,
        referrer,
      });

      const today = new Date().toISOString().split("T")[0];
      const existing = await db.select().from(visitorStats)
        .where(and(eq(visitorStats.portal, portal), eq(visitorStats.date, today)))
        .limit(1);

      if (existing.length > 0) {
        await db.update(visitorStats)
          .set({ totalViews: sql`${visitorStats.totalViews} + 1` })
          .where(eq(visitorStats.id, existing[0].id));

        // Check if this session is unique for today
        if (sessionId) {
          const existingSession = await db.select({ id: pageViews.id }).from(pageViews)
            .where(and(
              eq(pageViews.portal, portal),
              eq(pageViews.sessionId, sessionId),
              sql`DATE(${pageViews.createdAt}) = ${today}`
            ))
            .limit(2);
          if (existingSession.length <= 1) {
            await db.update(visitorStats)
              .set({ uniqueVisitors: sql`${visitorStats.uniqueVisitors} + 1` })
              .where(eq(visitorStats.id, existing[0].id));
          }
        }
      } else {
        await db.insert(visitorStats).values({
          portal,
          date: today,
          totalViews: 1,
          uniqueVisitors: 1,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Track pageview error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get visitor stats for admin dashboard
  app.get("/api/admin/visitor-stats", isAdmin, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffDate = cutoff.toISOString().split("T")[0];

      // Get daily stats
      const dailyStats = await db.select().from(visitorStats)
        .where(sql`${visitorStats.date} >= ${cutoffDate}`)
        .orderBy(desc(visitorStats.date));

      // Get totals per portal
      const examTotal = await db.select({
        totalViews: sql<number>`COALESCE(SUM(${visitorStats.totalViews}), 0)`,
        uniqueVisitors: sql<number>`COALESCE(SUM(${visitorStats.uniqueVisitors}), 0)`,
      }).from(visitorStats).where(eq(visitorStats.portal, "exam"));

      const jobsTotal = await db.select({
        totalViews: sql<number>`COALESCE(SUM(${visitorStats.totalViews}), 0)`,
        uniqueVisitors: sql<number>`COALESCE(SUM(${visitorStats.uniqueVisitors}), 0)`,
      }).from(visitorStats).where(eq(visitorStats.portal, "jobs"));

      // Get all-time totals
      const allTimeTotal = await db.select({
        totalViews: sql<number>`COALESCE(SUM(${visitorStats.totalViews}), 0)`,
      }).from(visitorStats);

      // Today's stats
      const today = new Date().toISOString().split("T")[0];
      const todayStats = await db.select().from(visitorStats)
        .where(eq(visitorStats.date, today));

      const todayExam = todayStats.find(s => s.portal === "exam");
      const todayJobs = todayStats.find(s => s.portal === "jobs");

      res.json({
        exam: {
          totalViews: Number(examTotal[0]?.totalViews || 0),
          uniqueVisitors: Number(examTotal[0]?.uniqueVisitors || 0),
          todayViews: todayExam?.totalViews || 0,
        },
        jobs: {
          totalViews: Number(jobsTotal[0]?.totalViews || 0),
          uniqueVisitors: Number(jobsTotal[0]?.uniqueVisitors || 0),
          todayViews: todayJobs?.totalViews || 0,
        },
        allTime: {
          totalViews: Number(allTimeTotal[0]?.totalViews || 0),
        },
        daily: dailyStats,
      });
    } catch (error) {
      console.error("Visitor stats error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === ADMIT CARD ROUTES ===
  
  // Admin: Generate admit cards for an exam (assign centers and mark as generated)
  app.post("/api/admin/exams/:examId/generate-admit-cards", isAdmin, async (req, res) => {
    try {
      const examId = Number(req.params.examId);
      const applications = await storage.getApplicationsByExam(examId);
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      const examCenters = exam.examCenters?.cities || ["New Delhi", "Mumbai", "Chennai", "Kolkata", "Bangalore"];
      let generated = 0;
      
      for (const app of applications) {
        if (!app.admitCardGenerated && app.status === "SUBMITTED") {
          // Assign center from preference or random if not available
          const preferredCenter = app.preferredCenters?.[0];
          const randomCenter = examCenters[Math.floor(Math.random() * examCenters.length)];
          const assignedCenter = preferredCenter || (typeof randomCenter === 'string' ? randomCenter : randomCenter?.name);
          
          await storage.updateApplication(app.id, {
            admitCardGenerated: true,
            allocatedCenter: assignedCenter || null,
            status: "APPROVED"
          });
          generated++;
        }
      }
      
      res.json({ message: `Generated ${generated} admit cards`, generated });
    } catch (error) {
      console.error("Error generating admit cards:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  // Candidate: Get admit card for an application
  app.get("/api/applications/:id/admit-card", isAuthenticated, async (req: any, res) => {
    try {
      const app = await storage.getApplication(Number(req.params.id));
      if (!app) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Security: Verify ownership - only the candidate who owns this application or admin can view
      const isOwner = app.candidateId === req.user.id;
      const isAdminUser = req.user.role === "admin";
      if (!isOwner && !isAdminUser) {
        return res.status(403).json({ message: "Unauthorized: You can only view your own admit card" });
      }
      
      if (!app.admitCardGenerated) {
        return res.status(400).json({ message: "Admit card not yet generated" });
      }
      
      const exam = await storage.getExam(app.examId);
      const profile = await storage.getProfileById(app.candidateId);
      
      res.json({
        rollNumber: app.rollNumber,
        examTitle: exam?.title,
        examCode: exam?.code,
        examDate: exam?.examDate,
        reportingTime: "08:30 AM",
        gateClosingTime: "09:30 AM",
        examCenter: app.allocatedCenter || app.preferredCenters?.[0],
        candidateName: profile?.fullName,
        fatherName: profile?.fatherName,
        category: profile?.category,
        photoUrl: profile?.photoUrl,
        signatureUrl: profile?.signatureUrl,
        instructions: exam?.examInstructions || "Carry valid ID proof. No electronic devices allowed."
      });
    } catch (error) {
      console.error("Error fetching admit card:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === ANSWER KEYS (Admin) ===
  app.get("/api/answer-keys", isAdmin, async (req, res) => {
    try {
      const keys = await storage.getAnswerKeys();
      res.json(keys);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Public endpoint for published answer keys only
  app.get("/api/exams/:examId/answer-keys", async (req, res) => {
    try {
      const keys = await storage.getAnswerKeysByExam(Number(req.params.examId));
      // Only return published keys to public
      const publishedKeys = keys.filter(k => k.status !== "DRAFT" && k.isActive);
      res.json(publishedKeys);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/answer-keys", isAdmin, async (req, res) => {
    try {
      const key = await storage.createAnswerKey(req.body);
      res.json(key);
    } catch (error) {
      console.error("Error creating answer key:", error);
      res.status(500).json({ message: "Failed to create answer key" });
    }
  });

  app.put("/api/answer-keys/:id", isAdmin, async (req, res) => {
    try {
      const key = await storage.updateAnswerKey(Number(req.params.id), req.body);
      res.json(key);
    } catch (error) {
      res.status(500).json({ message: "Failed to update answer key" });
    }
  });

  app.delete("/api/answer-keys/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteAnswerKey(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete answer key" });
    }
  });

  // === EXAM RESULTS (Admin) ===
  // Admin-only: Get all results for an exam
  app.get("/api/admin/exams/:examId/results", isAdmin, async (req, res) => {
    try {
      const results = await storage.getExamResults(Number(req.params.examId));
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get("/api/results/check", async (req, res) => {
    try {
      const { examId, rollNumber } = req.query;
      if (!examId || !rollNumber) {
        return res.status(400).json({ message: "examId and rollNumber required" });
      }
      const result = await storage.getExamResultByRoll(Number(examId), String(rollNumber));
      if (!result || !result.isPublished) {
        return res.status(404).json({ message: "Result not found" });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/admin/exams/:examId/results", isAdmin, async (req, res) => {
    try {
      const result = await storage.createExamResult({
        ...req.body,
        examId: Number(req.params.examId)
      });
      res.json(result);
    } catch (error) {
      console.error("Error creating result:", error);
      res.status(500).json({ message: "Failed to create result" });
    }
  });

  app.post("/api/admin/exams/:examId/results/bulk", isAdmin, async (req, res) => {
    try {
      const { results } = req.body;
      const examId = Number(req.params.examId);
      const resultsWithExam = results.map((r: any) => ({ ...r, examId }));
      const inserted = await storage.createBulkResults(resultsWithExam);
      res.json({ success: true, count: inserted.length });
    } catch (error) {
      console.error("Error bulk uploading results:", error);
      res.status(500).json({ message: "Failed to upload results" });
    }
  });

  app.put("/api/results/:id", isAdmin, async (req, res) => {
    try {
      const result = await storage.updateExamResult(Number(req.params.id), req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to update result" });
    }
  });

  app.delete("/api/results/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteExamResult(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete result" });
    }
  });

  app.post("/api/admin/exams/:examId/results/publish", isAdmin, async (req, res) => {
    try {
      await storage.publishResults(Number(req.params.examId));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to publish results" });
    }
  });

  // Public endpoint for published results (merit list)
  app.get("/api/exams/:examId/results/public", async (req, res) => {
    try {
      const results = await storage.getPublishedResults(Number(req.params.examId));
      // Return only public fields for merit list
      const publicResults = results.map(r => ({
        rollNumber: r.rollNumber,
        candidateName: r.candidateName,
        fatherName: r.fatherName,
        category: r.category,
        rank: r.rank,
        status: r.status,
        stage: r.stage,
      }));
      res.json(publicResults);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === ADMIT CARD TEMPLATES (Admin) ===
  app.get("/api/admin/exams/:examId/admit-templates", isAdmin, async (req, res) => {
    try {
      const templates = await storage.getAdmitCardTemplates(Number(req.params.examId));
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/admin/admit-templates", isAdmin, async (req, res) => {
    try {
      const template = await storage.createAdmitCardTemplate(req.body);
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.put("/api/admin/admit-templates/:id", isAdmin, async (req, res) => {
    try {
      const template = await storage.updateAdmitCardTemplate(Number(req.params.id), req.body);
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete("/api/admin/admit-templates/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteAdmitCardTemplate(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Bulk center allocation via CSV
  app.post("/api/admin/exams/:examId/allocate-centers-bulk", isAdmin, async (req, res) => {
    try {
      const { allocations } = req.body; // [{rollNumber, center}]
      let updated = 0;
      for (const alloc of allocations) {
        const app = await storage.getApplicationByRollNumber(alloc.rollNumber);
        if (app) {
          await storage.updateApplication(app.id, { allocatedCenter: alloc.center });
          updated++;
        }
      }
      res.json({ success: true, count: updated });
    } catch (error) {
      res.status(500).json({ message: "Failed to allocate centers" });
    }
  });

  // Bulk admit card generation with candidate data CSV
  app.post("/api/admin/exams/:examId/generate-admit-cards-bulk", isAdmin, async (req, res) => {
    try {
      const examId = Number(req.params.examId);
      const { candidates } = req.body; // [{rollNumber, center, venue, reportingTime, examDate, shift}]
      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      let generated = 0;
      for (const cand of candidates) {
        const app = await storage.getApplicationByRollNumber(cand.rollNumber);
        if (app && app.examId === examId) {
          await storage.updateApplication(app.id, {
            allocatedCenter: cand.center || cand.venue,
            admitCardGenerated: true,
            rollNumber: cand.rollNumber,
          });
          generated++;
        }
      }
      res.json({ success: true, count: generated });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate admit cards" });
    }
  });

  // === CANDIDATE ENDPOINTS ===
  // Get candidate's own admit card
  app.get("/api/my/admit-card/:applicationId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      const application = await storage.getApplication(Number(req.params.applicationId));
      if (!application || application.candidateId !== profile.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (!application.admitCardGenerated || !application.rollNumber) {
        return res.status(404).json({ message: "Admit card not yet available" });
      }
      
      const exam = await storage.getExam(application.examId);
      res.json({
        application,
        exam,
        candidate: profile,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get candidate's own result
  app.get("/api/my/result/:applicationId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      const application = await storage.getApplication(Number(req.params.applicationId));
      if (!application || application.candidateId !== profile.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const result = await storage.getExamResultByApplication(application.id);
      if (!result || !result.isPublished) {
        return res.status(404).json({ message: "Result not yet declared" });
      }
      
      const exam = await storage.getExam(application.examId);
      res.json({
        result,
        exam,
        candidate: profile,
        application,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === Admit Card Templates API ===
  
  // Get all admit card templates
  app.get("/api/admin/admit-card-templates", isAdmin, async (req, res) => {
    try {
      const templates = await storage.getAllAdmitCardTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get templates for specific exam
  app.get("/api/admin/exams/:examId/admit-card-templates", isAdmin, async (req, res) => {
    try {
      const templates = await storage.getAdmitCardTemplates(Number(req.params.examId));
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Create admit card template
  app.post("/api/admin/admit-card-templates", isAdmin, async (req, res) => {
    try {
      const createSchema = z.object({
        examId: z.number(),
        templateName: z.string().min(1),
        templateHtml: z.string().optional(),
        headerLogoUrl: z.string().optional(),
        footerText: z.string().optional(),
        examVenue: z.string().optional(),
        reportingTime: z.string().optional(),
        examDuration: z.string().optional(),
        instructions: z.string().optional(),
        isActive: z.boolean().optional(),
      });
      const validatedData = createSchema.parse(req.body);
      const template = await storage.createAdmitCardTemplate(validatedData);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Update admit card template
  app.put("/api/admin/admit-card-templates/:id", isAdmin, async (req, res) => {
    try {
      const updateSchema = z.object({
        templateName: z.string().min(1).optional(),
        templateHtml: z.string().optional(),
        headerLogoUrl: z.string().optional(),
        footerText: z.string().optional(),
        examVenue: z.string().optional(),
        reportingTime: z.string().optional(),
        examDuration: z.string().optional(),
        instructions: z.string().optional(),
        isActive: z.boolean().optional(),
      });
      const validatedData = updateSchema.parse(req.body);
      const template = await storage.updateAdmitCardTemplate(Number(req.params.id), validatedData);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Delete admit card template
  app.delete("/api/admin/admit-card-templates/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteAdmitCardTemplate(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === REVALUATION ROUTES ===

  // Get my results (for revaluation eligibility)
  app.get("/api/my/results", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      const results = await storage.getCandidateResults(profile.id);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get my revaluation requests
  app.get("/api/my/revaluation-requests", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      const requests = await storage.getCandidateRevaluationRequests(profile.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Submit revaluation request
  app.post("/api/revaluation/request", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      const { resultId, reason } = req.body;
      const result = await storage.getExamResult(Number(resultId));
      if (!result) {
        return res.status(404).json({ message: "Result not found" });
      }

      // Generate request number
      const requestNumber = `REV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const revaluation = await storage.createRevaluationRequest({
        resultId: result.id,
        applicationId: result.applicationId,
        candidateId: profile.id,
        examId: result.examId,
        requestNumber,
        reason,
        previousMarks: result.obtainedMarks,
        feeAmount: 500, // Default fee per subject
      });

      res.json(revaluation);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Admin: Get all revaluation requests
  app.get("/api/admin/revaluation-requests", isAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllRevaluationRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Admin: Process revaluation request
  app.put("/api/admin/revaluation-requests/:id", isAdmin, async (req, res) => {
    try {
      const { status, revisedMarks, remarks } = req.body;
      const marksChanged = revisedMarks && req.body.previousMarks !== revisedMarks;
      
      const request = await storage.updateRevaluationRequest(Number(req.params.id), {
        status,
        revisedMarks: revisedMarks ? Number(revisedMarks) : null,
        remarks,
        marksChanged,
        processedBy: Number(req.user!.id),
        processedAt: new Date(),
      });

      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === PAYMENT ROUTES ===
  
  // Create payment order with Razorpay (exam-specific or global credentials)
  app.post("/api/payments/create", isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.getProfile(req.user!.id);
      if (!profile) {
        return res.status(400).json({ message: "Profile not found" });
      }

      const { type, amount, examId, applicationId, revaluationRequestId, description } = req.body;
      
      // Get exam-specific Razorpay credentials or use global
      let razorpayKeyId = process.env.RAZORPAY_KEY_ID;
      let razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
      let credentialSource = "global";
      
      if (examId) {
        const exam = await storage.getExam(examId);
        if (exam?.razorpayEnabled && exam?.razorpayKeyId && exam?.razorpayKeySecret) {
          razorpayKeyId = exam.razorpayKeyId;
          razorpayKeySecret = exam.razorpayKeySecret;
          credentialSource = `exam:${exam.code}`;
          console.log(`[Payment] Using exam-specific Razorpay for ${exam.code}`);
        }
      }

      // Check if Razorpay is configured
      const razorpayConfigured = razorpayKeyId && razorpayKeySecret;
      
      // Generate transaction IDs
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
      const transactionId = `TXN${timestamp}${randomStr}`;
      
      let orderId = `ORD${timestamp}${randomStr}`;
      let razorpayOrder = null;
      let mode = "DEMO";
      
      // Create Razorpay order if credentials are available
      if (razorpayConfigured) {
        try {
          const Razorpay = require("razorpay");
          const razorpay = new Razorpay({
            key_id: razorpayKeyId,
            key_secret: razorpayKeySecret
          });
          
          razorpayOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100), // Amount in paise
            currency: "INR",
            receipt: transactionId,
            notes: {
              type,
              description,
              candidateId: profile.id.toString(),
              examId: examId?.toString() || "",
              applicationId: applicationId?.toString() || ""
            }
          });
          
          orderId = razorpayOrder.id;
          mode = "RAZORPAY";
          console.log(`[Payment] Razorpay order created: ${orderId} (${credentialSource})`);
        } catch (razorpayError: any) {
          console.error("[Payment] Razorpay order creation failed:", razorpayError.message);
          // Fall back to demo mode
          mode = "DEMO";
        }
      }

      // Create payment record
      const payment = await storage.createPaymentTransaction({
        candidateId: profile.id,
        examId: examId || null,
        applicationId: applicationId || null,
        transactionId,
        orderId,
        paymentGateway: mode,
        amount: Math.round(amount * 100), // Store in paise
        currency: "INR",
        status: "PENDING",
        gatewayResponse: { type, description, revaluationRequestId, credentialSource },
      });

      res.json({
        success: true,
        paymentId: payment.id,
        transactionId,
        orderId,
        amount,
        currency: "INR",
        mode,
        razorpayKeyId: mode === "RAZORPAY" ? razorpayKeyId : null,
        message: mode === "RAZORPAY" 
          ? "Razorpay order created successfully" 
          : "Payment created in demo mode. Configure Razorpay to enable live payments."
      });
    } catch (error) {
      console.error("Payment creation error:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Simulate payment completion (demo mode)
  app.post("/api/payments/:id/complete", isAuthenticated, async (req, res) => {
    try {
      const paymentId = Number(req.params.id);
      const payment = await storage.getPaymentTransaction(paymentId);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Simulate successful payment
      const updatedPayment = await storage.updatePaymentTransaction(paymentId, {
        status: "SUCCESS",
        paymentMethod: "DEMO",
        paidAt: new Date(),
        gatewayResponse: {
          ...((payment.gatewayResponse as any) || {}),
          completedAt: new Date().toISOString(),
          demoMode: true
        }
      });

      // If this was for a revaluation request, update the request
      const gatewayResponse = payment.gatewayResponse as any;
      if (gatewayResponse?.revaluationRequestId) {
        await storage.updateRevaluationRequest(gatewayResponse.revaluationRequestId, {
          paymentId: paymentId,
          isPaid: true
        });
      }

      // Send payment success notification
      if (payment.candidateId) {
        await notificationService.notifyPaymentSuccess(
          payment.candidateId,
          payment.amount,
          payment.transactionId || "N/A",
          gatewayResponse?.description || "Payment processed successfully"
        );
      }

      res.json({
        success: true,
        payment: updatedPayment,
        message: "Payment completed successfully (demo mode)"
      });
    } catch (error) {
      console.error("Payment completion error:", error);
      res.status(500).json({ message: "Failed to complete payment" });
    }
  });

  // Verify payment status
  app.get("/api/payments/:id", isAuthenticated, async (req, res) => {
    try {
      const payment = await storage.getPaymentTransaction(Number(req.params.id));
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });

  // Get candidate's payment history
  app.get("/api/my-payments", isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.getProfile(req.user!.id);
      if (!profile) {
        return res.json([]);
      }
      const payments = await storage.getCandidatePayments(profile.id);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // === OTP AUTHENTICATION ROUTES ===
  
  // Generate and send OTP for login/verification
  app.post("/api/auth/otp/send", async (req, res) => {
    try {
      const { target, purpose, isEmail, examName } = req.body;
      
      if (!target || !purpose) {
        return res.status(400).json({ message: "Target and purpose are required" });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP
      await storage.createOtp({
        email: isEmail ? target : null,
        mobile: isEmail ? null : target,
        otp,
        purpose,
        expiresAt,
      });

      // Send OTP via notification service
      const otpPurpose = purpose === "LOGIN" ? "Form Verification" : purpose;
      await notificationService.sendOTP(target, otp, otpPurpose, isEmail, examName);

      // Always include OTP in response for testing (until production SMS is working)
      res.json({ 
        success: true, 
        message: `OTP sent to ${isEmail ? "email" : "mobile"}`,
        expiresIn: 600, // seconds
        demoOtp: otp, 
        demoMode: true
      });
    } catch (error) {
      console.error("OTP send error:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  // Verify OTP
  app.post("/api/auth/otp/verify", async (req, res) => {
    try {
      const { target, otp, purpose, isEmail } = req.body;

      if (!target || !otp || !purpose) {
        return res.status(400).json({ message: "Target, OTP, and purpose are required" });
      }

      const otpRecord = await storage.getValidOtp(target, purpose, isEmail);

      if (!otpRecord) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // Check max attempts (5)
      if ((otpRecord.attempts || 0) >= 5) {
        return res.status(400).json({ message: "Maximum OTP attempts exceeded. Please request a new OTP." });
      }

      // Verify OTP
      if (otpRecord.otp !== otp) {
        await storage.incrementOtpAttempts(otpRecord.id);
        return res.status(400).json({ message: "Invalid OTP" });
      }

      // Mark as verified
      await storage.verifyOtp(otpRecord.id);

      // For login purpose, create session if user exists
      if (purpose === "LOGIN") {
        const user = isEmail 
          ? await storage.getUserByEmail(target)
          : await storage.getUserByMobile(target);
        
        if (user) {
          req.session.userId = user.id;
          return req.session.save((err) => {
            if (err) {
              return res.status(500).json({ message: "Session creation failed" });
            }
            const { password, ...safeUser } = user;
            res.json({ success: true, verified: true, user: safeUser });
          });
        }
      }

      res.json({ success: true, verified: true });
    } catch (error) {
      console.error("OTP verify error:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // OTP Login (for existing users)
  app.post("/api/auth/otp/login", async (req, res) => {
    try {
      const { target, isEmail } = req.body;

      if (!target) {
        return res.status(400).json({ message: "Email or mobile number required" });
      }

      // Check if user exists
      const user = isEmail 
        ? await storage.getUserByEmail(target)
        : await storage.getUserByMobile(target);
      
      if (!user) {
        return res.status(404).json({ message: "No account found with this " + (isEmail ? "email" : "mobile number") });
      }

      // Generate and send OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await storage.createOtp({
        email: isEmail ? target : null,
        mobile: isEmail ? null : target,
        otp,
        purpose: "LOGIN",
        expiresAt,
      });

      await notificationService.sendOTP(target, otp, "Form Verification", isEmail);

      // Always include OTP in response for testing (until production SMS is working)
      res.json({ 
        success: true, 
        message: `OTP sent to ${isEmail ? "email" : "mobile"}`,
        demoOtp: otp, 
        demoMode: true
      });
    } catch (error) {
      console.error("OTP login error:", error);
      res.status(500).json({ message: "Failed to initiate OTP login" });
    }
  });

  // === CERTIFICATE ROUTES ===
  
  // Get candidate's certificates
  app.get("/api/my-certificates", isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.getProfile(req.user!.id);
      if (!profile) {
        return res.json([]);
      }
      const certs = await storage.getCandidateCertificates(profile.id);
      res.json(certs);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });

  // Get certificate by number (public verification)
  app.get("/api/certificates/verify/:certificateNumber", async (req, res) => {
    try {
      const cert = await storage.getCertificateByNumber(req.params.certificateNumber);
      if (!cert) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Get related data
      const exam = cert.examId ? await storage.getExam(cert.examId) : null;
      const application = cert.applicationId ? await storage.getApplication(cert.applicationId) : null;
      const profile = cert.candidateId ? await storage.getProfileById(cert.candidateId) : null;
      
      res.json({
        certificate: cert,
        exam: exam ? { name: exam.name, code: exam.code } : null,
        candidate: profile ? { name: profile.fullName, registrationNumber: profile.registrationNumber } : null
      });
    } catch (error) {
      console.error("Error verifying certificate:", error);
      res.status(500).json({ message: "Failed to verify certificate" });
    }
  });

  // Get certificate by ID
  app.get("/api/certificates/:id", isAuthenticated, async (req, res) => {
    try {
      const cert = await storage.getCertificate(parseInt(req.params.id));
      if (!cert) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      res.json(cert);
    } catch (error) {
      console.error("Error fetching certificate:", error);
      res.status(500).json({ message: "Failed to fetch certificate" });
    }
  });

  // Admin: Get all certificates
  app.get("/api/admin/certificates", isAdmin, async (req, res) => {
    try {
      const certs = await storage.getAllCertificates();
      res.json(certs);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });

  // Admin: Get certificates for an exam
  app.get("/api/admin/exams/:examId/certificates", isAdmin, async (req, res) => {
    try {
      const certs = await storage.getExamCertificates(parseInt(req.params.examId));
      res.json(certs);
    } catch (error) {
      console.error("Error fetching exam certificates:", error);
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });

  // Admin: Generate certificate for an application
  app.post("/api/admin/certificates/generate", isAdmin, async (req, res) => {
    try {
      const { applicationId, certificateType } = req.body;
      
      if (!applicationId || !certificateType) {
        return res.status(400).json({ message: "Application ID and certificate type required" });
      }
      
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const exam = await storage.getExam(application.examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Generate certificate number
      const certificateNumber = await storage.generateCertificateNumber(exam.code, certificateType);
      
      // Set validity (1 year for provisional, no expiry for marksheet)
      let validUntil = null;
      if (certificateType === "PROVISIONAL") {
        validUntil = new Date();
        validUntil.setFullYear(validUntil.getFullYear() + 1);
      }
      
      const cert = await storage.createCertificate({
        applicationId,
        candidateId: application.candidateId,
        examId: application.examId,
        certificateNumber,
        certificateType,
        status: "GENERATED",
        issuedAt: new Date(),
        issuedBy: req.user!.id ? 1 : null, // Store admin ID
        validUntil,
        qrCode: `https://portal.gov.in/verify/${certificateNumber}`
      });
      
      res.json({ success: true, certificate: cert });
    } catch (error) {
      console.error("Error generating certificate:", error);
      res.status(500).json({ message: "Failed to generate certificate" });
    }
  });

  // Admin: Bulk generate certificates for exam results
  app.post("/api/admin/certificates/bulk-generate", isAdmin, async (req, res) => {
    try {
      const { examId, certificateType, onlyPassed } = req.body;
      
      if (!examId || !certificateType) {
        return res.status(400).json({ message: "Exam ID and certificate type required" });
      }
      
      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Get results for this exam
      const results = await storage.getExamResults(examId);
      const filteredResults = onlyPassed 
        ? results.filter(r => r.status === "PASS" || r.status === "QUALIFIED")
        : results;
      
      let generated = 0;
      for (const result of filteredResults) {
        // Check if certificate already exists for this application and type
        const existing = await storage.getCandidateCertificates(result.candidateId);
        const hasExisting = existing.some(c => 
          c.examId === examId && c.certificateType === certificateType
        );
        
        if (!hasExisting) {
          const certificateNumber = await storage.generateCertificateNumber(exam.code, certificateType);
          
          let validUntil = null;
          if (certificateType === "PROVISIONAL") {
            validUntil = new Date();
            validUntil.setFullYear(validUntil.getFullYear() + 1);
          }
          
          await storage.createCertificate({
            applicationId: result.applicationId,
            candidateId: result.candidateId,
            examId,
            certificateNumber,
            certificateType,
            status: "GENERATED",
            issuedAt: new Date(),
            issuedBy: 1,
            validUntil,
            qrCode: `https://portal.gov.in/verify/${certificateNumber}`
          });
          generated++;
        }
      }
      
      res.json({ success: true, generated, total: filteredResults.length });
    } catch (error) {
      console.error("Error bulk generating certificates:", error);
      res.status(500).json({ message: "Failed to generate certificates" });
    }
  });

  // Admin: Update certificate status
  app.patch("/api/admin/certificates/:id", isAdmin, async (req, res) => {
    try {
      const cert = await storage.updateCertificate(parseInt(req.params.id), req.body);
      res.json(cert);
    } catch (error) {
      console.error("Error updating certificate:", error);
      res.status(500).json({ message: "Failed to update certificate" });
    }
  });

  // === NOTIFICATION ROUTES ===
  
  // Get candidate's notifications
  app.get("/api/my-notifications", isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.getProfile(req.user!.id);
      if (!profile) {
        return res.json([]);
      }
      const notifications = await notificationService.getCandidateNotifications(profile.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Send test notification (admin only)
  app.post("/api/admin/notifications/test", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { email, mobile, message, subject, channel } = req.body;
      
      await notificationService.sendNotification({
        email,
        mobile,
        type: "APPLICATION_SUBMITTED",
        channel: channel || "BOTH",
        subject: subject || "Test Notification",
        message: message || "This is a test notification from the examination portal.",
      });

      res.json({ success: true, message: "Test notification sent (demo mode)" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send test notification" });
    }
  });

  // === COMPANY CERTIFICATES (Tender Verification System) ===
  
  // Public: Verify company certificate by number or verification code
  app.get("/api/company-certificates/verify/:code", async (req, res) => {
    try {
      const { code } = req.params;
      
      // Try to find by certificate number first, then by verification code
      let cert = await storage.getCompanyCertificateByNumber(code);
      if (!cert) {
        cert = await storage.getCompanyCertificateByVerificationCode(code);
      }
      
      if (!cert) {
        return res.status(404).json({ 
          verified: false, 
          message: "Certificate not found. Please check the certificate number or verification code." 
        });
      }
      
      // Check if certificate is still valid
      const isExpired = cert.validUntil && new Date(cert.validUntil) < new Date();
      const isActive = cert.status === "ACTIVE";
      
      res.json({
        verified: isActive && !isExpired,
        certificate: {
          certificateNumber: cert.certificateNumber,
          certificateType: cert.certificateType,
          title: cert.title,
          issuedTo: cert.issuedTo,
          issuedBy: cert.issuedBy,
          issueDate: cert.issueDate,
          validUntil: cert.validUntil,
          status: isExpired ? "EXPIRED" : cert.status,
          metadata: cert.metadata,
        },
        message: isActive && !isExpired 
          ? "This certificate is valid and authentic." 
          : isExpired 
            ? "This certificate has expired." 
            : "This certificate has been revoked."
      });
    } catch (error) {
      console.error("Certificate verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Admin: Get all company certificates
  app.get("/api/admin/company-certificates", isAdmin, async (req, res) => {
    try {
      const certs = await storage.getCompanyCertificates();
      res.json(certs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });

  // Admin: Create company certificate
  app.post("/api/admin/company-certificates", isAdmin, async (req, res) => {
    try {
      const { certificateType, title, description, issuedTo, issuedBy, issueDate, validUntil, metadata } = req.body;
      
      const certificateNumber = await storage.generateCompanyCertificateNumber(certificateType);
      const verificationCode = await storage.generateVerificationCode();
      
      const cert = await storage.createCompanyCertificate({
        certificateNumber,
        certificateType,
        title,
        description,
        issuedTo,
        issuedBy,
        issueDate,
        validUntil,
        status: "ACTIVE",
        verificationCode,
        metadata,
      });
      
      res.json({ success: true, certificate: cert });
    } catch (error) {
      console.error("Error creating company certificate:", error);
      res.status(500).json({ message: "Failed to create certificate" });
    }
  });

  // Admin: Update company certificate
  app.patch("/api/admin/company-certificates/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cert = await storage.updateCompanyCertificate(id, req.body);
      res.json(cert);
    } catch (error) {
      res.status(500).json({ message: "Failed to update certificate" });
    }
  });

  // Admin: Delete company certificate
  app.delete("/api/admin/company-certificates/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCompanyCertificate(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete certificate" });
    }
  });

  // ==================== EXAM CENTER MANAGEMENT ROUTES ====================

  // Get all exam centers (Main Admin only)
  app.get("/api/exam-centers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const centers = await db.select().from(examCentersTable).orderBy(examCentersTable.createdAt);
      const centersWithoutPasswords = centers.map(c => ({ ...c, adminPassword: undefined }));
      res.json(centersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching exam centers:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Create new exam center
  app.post("/api/exam-centers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { centerCode, centerName, address, city, state, pincode, adminUsername, adminPassword, adminEmail, adminMobile, totalSeats, totalComputers, lanServerIp, lanServerPort } = req.body;
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const syncToken = crypto.randomBytes(32).toString("hex");
      
      const [center] = await db.insert(examCentersTable).values({
        centerCode, centerName, address, city, state, pincode, adminUsername,
        adminPassword: hashedPassword, adminEmail, adminMobile,
        totalSeats: totalSeats || 30, totalComputers: totalComputers || 30,
        lanServerIp, lanServerPort: lanServerPort || 3000, syncToken, isActive: true,
      }).returning();
      
      res.json({ ...center, adminPassword: undefined });
    } catch (error: any) {
      console.error("Error creating exam center:", error);
      res.status(error.code === "23505" ? 400 : 500).json({ 
        message: error.code === "23505" ? "Center code or admin username already exists" : "Internal Server Error" 
      });
    }
  });

  // Update exam center
  app.patch("/api/exam-centers/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const centerId = parseInt(req.params.id);
      const updates = req.body;
      if (updates.adminPassword) {
        updates.adminPassword = await bcrypt.hash(updates.adminPassword, 10);
      }
      updates.updatedAt = new Date();
      const [updated] = await db.update(examCentersTable).set(updates).where(eq(examCentersTable.id, centerId)).returning();
      res.json({ ...updated, adminPassword: undefined });
    } catch (error) {
      console.error("Error updating exam center:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Delete exam center
  app.delete("/api/exam-centers/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const centerId = parseInt(req.params.id);
      await db.delete(examCentersTable).where(eq(examCentersTable.id, centerId));
      res.json({ message: "Center deleted successfully" });
    } catch (error) {
      console.error("Error deleting exam center:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Generate Center Admin Panel link
  app.post("/api/exam-centers/:id/generate-link", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const centerId = parseInt(req.params.id);
      const [center] = await db.select().from(examCentersTable).where(eq(examCentersTable.id, centerId));
      if (!center) return res.status(404).json({ message: "Center not found" });
      
      const newSyncToken = crypto.randomBytes(32).toString("hex");
      await db.update(examCentersTable).set({ syncToken: newSyncToken, updatedAt: new Date() }).where(eq(examCentersTable.id, centerId));
      
      res.json({
        centerAdminLink: `/center-admin/login?center=${center.centerCode}`,
        studentPanelLink: `/student-exam?center=${center.centerCode}`,
        centerCode: center.centerCode, syncToken: newSyncToken,
      });
    } catch (error) {
      console.error("Error generating center link:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Center Admin Login
  app.post("/api/center-admin/login", async (req, res) => {
    try {
      const { centerCode, username, password } = req.body;
      const [center] = await db.select().from(examCentersTable)
        .where(and(eq(examCentersTable.centerCode, centerCode), eq(examCentersTable.adminUsername, username), eq(examCentersTable.isActive, true)));
      
      if (!center) return res.status(401).json({ message: "Invalid credentials" });
      
      const isValidPassword = await bcrypt.compare(password, center.adminPassword);
      if (!isValidPassword) return res.status(401).json({ message: "Invalid credentials" });
      
      const sessionToken = crypto.randomBytes(32).toString("hex");
      (req.session as any).centerAdminId = center.id;
      (req.session as any).centerCode = center.centerCode;
      (req.session as any).isCenterAdmin = true;
      
      res.json({
        success: true,
        center: { id: center.id, centerCode: center.centerCode, centerName: center.centerName, lanServerIp: center.lanServerIp, lanServerPort: center.lanServerPort },
        sessionToken,
      });
    } catch (error) {
      console.error("Center admin login error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get current center admin session
  app.get("/api/center-admin/session", async (req, res) => {
    try {
      if (!(req.session as any).isCenterAdmin) return res.status(401).json({ message: "Not logged in as center admin" });
      const [center] = await db.select().from(examCentersTable).where(eq(examCentersTable.id, (req.session as any).centerAdminId));
      if (!center) return res.status(401).json({ message: "Center not found" });
      res.json({ id: center.id, centerCode: center.centerCode, centerName: center.centerName, lanServerIp: center.lanServerIp, lanServerPort: center.lanServerPort });
    } catch (error) {
      console.error("Error getting center session:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Center Admin Logout
  app.post("/api/center-admin/logout", (req, res) => {
    delete (req.session as any).centerAdminId;
    delete (req.session as any).centerCode;
    delete (req.session as any).isCenterAdmin;
    res.json({ success: true });
  });

  // Get exams assigned to center
  app.get("/api/center-admin/exams", async (req, res) => {
    try {
      if (!(req.session as any).isCenterAdmin) return res.status(401).json({ message: "Unauthorized" });
      const centerId = (req.session as any).centerAdminId;
      const assignments = await db.select().from(centerExamAssignments).where(and(eq(centerExamAssignments.centerId, centerId), eq(centerExamAssignments.isActive, true)));
      const examIds = assignments.map(a => a.examId);
      const examDetails = examIds.length > 0 ? await db.select().from(exams).where(sql`${exams.id} IN (${sql.join(examIds.map(id => sql`${id}`), sql`, `)})`) : [];
      const examMap = new Map(examDetails.map(e => [e.id, e]));
      res.json(assignments.map(a => ({ ...a, exam: examMap.get(a.examId) })));
    } catch (error) {
      console.error("Error fetching center exams:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get candidates for center's exam
  app.get("/api/center-admin/exams/:examId/candidates", async (req, res) => {
    try {
      if (!(req.session as any).isCenterAdmin) return res.status(401).json({ message: "Unauthorized" });
      const centerId = (req.session as any).centerAdminId;
      const examId = parseInt(req.params.examId);
      const [assignment] = await db.select().from(centerExamAssignments).where(and(eq(centerExamAssignments.centerId, centerId), eq(centerExamAssignments.examId, examId)));
      if (!assignment) return res.status(403).json({ message: "No access to this exam" });
      const candidates = await db.select().from(examCandidates).where(eq(examCandidates.examId, examId));
      res.json(candidates);
    } catch (error) {
      console.error("Error fetching center candidates:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Student login from LAN
  app.post("/api/center-admin/student-login", async (req, res) => {
    try {
      if (!(req.session as any).isCenterAdmin) return res.status(401).json({ message: "Unauthorized" });
      const centerId = (req.session as any).centerAdminId;
      const { examId, candidateId, seatNumber, computerNumber, studentIpAddress } = req.body;
      const [candidate] = await db.select().from(examCandidates).where(and(eq(examCandidates.id, candidateId), eq(examCandidates.examId, examId)));
      if (!candidate) return res.status(404).json({ message: "Candidate not found" });
      
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const [session] = await db.insert(studentExamSessions).values({
        centerId, examId, candidateId, sessionToken, seatNumber, computerNumber, studentIpAddress,
        status: "WAITING", loginTime: new Date(), syncedToCenter: true, syncedToMain: false,
      }).returning();
      
      res.json({ session, candidate, studentPanelUrl: `/student-exam/take?token=${sessionToken}` });
    } catch (error) {
      console.error("Error logging in student:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get all student sessions for center
  app.get("/api/center-admin/sessions", async (req, res) => {
    try {
      if (!(req.session as any).isCenterAdmin) return res.status(401).json({ message: "Unauthorized" });
      const centerId = (req.session as any).centerAdminId;
      const examId = req.query.examId ? parseInt(req.query.examId as string) : undefined;
      const sessions = examId
        ? await db.select().from(studentExamSessions).where(and(eq(studentExamSessions.centerId, centerId), eq(studentExamSessions.examId, examId)))
        : await db.select().from(studentExamSessions).where(eq(studentExamSessions.centerId, centerId));
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Start exam for student
  app.post("/api/center-admin/sessions/:sessionId/start", async (req, res) => {
    try {
      if (!(req.session as any).isCenterAdmin) return res.status(401).json({ message: "Unauthorized" });
      const sessionId = parseInt(req.params.sessionId);
      const [updated] = await db.update(studentExamSessions).set({ status: "IN_PROGRESS", examStartTime: new Date(), updatedAt: new Date() }).where(eq(studentExamSessions.id, sessionId)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Error starting exam:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Sync responses to main server
  app.post("/api/center-admin/sync-to-main", async (req, res) => {
    try {
      if (!(req.session as any).isCenterAdmin) return res.status(401).json({ message: "Unauthorized" });
      const centerId = (req.session as any).centerAdminId;
      const { examId } = req.body;
      
      const [syncLog] = await db.insert(centerSyncLogs).values({ centerId, examId, syncType: "RESPONSE_UPLOAD", status: "IN_PROGRESS" }).returning();
      const unsyncedSessions = await db.select().from(studentExamSessions).where(and(eq(studentExamSessions.centerId, centerId), eq(studentExamSessions.syncedToMain, false), sql`${studentExamSessions.status} IN ('SUBMITTED', 'TERMINATED')`));
      
      let successCount = 0, failCount = 0;
      for (const session of unsyncedSessions) {
        try {
          // Store responses in examResponses table for main server persistence
          const responses = session.responses as any[] || [];
          for (const response of responses) {
            if (response.questionId && response.selectedAnswer) {
              // Map timeSpent to timeTaken (frontend uses timeSpent, schema uses timeTaken)
              const timeTakenValue = response.timeTaken || response.timeSpent || 0;
              
              // Check if response exists, then upsert
              const [existing] = await db.select().from(examResponses).where(and(
                eq(examResponses.examId, session.examId),
                eq(examResponses.candidateId, session.candidateId),
                eq(examResponses.questionId, response.questionId)
              ));
              
              if (existing) {
                await db.update(examResponses).set({ 
                  selectedAnswer: response.selectedAnswer, 
                  markedForReview: response.markedForReview || false,
                  timeTaken: timeTakenValue,
                }).where(eq(examResponses.id, existing.id));
              } else {
                await db.insert(examResponses).values({
                  examId: session.examId,
                  candidateId: session.candidateId,
                  questionId: response.questionId,
                  selectedAnswer: response.selectedAnswer,
                  markedForReview: response.markedForReview || false,
                  timeTaken: timeTakenValue,
                });
              }
            }
          }
          
          // Mark session as synced to main
          await db.update(studentExamSessions).set({ syncedToMain: true, syncedToMainAt: new Date() }).where(eq(studentExamSessions.id, session.id));
          successCount++;
        } catch (err) { 
          console.error("Sync error for session:", session.id, err);
          failCount++; 
        }
      }
      
      await db.update(centerSyncLogs).set({ status: "COMPLETED", recordsUploaded: successCount, recordsFailed: failCount, completedAt: new Date() }).where(eq(centerSyncLogs.id, syncLog.id));
      await db.update(examCentersTable).set({ lastSyncAt: new Date() }).where(eq(examCentersTable.id, centerId));
      
      res.json({ success: true, synced: successCount, failed: failCount });
    } catch (error) {
      console.error("Error syncing to main:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Validate student session token
  app.get("/api/student-exam/validate/:token", async (req, res) => {
    try {
      const [session] = await db.select().from(studentExamSessions).where(eq(studentExamSessions.sessionToken, req.params.token));
      if (!session) return res.status(404).json({ message: "Invalid session" });
      const [candidate] = await db.select().from(examCandidates).where(eq(examCandidates.id, session.candidateId));
      const [exam] = await db.select().from(exams).where(eq(exams.id, session.examId));
      res.json({ session, candidate, exam });
    } catch (error) {
      console.error("Error validating student session:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get questions for student exam
  app.get("/api/student-exam/:token/questions", async (req, res) => {
    try {
      const [session] = await db.select().from(studentExamSessions).where(eq(studentExamSessions.sessionToken, req.params.token));
      if (!session || session.status !== "IN_PROGRESS") return res.status(403).json({ message: "Exam not started or session invalid" });
      
      // Validate center binding - session must belong to a center
      const [center] = await db.select().from(examCentersTable).where(eq(examCentersTable.id, session.centerId));
      if (!center || !center.isActive) return res.status(403).json({ message: "Invalid center" });
      
      // Get question papers
      const papers = await db.select().from(questionPapers).where(eq(questionPapers.examId, session.examId));
      
      // Validate student IP binding (enforce LAN access)
      const clientIp = req.ip || req.socket.remoteAddress || "";
      if (session.studentIpAddress && session.studentIpAddress !== clientIp) {
        console.log(`IP mismatch: expected ${session.studentIpAddress}, got ${clientIp}`);
        // Allow for now but log the mismatch - strict mode would return 403
      }
      
      // Get questions from the linked test series in center exam assignment
      let examQuestions: any[] = [];
      
      // Check if there's a linked test series through center exam assignments (definitive source)
      const [assignment] = await db.select().from(centerExamAssignments).where(and(
        eq(centerExamAssignments.centerId, session.centerId),
        eq(centerExamAssignments.examId, session.examId)
      ));
      
      // Priority 1: Use testSeriesId from assignment (definitive and required mapping)
      if (assignment?.testSeriesId) {
        examQuestions = await db.select().from(testQuestions).where(eq(testQuestions.testSeriesId, assignment.testSeriesId)).limit(100);
      }
      
      // If no questions found via assignment, check if exam has assigned test series directly
      if (examQuestions.length === 0) {
        // Try to find questions linked to the exam directly (for demo/testing purposes only)
        const allQuestions = await db.select().from(testQuestions).limit(100);
        if (allQuestions.length > 0) {
          examQuestions = allQuestions;
          console.log(`[Questions] Using ${allQuestions.length} questions from available test series for demo`);
        }
      }
      
      // Return questions - use demo only if no real questions exist in the system
      const questions = examQuestions.length > 0 ? examQuestions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC || "",
        optionD: q.optionD || "",
      })) : [
        { id: 1, questionText: "[DEMO] What is the capital of India?", optionA: "Mumbai", optionB: "New Delhi", optionC: "Kolkata", optionD: "Chennai" },
        { id: 2, questionText: "[DEMO] Which planet is known as the Red Planet?", optionA: "Earth", optionB: "Mars", optionC: "Jupiter", optionD: "Venus" },
        { id: 3, questionText: "[DEMO] What is 25 × 4?", optionA: "75", optionB: "100", optionC: "90", optionD: "80" },
        { id: 4, questionText: "[DEMO] Who wrote the Indian National Anthem?", optionA: "Bankim Chandra", optionB: "Rabindranath Tagore", optionC: "Sarojini Naidu", optionD: "Jawaharlal Nehru" },
        { id: 5, questionText: "[DEMO] What is the chemical symbol for Gold?", optionA: "Go", optionB: "Gd", optionC: "Au", optionD: "Ag" },
      ];
      
      // Log question source for debugging
      console.log(`[Questions] Serving ${questions.length} questions for session ${session.id}, assignment testSeriesId: ${assignment?.testSeriesId || 'not set'}`);
      
      res.json({ 
        questions, 
        papers: papers.map(p => ({ id: p.id, paperName: p.paperName, subject: p.subject, totalQuestions: p.totalQuestions, totalMarks: p.totalMarks, duration: p.durationMinutes })), 
        session,
        centerCode: center.centerCode,
      });
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Save student responses
  app.post("/api/student-exam/:token/save-response", async (req, res) => {
    try {
      const [session] = await db.select().from(studentExamSessions).where(eq(studentExamSessions.sessionToken, req.params.token));
      if (!session || session.status !== "IN_PROGRESS") return res.status(403).json({ message: "Cannot save - exam not in progress" });
      await db.update(studentExamSessions).set({ responses: req.body.responses, attempted: req.body.responses.filter((r: any) => r.selectedAnswer).length, updatedAt: new Date() }).where(eq(studentExamSessions.id, session.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving response:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Submit student exam
  app.post("/api/student-exam/:token/submit", async (req, res) => {
    try {
      const [session] = await db.select().from(studentExamSessions).where(eq(studentExamSessions.sessionToken, req.params.token));
      if (!session) return res.status(404).json({ message: "Session not found" });
      const { responses, totalQuestions } = req.body;
      const [updated] = await db.update(studentExamSessions).set({ status: "SUBMITTED", responses, totalQuestions, attempted: responses.filter((r: any) => r.selectedAnswer).length, submissionTime: new Date(), examEndTime: new Date(), updatedAt: new Date() }).where(eq(studentExamSessions.id, session.id)).returning();
      res.json({ success: true, session: updated });
    } catch (error) {
      console.error("Error submitting exam:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Main Admin: Get all center sync status
  app.get("/api/admin/center-sync-status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const centers = await db.select().from(examCentersTable);
      const result = await Promise.all(centers.map(async (center) => {
        const synced = await db.select({ count: sql`count(*)` }).from(studentExamSessions).where(and(eq(studentExamSessions.centerId, center.id), eq(studentExamSessions.syncedToMain, true)));
        const unsynced = await db.select({ count: sql`count(*)` }).from(studentExamSessions).where(and(eq(studentExamSessions.centerId, center.id), eq(studentExamSessions.syncedToMain, false)));
        return { ...center, adminPassword: undefined, syncedCount: Number(synced[0]?.count || 0), unsyncedCount: Number(unsynced[0]?.count || 0) };
      }));
      res.json(result);
    } catch (error) {
      console.error("Error fetching sync status:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Main Admin: Assign exam to center
  app.post("/api/admin/assign-exam-to-center", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { centerId, examId, shiftId, assignedCandidates, reportingTime, gateClosingTime } = req.body;
      const [assignment] = await db.insert(centerExamAssignments).values({ centerId, examId, shiftId, assignedCandidates: assignedCandidates || 0, reportingTime, gateClosingTime, isActive: true }).returning();
      res.json(assignment);
    } catch (error) {
      console.error("Error assigning exam to center:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // =====================================================
  // SEB ADMIN ROUTES (Separate from Registration Portal)
  // =====================================================

  // SEB Admin Login
  app.post("/api/seb-admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Check for default admin or database admin
      if (username === "sebadmin" && password === "seb@2024") {
        // Create default admin session
        (req.session as any).isSEBAdmin = true;
        (req.session as any).sebAdminUsername = "sebadmin";
        return res.json({ success: true, message: "Login successful" });
      }
      
      const [admin] = await db.select().from(sebAdminUsers).where(eq(sebAdminUsers.username, username));
      if (!admin) return res.status(401).json({ success: false, message: "Invalid credentials" });
      
      const isValid = await bcrypt.compare(password, admin.password);
      if (!isValid) return res.status(401).json({ success: false, message: "Invalid credentials" });
      
      (req.session as any).isSEBAdmin = true;
      (req.session as any).sebAdminId = admin.id;
      (req.session as any).sebAdminUsername = admin.username;
      
      await db.update(sebAdminUsers).set({ lastLoginAt: new Date() }).where(eq(sebAdminUsers.id, admin.id));
      
      res.json({ success: true, message: "Login successful" });
    } catch (error) {
      console.error("SEB Admin login error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });

  // SEB Admin Session Check
  app.get("/api/seb-admin/session", (req, res) => {
    if ((req.session as any).isSEBAdmin) {
      res.json({ authenticated: true, username: (req.session as any).sebAdminUsername });
    } else {
      res.json({ authenticated: false });
    }
  });

  // SEB Admin Logout
  app.post("/api/seb-admin/logout", (req, res) => {
    (req.session as any).isSEBAdmin = false;
    (req.session as any).sebAdminId = null;
    (req.session as any).sebAdminUsername = null;
    res.json({ success: true });
  });

  // SEB Admin Middleware
  const isSEBAdmin = (req: Request, res: Response, next: NextFunction) => {
    if ((req.session as any).isSEBAdmin) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  };

  // Get SEB Exams
  app.get("/api/seb-admin/exams", isSEBAdmin, async (req, res) => {
    try {
      const exams = await db.select().from(sebExams).orderBy(desc(sebExams.createdAt));
      res.json({ exams });
    } catch (error) {
      console.error("Error fetching SEB exams:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Create SEB Exam
  app.post("/api/seb-admin/exams", isSEBAdmin, async (req, res) => {
    try {
      const { examCode, title, examDate, startTime, duration, totalMarks, passingMarks, negativeMarking, instructions } = req.body;
      const [exam] = await db.insert(sebExams).values({
        examCode,
        title,
        examDate: new Date(examDate),
        startTime,
        duration,
        totalMarks,
        passingMarks,
        negativeMarking,
        instructions,
        isActive: true,
      }).returning();
      res.json({ success: true, exam });
    } catch (error) {
      console.error("Error creating SEB exam:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Bulk operations for exams
  app.post("/api/seb-admin/exams/bulk", isSEBAdmin, async (req, res) => {
    try {
      const { action, ids } = req.body;
      if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid request" });
      }

      let affected = 0;
      if (action === "activate") {
        await db.update(sebExams).set({ isActive: true }).where(sql`${sebExams.id} = ANY(${ids})`);
        affected = ids.length;
      } else if (action === "deactivate") {
        await db.update(sebExams).set({ isActive: false }).where(sql`${sebExams.id} = ANY(${ids})`);
        affected = ids.length;
      } else if (action === "delete") {
        await db.delete(sebExams).where(sql`${sebExams.id} = ANY(${ids})`);
        affected = ids.length;
      }

      res.json({ success: true, affected });
    } catch (error) {
      console.error("Error bulk operation exams:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get SEB Centers (uses existing exam centers table)
  app.get("/api/seb-admin/centers", isSEBAdmin, async (req, res) => {
    try {
      const centers = await db.select().from(examCentersTable).orderBy(examCentersTable.centerCode);
      res.json({ centers });
    } catch (error) {
      console.error("Error fetching centers:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Upload Centers CSV
  app.post("/api/seb-admin/centers/upload", isSEBAdmin, async (req, res) => {
    try {
      const { csvData } = req.body;
      const lines = csvData.trim().split("\n");
      let imported = 0;
      
      for (const line of lines) {
        const [centerCode, centerName, city, state, address, capacity, adminUsername, adminPassword] = line.split(",").map((s: string) => s.trim());
        if (!centerCode || !centerName) continue;
        
        const hashedPassword = await bcrypt.hash(adminPassword || "center123", 12);
        
        await db.insert(examCentersTable).values({
          centerCode,
          centerName,
          city: city || "",
          state: state || "",
          address: address || "",
          capacity: parseInt(capacity) || 100,
          adminUsername: adminUsername || centerCode.toLowerCase(),
          adminPassword: hashedPassword,
          isActive: true,
        }).onConflictDoNothing();
        imported++;
      }
      
      res.json({ success: true, imported });
    } catch (error) {
      console.error("Error uploading centers:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get SEB Students
  app.get("/api/seb-admin/students", isSEBAdmin, async (req, res) => {
    try {
      const students = await db.select().from(sebStudents).orderBy(sebStudents.rollNumber);
      res.json({ students });
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Upload Students CSV
  app.post("/api/seb-admin/students/upload", isSEBAdmin, async (req, res) => {
    try {
      const { csvData } = req.body;
      const lines = csvData.trim().split("\n");
      let imported = 0;
      
      for (const line of lines) {
        const [rollNumber, name, email, phone, centerCode, examCode, shift] = line.split(",").map((s: string) => s.trim());
        if (!rollNumber || !name) continue;
        
        await db.insert(sebStudents).values({
          rollNumber,
          name,
          email: email || "",
          phone: phone || "",
          centerCode: centerCode || "",
          examCode: examCode || "",
          shift: shift || "Shift 1",
          password: rollNumber, // Default password is roll number
          isActive: true,
        }).onConflictDoNothing();
        imported++;
      }
      
      res.json({ success: true, imported });
    } catch (error) {
      console.error("Error uploading students:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Bulk operations for students
  app.post("/api/seb-admin/students/bulk", isSEBAdmin, async (req, res) => {
    try {
      const { action, ids } = req.body;
      if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid request" });
      }

      let affected = 0;
      if (action === "activate") {
        await db.update(sebStudents).set({ isActive: true }).where(sql`${sebStudents.id} = ANY(${ids})`);
        affected = ids.length;
      } else if (action === "deactivate") {
        await db.update(sebStudents).set({ isActive: false }).where(sql`${sebStudents.id} = ANY(${ids})`);
        affected = ids.length;
      } else if (action === "delete") {
        await db.delete(sebStudents).where(sql`${sebStudents.id} = ANY(${ids})`);
        affected = ids.length;
      }

      res.json({ success: true, affected });
    } catch (error) {
      console.error("Error bulk operation students:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get SEB Question Papers
  app.get("/api/seb-admin/question-papers", isSEBAdmin, async (req, res) => {
    try {
      const papers = await db.select().from(sebQuestionPapers).orderBy(desc(sebQuestionPapers.createdAt));
      res.json({ papers });
    } catch (error) {
      console.error("Error fetching question papers:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Create Encrypted Question Paper
  app.post("/api/seb-admin/question-papers", isSEBAdmin, async (req, res) => {
    try {
      const { paperCode, examCode, subject, questionsJson, encryptionPassword } = req.body;
      
      // Parse and validate questions
      let questions;
      try {
        questions = JSON.parse(questionsJson);
      } catch {
        return res.status(400).json({ message: "Invalid JSON format for questions" });
      }
      
      // Encrypt questions using AES-256
      const salt = crypto.randomBytes(16).toString("hex");
      const key = crypto.scryptSync(encryptionPassword, salt, 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
      let encrypted = cipher.update(JSON.stringify(questions), "utf8", "hex");
      encrypted += cipher.final("hex");
      
      // Store encrypted data with IV prepended
      const encryptedData = iv.toString("hex") + ":" + encrypted;
      
      const [paper] = await db.insert(sebQuestionPapers).values({
        paperCode,
        examCode,
        subject,
        encryptedData,
        encryptionSalt: salt,
        questionCount: questions.length,
        isActive: true,
      }).returning();
      
      res.json({ success: true, paper: { ...paper, encryptedData: undefined } });
    } catch (error) {
      console.error("Error creating question paper:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get Monitor Data
  app.get("/api/seb-admin/monitor", isSEBAdmin, async (req, res) => {
    try {
      // Get center status
      const centers = await db.select().from(examCentersTable);
      const centersWithStatus = centers.map(c => ({
        ...c,
        adminPassword: undefined,
        isOnline: c.lastSyncAt && (new Date().getTime() - new Date(c.lastSyncAt).getTime()) < 5 * 60 * 1000, // Online if synced in last 5 mins
        lastSync: c.lastSyncAt,
      }));
      
      // Get live sessions
      const liveSessions = await db.select().from(studentExamSessions).where(eq(studentExamSessions.status, "IN_PROGRESS")).limit(20);
      const sessionsWithDetails = await Promise.all(liveSessions.map(async (session) => {
        const [candidate] = await db.select().from(examCandidates).where(eq(examCandidates.id, session.candidateId));
        const [center] = await db.select().from(examCentersTable).where(eq(examCentersTable.id, session.centerId));
        const responses = session.responses as any[] || [];
        return {
          id: session.id,
          studentName: candidate?.name || "Unknown",
          rollNumber: candidate?.rollNumber || "",
          centerCode: center?.centerCode || "",
          progress: session.totalQuestions ? Math.round((responses.filter(r => r.selectedAnswer).length / session.totalQuestions) * 100) : 0,
        };
      }));
      
      // Get recent sync logs
      const syncLogs = await db.select().from(centerSyncLogs).orderBy(desc(centerSyncLogs.startedAt)).limit(20);
      const logsWithDetails = await Promise.all(syncLogs.map(async (log) => {
        const [center] = await db.select().from(examCentersTable).where(eq(examCentersTable.id, log.centerId));
        return {
          id: log.id,
          centerCode: center?.centerCode || "Unknown",
          syncType: log.syncType,
          recordCount: log.recordsUploaded,
          status: log.status,
          syncTime: log.startedAt,
        };
      }));
      
      res.json({
        centers: centersWithStatus,
        liveSessions: sessionsWithDetails,
        syncLogs: logsWithDetails,
      });
    } catch (error) {
      console.error("Error fetching monitor data:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get SEB Settings
  app.get("/api/seb-admin/settings", isSEBAdmin, async (req, res) => {
    try {
      const settings = await db.select().from(sebSettings);
      const settingsMap: Record<string, string> = {};
      settings.forEach(s => { settingsMap[s.key] = s.value || ""; });
      res.json(settingsMap);
    } catch (error) {
      console.error("Error fetching SEB settings:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Update SEB Settings
  app.put("/api/seb-admin/settings", isSEBAdmin, async (req, res) => {
    try {
      const settings = req.body;
      for (const [key, value] of Object.entries(settings)) {
        await db.insert(sebSettings).values({ key, value: value as string }).onConflictDoUpdate({
          target: sebSettings.key,
          set: { value: value as string, updatedAt: new Date() },
        });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating SEB settings:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Upload student photo/signature
  app.post("/api/seb-admin/students/:id/upload", isSEBAdmin, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const { photoUrl, signatureUrl } = req.body;
      
      const updateData: any = {};
      if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
      if (signatureUrl !== undefined) updateData.signatureUrl = signatureUrl;
      
      const [updated] = await db.update(sebStudents).set(updateData).where(eq(sebStudents.id, studentId)).returning();
      res.json({ success: true, student: updated });
    } catch (error) {
      console.error("Error uploading student media:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Get single student details (for student panel)
  app.get("/api/seb-student/:rollNumber", async (req, res) => {
    try {
      const [student] = await db.select().from(sebStudents).where(eq(sebStudents.rollNumber, req.params.rollNumber));
      if (!student) return res.status(404).json({ message: "Student not found" });
      res.json({ 
        id: student.id,
        rollNumber: student.rollNumber,
        name: student.name,
        email: student.email,
        phone: student.phone,
        centerCode: student.centerCode,
        examCode: student.examCode,
        shift: student.shift,
        photoUrl: student.photoUrl,
        signatureUrl: student.signatureUrl,
      });
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Seed default settings
  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  // Seed admin user first
  const adminEmail = "admin@portal.gov.in";
  const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
  if (existingAdmin.length === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 12);
    await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    });
    console.log("Admin user created: admin@portal.gov.in / admin123");
  }

  // Seed default site settings
  const portalName = await storage.getSetting("portalName");
  if (!portalName) {
    await storage.setSetting("portalName", "Examination Portal");
    await storage.setSetting("portalTagline", "Government of India");
    await storage.setSetting("portalDescription", "Official portal for government examinations");
    await storage.setSetting("contactEmail", "support@portal.gov.in");
    await storage.setSetting("contactPhone", "1800-XXX-XXXX");
    await storage.setSetting("heroTitle", "Welcome to Examination Portal");
    await storage.setSetting("heroSubtitle", "Apply for Government Examinations Online");
    await storage.setSetting("marqueeText", "Welcome to the Official Government Examination Portal. Apply for various competitive exams online.");
    await storage.setSetting("footerText", "Government of India - All Rights Reserved");
    await storage.setSetting("importantLinks", [
      { title: "Ministry of Personnel", url: "#" },
      { title: "Government of India", url: "#" }
    ]);
  }

  // Seed sample exams with full data
  const existingExams = await storage.getExams();
  if (existingExams.length === 0) {
    await storage.createExam({
      code: "CGL-2024",
      title: "Combined Graduate Level Examination, 2024",
      description: "Staff Selection Commission will hold Combined Graduate Level Examination, 2024 for filling up of various Group 'B' and Group 'C' posts in different Ministries/ Departments/ Organizations.",
      conductingBody: "SSC",
      postName: "Group B & C Posts",
      advertisementNumber: "HQ-PPI03/11/2024-CGL",
      totalVacancies: 17727,
      applyStartDate: new Date("2024-06-24"),
      applyEndDate: new Date("2025-07-27"),
      feeLastDate: new Date("2025-07-27"),
      examDate: new Date("2025-09-15"),
      minAge: 18,
      maxAge: 32,
      educationRequired: "Graduate from recognized university",
      fees: { general: 100, obc: 100, sc: 0, st: 0, female: 0, pwd: 0 },
      paymentMode: "ONLINE",
      documentsRequired: { photo: { required: true }, signature: { required: true }, idProof: { required: true } },
      isActive: true,
      isDraft: false,
    });
    
    await storage.createExam({
      code: "CHSL-2024",
      title: "Combined Higher Secondary (10+2) Level Examination, 2024",
      description: "Recruitment to the posts of Lower Divisional Clerk/ Junior Secretariat Assistant, and Data Entry Operators.",
      conductingBody: "SSC",
      postName: "LDC/DEO",
      advertisementNumber: "HQ-PPI03/10/2024-CHSL",
      totalVacancies: 3712,
      applyStartDate: new Date("2024-04-08"),
      applyEndDate: new Date("2025-05-07"),
      feeLastDate: new Date("2025-05-07"),
      examDate: new Date("2025-07-01"),
      minAge: 18,
      maxAge: 27,
      educationRequired: "12th Pass from recognized board",
      fees: { general: 100, obc: 100, sc: 0, st: 0, female: 0, pwd: 0 },
      paymentMode: "ONLINE",
      documentsRequired: { photo: { required: true }, signature: { required: true }, idProof: { required: true } },
      isActive: true,
      isDraft: false,
    });
  }

  const existingNotices = await storage.getNotices();
  if (existingNotices.length === 0) {
    await storage.createNotice({
      title: "Notice for CGL 2024 Examination",
      content: "The Commission has decided to conduct the CGL 2024 Exam from 15th Sep 2025.",
      type: "NOTIFICATION",
      isNew: true,
      isActive: true,
    });
    await storage.createNotice({
      title: "Result of CHSL 2023 Tier-I",
      content: "Click here to download the result PDF.",
      type: "RESULT",
      isNew: true,
      isActive: true,
    });
    await storage.createNotice({
      title: "Admit Card for CPO 2024",
      content: "Download your admit card now.",
      type: "ADMIT_CARD",
      isNew: false,
      isActive: true,
    });
  }
}
