/**
 * MKS Agency E-commerce - Convex Schema
 * 
 * This schema defines the database structure for the e-commerce platform.
 * Tables include users, orders, order items, cart, wishlist, and status history.
 * 
 * @see https://docs.convex.dev/database/schemas
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    /**
     * Users table - stores registered and guest users
     * 
     * Auth providers: 'google' | 'email' | 'guest'
     * Guest users have isGuest=true and may have verification tokens
     */
    users: defineTable({
        email: v.string(),
        name: v.optional(v.string()),
        phone: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        provider: v.string(), // 'google' | 'email' | 'guest'
        providerId: v.optional(v.string()), // Google sub ID or verification token
        emailVerified: v.boolean(),
        isGuest: v.boolean(),
        isAdmin: v.optional(v.boolean()),
        verificationToken: v.optional(v.string()),
        verificationExpires: v.optional(v.number()), // timestamp
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_email", ["email"])
        .index("by_provider_id", ["provider", "providerId"])
        .index("by_verification_token", ["verificationToken"]),

    /**
     * Orders table - stores all customer orders
     * 
     * Order Status Flow:
     * PENDING_VERIFICATION -> PAYMENT_VERIFIED -> PROCESSING -> SHIPPED -> DELIVERED
     * Can transition to CANCELLED or FAILED at any stage
     */
    orders: defineTable({
        orderNumber: v.string(), // Format: MKS-YYYYMMDD-XXXX
        userId: v.optional(v.id("users")),
        guestEmail: v.optional(v.string()), // For guest orders
        status: v.string(), // PENDING_VERIFICATION | PAYMENT_VERIFIED | PROCESSING | SHIPPED | DELIVERED | CANCELLED | FAILED

        // Pricing
        subtotal: v.number(),
        shippingFee: v.number(),
        discount: v.optional(v.number()),
        total: v.number(),

        // Shipping details
        shippingName: v.string(),
        shippingPhone: v.string(),
        shippingEmail: v.string(),
        shippingAddress: v.string(),
        shippingCity: v.string(),
        shippingState: v.string(),
        shippingPostal: v.string(),
        shippingCountry: v.optional(v.string()),

        // Tracking
        trackingUrl: v.optional(v.string()),
        trackingNumber: v.optional(v.string()),
        courierName: v.optional(v.string()),

        // Status details
        failureReason: v.optional(v.string()),
        cancellationReason: v.optional(v.string()),
        adminNotes: v.optional(v.string()),

        // Timestamps
        createdAt: v.number(),
        updatedAt: v.number(),
        shippedAt: v.optional(v.number()),
        deliveredAt: v.optional(v.number()),
    })
        .index("by_user", ["userId"])
        .index("by_order_number", ["orderNumber"])
        .index("by_status", ["status"])
        .index("by_guest_email", ["guestEmail"])
        .index("by_created_at", ["createdAt"]),

    /**
     * Order Items - line items for each order
     */
    orderItems: defineTable({
        orderId: v.id("orders"),
        productId: v.string(), // References product slug from products.json
        productName: v.string(),
        productSlug: v.string(),
        productImage: v.optional(v.string()),
        productPrice: v.number(),
        quantity: v.number(),
        subtotal: v.number(),
    })
        .index("by_order", ["orderId"]),

    /**
     * Order Status History - tracks all status changes for timeline view
     */
    orderStatusHistory: defineTable({
        orderId: v.id("orders"),
        status: v.string(),
        note: v.optional(v.string()),
        changedBy: v.string(), // 'system' | 'admin' | 'user'
        createdAt: v.number(),
    })
        .index("by_order", ["orderId"]),

    /**
     * Wishlist - saved products for authenticated users
     */
    wishlist: defineTable({
        userId: v.id("users"),
        productId: v.string(), // References product slug from products.json
        productData: v.object({
            id: v.string(),
            slug: v.string(),
            name: v.string(),
            price: v.number(),
            comparePrice: v.optional(v.number()),
            image: v.optional(v.string()),
            category: v.optional(v.string()),
        }),
        createdAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_user_product", ["userId", "productId"]),

    /**
     * Cart - persistent server-side cart for authenticated users
     * Guest users use localStorage; cart syncs on login
     */
    cart: defineTable({
        userId: v.id("users"),
        productId: v.string(),
        productData: v.object({
            id: v.string(),
            slug: v.string(),
            name: v.string(),
            price: v.number(),
            comparePrice: v.optional(v.number()),
            image: v.optional(v.string()),
            category: v.optional(v.string()),
        }),
        quantity: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_user_product", ["userId", "productId"]),
});
