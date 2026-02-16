/**
 * MKS Agencies E-commerce - Convex Maintenance Functions
 *
 * Internal functions for automated platform maintenance tasks.
 * These are called exclusively by cron jobs and cannot be invoked
 * from the client.
 *
 * @see https://docs.convex.dev/functions/internal-functions
 * @see https://docs.convex.dev/scheduling/cron-jobs
 */

import { internalMutation } from "./_generated/server";

// ==================== FILE STORAGE CLEANUP ====================

/**
 * Grace period in milliseconds — files uploaded less than this long ago
 * are never deleted, even if not yet referenced by any product.
 *
 * This protects files that are:
 * - Being uploaded as part of a multi-image upload
 * - Uploaded via JSON paste and waiting for the product to be saved
 * - In the middle of any asynchronous workflow
 */
const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Clean up orphaned images from Convex file storage.
 *
 * Strategy:
 * 1. Collect ALL image URLs referenced by ANY product (active or inactive).
 * 2. Query every file in the _storage system table.
 * 3. For each stored file:
 *    a. Skip if uploaded within the grace period (safety net).
 *    b. Resolve its public URL via ctx.storage.getUrl().
 *    c. If the URL is not found in any product's images array → delete.
 * 4. Return a summary of what was cleaned up (for dashboard logs).
 *
 * Safety guarantees:
 * - Only deletes files with NO product references whatsoever.
 * - 24-hour grace period prevents race conditions with active uploads.
 * - Runs as an internalMutation — atomic, exactly-once execution.
 * - Operates on ALL products (including inactive/draft) to prevent
 *   accidental deletion of images for products that are temporarily
 *   deactivated.
 *
 * @returns Summary object with counts and details.
 */
export const cleanupOrphanedImages = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();

        // ── Step 1: Collect all image URLs used by ANY product ──────────

        const allProducts = await ctx.db.query("products").collect();

        const referencedUrls = new Set<string>();
        for (const product of allProducts) {
            if (product.images && Array.isArray(product.images)) {
                for (const url of product.images) {
                    if (typeof url === "string" && url.length > 0) {
                        referencedUrls.add(url);
                    }
                }
            }
        }

        // ── Step 2: Query all files in _storage system table ────────────

        const allStoredFiles = await ctx.db.system
            .query("_storage")
            .collect();

        // ── Step 3: Identify and delete orphaned files ──────────────────

        let deletedCount = 0;
        let skippedGracePeriod = 0;
        let skippedReferenced = 0;
        let skippedNoUrl = 0;

        // Process in batches to stay within Convex mutation limits.
        // Convex mutations have a time limit, so we cap deletions per run.
        const MAX_DELETIONS_PER_RUN = 100;

        for (const file of allStoredFiles) {
            // Stop if we've hit the per-run limit to avoid mutation timeout
            if (deletedCount >= MAX_DELETIONS_PER_RUN) break;

            // Safety: Skip files uploaded within the grace period
            if (file._creationTime && now - file._creationTime < GRACE_PERIOD_MS) {
                skippedGracePeriod++;
                continue;
            }

            // Resolve the file's public URL
            const fileUrl = await ctx.storage.getUrl(file._id);
            if (!fileUrl) {
                // File has no URL (possibly corrupted entry) — skip, don't delete
                skippedNoUrl++;
                continue;
            }

            // Check if this file URL is referenced by any product
            if (referencedUrls.has(fileUrl)) {
                skippedReferenced++;
                continue;
            }

            // Not referenced by any product → safe to delete
            await ctx.storage.delete(file._id);
            deletedCount++;
        }

        // ── Step 4: Return summary for logs/dashboard ───────────────────

        return {
            success: true,
            timestamp: now,
            summary: {
                totalStoredFiles: allStoredFiles.length,
                totalProductImages: referencedUrls.size,
                totalProducts: allProducts.length,
                deletedOrphans: deletedCount,
                skippedReferencedByProduct: skippedReferenced,
                skippedWithinGracePeriod: skippedGracePeriod,
                skippedNoUrl: skippedNoUrl,
                hitDeletionLimit: deletedCount >= MAX_DELETIONS_PER_RUN,
            },
        };
    },
});
