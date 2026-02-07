/**
 * MKS Agencies E-commerce - Convex File Storage
 * 
 * Handles file uploads for product images using Convex's built-in storage.
 * 
 * @see https://docs.convex.dev/file-storage
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Generate an upload URL for client-side file upload
 * This creates a short-lived URL that allows direct upload to Convex storage
 */
export const generateUploadUrl = mutation({
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

/**
 * Get the public URL for a stored file
 * Use this to convert a storage ID to a URL that can be used in img tags
 */
export const getFileUrl = query({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});

/**
 * Get URLs for multiple storage IDs
 * Useful for product images array
 */
export const getFileUrls = query({
    args: { storageIds: v.array(v.id("_storage")) },
    handler: async (ctx, args) => {
        const urls = await Promise.all(
            args.storageIds.map(async (id) => {
                return await ctx.storage.getUrl(id);
            })
        );
        return urls.filter(Boolean);
    },
});

/**
 * Delete a file from storage
 */
export const deleteFile = mutation({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        await ctx.storage.delete(args.storageId);
        return { success: true };
    },
});
