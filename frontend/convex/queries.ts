/**
 * MKS Agencies E-commerce - Convex Queries
 * 
 * Public and authenticated queries for data access.
 * Public queries can be accessed without authentication (product data, etc.)
 * Authenticated queries require a valid user session.
 * 
 * @see https://docs.convex.dev/functions/query-functions
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

// ==================== PUBLIC QUERIES ====================

// needs opotimization past workflow uses static build products.json and github pat token to change that to edit products in admin page but now that everything in convex we can incorporate things like getting only what products we need using queries will do it later 

// ==================== PRODUCT QUERIES ====================

/**
 * Get all active products for public storefront
 */
export const getAllProducts = query({
    args: {},
    handler: async (ctx) => {
        const products = await ctx.db
            .query("products")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .collect();

        // Map to frontend format (use productId as "id" for backwards compatibility)
        return products.map((p) => ({
            ...p,
            id: p.productId,
        }));
    },
});

/**
 * Get product by slug
 */
export const getProductBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        const product = await ctx.db
            .query("products")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        if (!product) return null;

        return {
            ...product,
            id: product.productId,
        };
    },
});

/**
 * Get all distinct categories from active products
 */
export const getProductCategories = query({
    args: {},
    handler: async (ctx) => {
        const products = await ctx.db
            .query("products")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .collect();

        const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
        return categories.sort();
    },
});

/**
 * Get all products for admin (including inactive)
 */
export const getAllProductsAdmin = query({
    args: {},
    handler: async (ctx) => {
        const products = await ctx.db
            .query("products")
            .collect();

        return products.map((p) => ({
            ...p,
            id: p.productId,
        }));
    },
});



/**
 * Get order analytics for admin dashboard
 * This is protected by admin auth in the Worker, not here
 */
export const getOrderAnalytics = query({
    args: {},
    handler: async (ctx) => {
        const orders = await ctx.db.query("orders").collect();

        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
        const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

        const analytics = {
            totalOrders: orders.length,
            pendingVerification: 0,
            paymentVerified: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
            failed: 0,
            verifiedRevenue: 0,
            completedRevenue: 0,
            ordersToday: 0,
            ordersWeek: 0,
            ordersMonth: 0,
        };

        for (const order of orders) {
            // Status counts
            switch (order.status) {
                case 'PENDING_VERIFICATION': analytics.pendingVerification++; break;
                case 'PAYMENT_VERIFIED': analytics.paymentVerified++; break;
                case 'PROCESSING': analytics.processing++; break;
                case 'SHIPPED': analytics.shipped++; break;
                case 'DELIVERED': analytics.delivered++; break;
                case 'CANCELLED': analytics.cancelled++; break;
                case 'FAILED': analytics.failed++; break;
            }

            // Revenue calculations
            if (['PAYMENT_VERIFIED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
                analytics.verifiedRevenue += order.total;
            }
            if (order.status === 'DELIVERED') {
                analytics.completedRevenue += order.total;
            }

            // Time-based counts
            if (order.createdAt >= oneDayAgo) analytics.ordersToday++;
            if (order.createdAt >= oneWeekAgo) analytics.ordersWeek++;
            if (order.createdAt >= oneMonthAgo) analytics.ordersMonth++;
        }

        return analytics;
    },
});

/**
 * Get all orders for admin dashboard (paginated)
 */
export const getAllOrders = query({
    args: {
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let ordersQuery = ctx.db.query("orders").order("desc");

        if (args.status) {
            ordersQuery = ctx.db.query("orders")
                .withIndex("by_status", (q) => q.eq("status", args.status as string))
                .order("desc");
        }

        const orders = await ordersQuery.take(args.limit || 50);

        // Fetch items for each order
        const ordersWithItems = await Promise.all(
            orders.map(async (order) => {
                const items = await ctx.db
                    .query("orderItems")
                    .withIndex("by_order", (q) => q.eq("orderId", order._id))
                    .collect();
                return { ...order, items };
            })
        );

        return ordersWithItems;
    },
});

/**
 * Get single order by ID with items and status history
 */
export const getOrderById = query({
    args: { orderId: v.id("orders") },
    handler: async (ctx, args) => {
        const order = await ctx.db.get(args.orderId);
        if (!order) return null;

        const items = await ctx.db
            .query("orderItems")
            .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
            .collect();

        const history = await ctx.db
            .query("orderStatusHistory")
            .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
            .collect();

        return { ...order, items, history };
    },
});

/**
 * Get order by order number (for tracking)
 */
export const getOrderByNumber = query({
    args: { orderNumber: v.string() },
    handler: async (ctx, args) => {
        const order = await ctx.db
            .query("orders")
            .withIndex("by_order_number", (q) => q.eq("orderNumber", args.orderNumber))
            .first();

        if (!order) return null;

        const items = await ctx.db
            .query("orderItems")
            .withIndex("by_order", (q) => q.eq("orderId", order._id))
            .collect();

        const history = await ctx.db
            .query("orderStatusHistory")
            .withIndex("by_order", (q) => q.eq("orderId", order._id))
            .collect();

        return { ...order, items, history };
    },
});

// ==================== USER QUERIES ====================

/**
 * Get user by email
 */
export const getUserByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();
    },
});

/**
 * Get user by provider and provider ID (for OAuth)
 */
export const getUserByProvider = query({
    args: {
        provider: v.string(),
        providerId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_provider_id", (q) =>
                q.eq("provider", args.provider).eq("providerId", args.providerId)
            )
            .first();
    },
});

/**
 * Get orders for a specific user
 */
export const getUserOrders = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const orders = await ctx.db
            .query("orders")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();

        const ordersWithItems = await Promise.all(
            orders.map(async (order) => {
                const items = await ctx.db
                    .query("orderItems")
                    .withIndex("by_order", (q) => q.eq("orderId", order._id))
                    .collect();
                return { ...order, items };
            })
        );

        return ordersWithItems;
    },
});

/**
 * Get user's wishlist
 */
export const getWishlist = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("wishlist")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});

/**
 * Get user's cart
 */
export const getCart = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("cart")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});

/**
 * Check if product is in wishlist
 */
export const isInWishlist = query({
    args: {
        userId: v.id("users"),
        productId: v.string(),
    },
    handler: async (ctx, args) => {
        const item = await ctx.db
            .query("wishlist")
            .withIndex("by_user_product", (q) =>
                q.eq("userId", args.userId).eq("productId", args.productId)
            )
            .first();
        return !!item;
    },
});
