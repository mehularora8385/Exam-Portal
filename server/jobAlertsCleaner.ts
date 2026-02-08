import { db } from "./db";
import { sql } from "drizzle-orm";

export async function cleanupExpiredJobAlerts() {
  try {
    // 1. Mark jobs as inactive where application end date has passed
    await db.execute(sql`
      UPDATE job_alerts 
      SET is_active = false, is_new = false 
      WHERE application_end_date < NOW() 
      AND application_end_date IS NOT NULL
      AND is_active = true
    `);
    
    console.log(`[JobCleaner] Deactivated expired job alerts`);

    // 2. Remove "New" badge from jobs older than 7 days
    await db.execute(sql`
      UPDATE job_alerts 
      SET is_new = false 
      WHERE created_at < NOW() - INTERVAL '7 days'
      AND is_new = true
    `);
    
    console.log(`[JobCleaner] Removed 'New' badge from old alerts`);

    // 3. Delete very old inactive jobs (older than 60 days past their end date)
    await db.execute(sql`
      DELETE FROM job_alerts 
      WHERE application_end_date < NOW() - INTERVAL '60 days'
      AND is_active = false
    `);
    
    console.log(`[JobCleaner] Removed old expired job alerts (60+ days old)`);

    return { success: true };
  } catch (error) {
    console.error("[JobCleaner] Error during cleanup:", error);
    return { success: false, error };
  }
}

export function startJobAlertsCleanupScheduler() {
  // Run cleanup immediately on startup
  cleanupExpiredJobAlerts();
  
  // Run cleanup every hour (3600000 ms)
  const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  
  setInterval(() => {
    console.log("[JobCleaner] Running scheduled cleanup...");
    cleanupExpiredJobAlerts();
  }, CLEANUP_INTERVAL);
  
  console.log("[JobCleaner] Scheduler started - will run every hour");
}
