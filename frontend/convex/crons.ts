/**
 * MKS Agencies E-commerce - Convex Cron Jobs
 *
 * Scheduled recurring tasks for platform maintenance.
 *
 * @see https://docs.convex.dev/scheduling/cron-jobs
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Daily cleanup of orphaned images in Convex file storage.
 *
 * Runs every day at 2:30 AM UTC (8:00 AM IST).
 * Identifies stored files not referenced by any product's images array
 * and deletes them to free up storage. Includes a 24-hour grace period
 * so recently uploaded files (e.g., mid-upload or being assigned to a
 * product) are never accidentally deleted.
 */
crons.daily(
    "cleanup orphaned product images",
    { hourUTC: 2, minuteUTC: 30 },
    internal.maintenance.cleanupOrphanedImages,
);

export default crons;
