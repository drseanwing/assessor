import cron from "node-cron";
import { config } from "./config.js";
import { syncAll } from "./services/sync.js";
import { sendAllDailyReports } from "./services/email-sender.js";
import { isRediSyncConfigured, isRediEmailConfigured } from "./services/redi-api.js";

export function startCronJobs(): void {
  const enabledJobs: string[] = [];

  if (isRediSyncConfigured()) {
    cron.schedule(config.syncCron, async () => {
      console.log(`[CRON] Starting scheduled sync at ${new Date().toISOString()}`);
      try {
        const result = await syncAll();
        console.log(
          `[CRON] Sync complete: ${result.courses.synced} courses, ${result.participants.synced} participants`
        );
      } catch (err) {
        console.error("[CRON] Scheduled sync failed:", err);
      }
    });
    enabledJobs.push(`  Sync:    ${config.syncCron}`);
  } else {
    console.log(`[CRON] REdI sync not configured - skipping sync cron job`);
  }

  if (isRediEmailConfigured()) {
    cron.schedule(config.reportCron, async () => {
      console.log(
        `[CRON] Starting scheduled report generation at ${new Date().toISOString()}`
      );
      try {
        const sent = await sendAllDailyReports();
        console.log(`[CRON] Sent ${sent} daily reports`);
      } catch (err) {
        console.error("[CRON] Scheduled report generation failed:", err);
      }
    });
    enabledJobs.push(`  Reports: ${config.reportCron}`);
  } else {
    console.log(`[CRON] REdI email not configured - skipping report cron job`);
  }

  if (enabledJobs.length > 0) {
    console.log(`Cron jobs started:`);
    enabledJobs.forEach(job => console.log(job));
  } else {
    console.log(`No cron jobs started - REdI integration not configured`);
  }
}
