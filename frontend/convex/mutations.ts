/**
 * MKS Agencies E-commerce - Convex Mutations
 * 
 * Server-side mutations for creating and updating data.
 * These are called from the Cloudflare Worker backend.
 * 
 * @see https://docs.convex.dev/functions/mutation-functions
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

// ==================== PRODUCT MUTATIONS ====================

/**
 * Create a new product
 */
export const createProduct = mutation({
    args: {
        productId: v.string(),
        slug: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        shortDescription: v.optional(v.string()),
        price: v.number(),
        comparePrice: v.optional(v.number()),
        category: v.optional(v.string()),
        subcategory: v.optional(v.string()),
        images: v.optional(v.array(v.string())),
        stock: v.number(),
        isActive: v.boolean(),
        tags: v.optional(v.array(v.string())),
        benefits: v.optional(v.array(v.string())),
        ingredients: v.optional(v.string()),
        usage: v.optional(v.string()),
        weight: v.optional(v.string()),
        metaTitle: v.optional(v.string()),
        metaDescription: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert("products", {
            ...args,
            createdAt: now,
            updatedAt: now,
        });
    },
});

/**
 * Update an existing product
 */
export const updateProduct = mutation({
    args: {
        _id: v.id("products"),
        productId: v.optional(v.string()),
        slug: v.optional(v.string()),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        shortDescription: v.optional(v.string()),
        price: v.optional(v.number()),
        comparePrice: v.optional(v.number()),
        category: v.optional(v.string()),
        subcategory: v.optional(v.string()),
        images: v.optional(v.array(v.string())),
        stock: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
        tags: v.optional(v.array(v.string())),
        benefits: v.optional(v.array(v.string())),
        ingredients: v.optional(v.string()),
        usage: v.optional(v.string()),
        weight: v.optional(v.string()),
        metaTitle: v.optional(v.string()),
        metaDescription: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { _id, ...updates } = args;
        const existing = await ctx.db.get(_id);
        if (!existing) throw new Error("Product not found");

        await ctx.db.patch(_id, {
            ...updates,
            updatedAt: Date.now(),
        });
        return { success: true };
    },
});

/**
 * Delete a product
 */
export const deleteProduct = mutation({
    args: { _id: v.id("products") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args._id);
        return { success: true };
    },
});

/**
 * Seed products from JSON data (one-time migration utility)
 * This is idempotent - it will skip products that already exist (by productId)
 */
export const seedProducts = mutation({
    args: {
        products: v.array(v.object({
            id: v.string(),
            slug: v.string(),
            name: v.string(),
            description: v.optional(v.string()),
            shortDescription: v.optional(v.string()),
            price: v.number(),
            comparePrice: v.optional(v.number()),
            category: v.optional(v.string()),
            subcategory: v.optional(v.string()),
            images: v.optional(v.array(v.string())),
            stock: v.number(),
            isActive: v.boolean(),
            tags: v.optional(v.array(v.string())),
            benefits: v.optional(v.array(v.string())),
            ingredients: v.optional(v.string()),
            usage: v.optional(v.string()),
            weight: v.optional(v.string()),
            metaTitle: v.optional(v.string()),
            metaDescription: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        let created = 0;
        let skipped = 0;

        for (const product of args.products) {
            // Check if product already exists
            const existing = await ctx.db
                .query("products")
                .withIndex("by_product_id", (q) => q.eq("productId", product.id))
                .first();

            if (existing) {
                skipped++;
                continue;
            }

            const { id, ...rest } = product;
            await ctx.db.insert("products", {
                productId: id,
                ...rest,
                createdAt: now,
                updatedAt: now,
            });
            created++;
        }

        return { created, skipped, total: args.products.length };
    },
});

// ==================== USER MUTATIONS ====================

/**
 * Create or update user (upsert)
 * Called after OAuth verification in Worker
 */
export const upsertUser = mutation({
    args: {
        email: v.string(),
        name: v.optional(v.string()),
        phone: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        provider: v.string(),
        providerId: v.optional(v.string()),
        emailVerified: v.boolean(),
        isGuest: v.boolean(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Check if user exists by email
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (existingUser) {
            // Update existing user
            await ctx.db.patch(existingUser._id, {
                name: args.name || existingUser.name,
                phone: args.phone || existingUser.phone,
                avatarUrl: args.avatarUrl || existingUser.avatarUrl,
                emailVerified: args.emailVerified || existingUser.emailVerified,
                updatedAt: now,
            });
            return existingUser._id;
        }

        // Create new user
        return await ctx.db.insert("users", {
            ...args,
            isAdmin: false,
            createdAt: now,
            updatedAt: now,
        });
    },
});

/**
 * Create guest user with verification token
 */
export const createGuestUser = mutation({
    args: {
        email: v.string(),
        name: v.string(),
        phone: v.string(),
        verificationToken: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const expiresIn = 24 * 60 * 60 * 1000; // 24 hours

        return await ctx.db.insert("users", {
            email: args.email,
            name: args.name,
            phone: args.phone,
            provider: "guest",
            emailVerified: false,
            isGuest: true,
            verificationToken: args.verificationToken,
            verificationExpires: now + expiresIn,
            createdAt: now,
            updatedAt: now,
        });
    },
});

/**
 * Verify guest user email
 */
export const verifyGuestUser = mutation({
    args: { verificationToken: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_verification_token", (q) =>
                q.eq("verificationToken", args.verificationToken)
            )
            .first();

        if (!user) {
            return { success: false, error: "Invalid token" };
        }

        if (user.verificationExpires && user.verificationExpires < Date.now()) {
            return { success: false, error: "Token expired" };
        }

        await ctx.db.patch(user._id, {
            emailVerified: true,
            verificationToken: undefined,
            verificationExpires: undefined,
            updatedAt: Date.now(),
        });

        return { success: true, userId: user._id };
    },
});

/**
 * Create email login token
 * Stores a one-time login token for magic link authentication
 */
export const createEmailLoginToken = mutation({
    args: {
        email: v.string(),
        loginToken: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const expiresIn = 24 * 60 * 60 * 1000; // 24 hours

        // Check if user exists
        let user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (user) {
            // Update existing user with login token
            await ctx.db.patch(user._id, {
                verificationToken: args.loginToken,
                verificationExpires: now + expiresIn,
                updatedAt: now,
            });
            return { userId: user._id, isNew: false };
        }

        // Create new user entry for email login
        const userId = await ctx.db.insert("users", {
            email: args.email,
            provider: "email",
            emailVerified: false,
            isGuest: false,
            verificationToken: args.loginToken,
            verificationExpires: now + expiresIn,
            createdAt: now,
            updatedAt: now,
        });

        return { userId, isNew: true };
    },
});

/**
 * Verify email login token and authenticate user
 * One-time use: token is cleared after verification
 */
export const verifyEmailLoginToken = mutation({
    args: { loginToken: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_verification_token", (q) =>
                q.eq("verificationToken", args.loginToken)
            )
            .first();

        if (!user) {
            return { success: false, error: "Invalid or expired login link" };
        }

        if (user.verificationExpires && user.verificationExpires < Date.now()) {
            return { success: false, error: "Login link has expired" };
        }

        // Clear token (one-time use) and mark email as verified
        await ctx.db.patch(user._id, {
            emailVerified: true,
            verificationToken: undefined,
            verificationExpires: undefined,
            updatedAt: Date.now(),
        });

        return {
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                provider: user.provider,
                emailVerified: true,
            },
        };
    },
});

// ==================== ORDER MUTATIONS ====================

/**
 * Create new order with items
 */
export const createOrder = mutation({
    args: {
        orderNumber: v.string(),
        userId: v.optional(v.id("users")),
        guestEmail: v.optional(v.string()),
        subtotal: v.number(),
        shippingFee: v.number(),
        discount: v.optional(v.number()),
        total: v.number(),
        shippingName: v.string(),
        shippingPhone: v.string(),
        shippingEmail: v.string(),
        shippingAddress: v.string(),
        shippingCity: v.string(),
        shippingState: v.string(),
        shippingPostal: v.string(),
        shippingCountry: v.optional(v.string()),
        items: v.array(v.object({
            productId: v.string(),
            productName: v.string(),
            productSlug: v.string(),
            productImage: v.optional(v.string()),
            productPrice: v.number(),
            quantity: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const { items, ...orderData } = args;

        // Create order
        const orderId = await ctx.db.insert("orders", {
            ...orderData,
            shippingCountry: orderData.shippingCountry || "India",
            status: "PENDING_VERIFICATION",
            createdAt: now,
            updatedAt: now,
        });

        // Create order items
        for (const item of items) {
            await ctx.db.insert("orderItems", {
                orderId,
                ...item,
                subtotal: item.productPrice * item.quantity,
            });
        }

        // Create initial status history
        await ctx.db.insert("orderStatusHistory", {
            orderId,
            status: "PENDING_VERIFICATION",
            note: "Order placed",
            changedBy: "system",
            createdAt: now,
        });

        return orderId;
    },
});

/**
 * Update order status (admin only)
 */
export const updateOrderStatus = mutation({
    args: {
        orderId: v.id("orders"),
        status: v.string(),
        trackingUrl: v.optional(v.string()),
        trackingNumber: v.optional(v.string()),
        courierName: v.optional(v.string()),
        note: v.optional(v.string()),
        failureReason: v.optional(v.string()),
        cancellationReason: v.optional(v.string()),
        adminNotes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const { orderId, status, note, ...updateData } = args;

        const order = await ctx.db.get(orderId);
        if (!order) {
            throw new Error("Order not found");
        }

        // Prepare update object
        const updates: Record<string, any> = {
            status,
            updatedAt: now,
        };

        // Add optional fields
        if (updateData.trackingUrl !== undefined) updates.trackingUrl = updateData.trackingUrl;
        if (updateData.trackingNumber !== undefined) updates.trackingNumber = updateData.trackingNumber;
        if (updateData.courierName !== undefined) updates.courierName = updateData.courierName;
        if (updateData.failureReason !== undefined) updates.failureReason = updateData.failureReason;
        if (updateData.cancellationReason !== undefined) updates.cancellationReason = updateData.cancellationReason;
        if (updateData.adminNotes !== undefined) updates.adminNotes = updateData.adminNotes;

        // Set timestamps for specific statuses
        if (status === "SHIPPED") updates.shippedAt = now;
        if (status === "DELIVERED") updates.deliveredAt = now;

        // Update order
        await ctx.db.patch(orderId, updates);

        // Add status history entry
        await ctx.db.insert("orderStatusHistory", {
            orderId,
            status,
            note: note || undefined,
            changedBy: "admin",
            createdAt: now,
        });

        return { success: true };
    },
});

// ==================== CART MUTATIONS ====================

/**
 * Add item to cart
 */
export const addToCart = mutation({
    args: {
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
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Check if item already in cart
        const existingItem = await ctx.db
            .query("cart")
            .withIndex("by_user_product", (q) =>
                q.eq("userId", args.userId).eq("productId", args.productId)
            )
            .first();

        if (existingItem) {
            await ctx.db.patch(existingItem._id, {
                quantity: existingItem.quantity + args.quantity,
                updatedAt: now,
            });
            return existingItem._id;
        }

        return await ctx.db.insert("cart", {
            userId: args.userId,
            productId: args.productId,
            productData: args.productData,
            quantity: args.quantity,
            createdAt: now,
            updatedAt: now,
        });
    },
});

/**
 * Update cart item quantity
 */
export const updateCartQuantity = mutation({
    args: {
        userId: v.id("users"),
        productId: v.string(),
        quantity: v.number(),
    },
    handler: async (ctx, args) => {
        const item = await ctx.db
            .query("cart")
            .withIndex("by_user_product", (q) =>
                q.eq("userId", args.userId).eq("productId", args.productId)
            )
            .first();

        if (!item) {
            throw new Error("Cart item not found");
        }

        if (args.quantity <= 0) {
            await ctx.db.delete(item._id);
            return { deleted: true };
        }

        await ctx.db.patch(item._id, {
            quantity: args.quantity,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Remove item from cart
 */
export const removeFromCart = mutation({
    args: {
        userId: v.id("users"),
        productId: v.string(),
    },
    handler: async (ctx, args) => {
        const item = await ctx.db
            .query("cart")
            .withIndex("by_user_product", (q) =>
                q.eq("userId", args.userId).eq("productId", args.productId)
            )
            .first();

        if (item) {
            await ctx.db.delete(item._id);
        }

        return { success: true };
    },
});

/**
 * Clear entire cart
 */
export const clearCart = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const items = await ctx.db
            .query("cart")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        for (const item of items) {
            await ctx.db.delete(item._id);
        }

        return { success: true };
    },
});

/**
 * Sync local cart items with server
 * Merges local items into server cart
 */
export const syncCartItems = mutation({
    args: {
        userId: v.id("users"),
        items: v.array(v.object({
            productId: v.string(),
            productData: v.object({
                id: v.string(),
                slug: v.string(),
                name: v.string(),
                price: v.number(),
                comparePrice: v.optional(v.number()),
                image: v.optional(v.string()),
                category: v.optional(v.string()),
                stock: v.optional(v.number()),
            }),
            quantity: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        for (const item of args.items) {
            const existingItem = await ctx.db
                .query("cart")
                .withIndex("by_user_product", (q) =>
                    q.eq("userId", args.userId).eq("productId", item.productId)
                )
                .first();

            if (existingItem) {
                // Add quantities for existing items
                const newQuantity = existingItem.quantity + item.quantity;
                await ctx.db.patch(existingItem._id, {
                    quantity: newQuantity,
                    updatedAt: now,
                });
            } else {
                // Insert new items
                await ctx.db.insert("cart", {
                    userId: args.userId,
                    productId: item.productId,
                    productData: item.productData,
                    quantity: item.quantity,
                    createdAt: now,
                    updatedAt: now,
                });
            }
        }

        // Return full updated cart
        return await ctx.db
            .query("cart")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    }
});

// ==================== WISHLIST MUTATIONS ====================

/**
 * Add item to wishlist
 */
export const addToWishlist = mutation({
    args: {
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
    },
    handler: async (ctx, args) => {
        // Check if already in wishlist
        const existing = await ctx.db
            .query("wishlist")
            .withIndex("by_user_product", (q) =>
                q.eq("userId", args.userId).eq("productId", args.productId)
            )
            .first();

        if (existing) {
            return existing._id;
        }

        return await ctx.db.insert("wishlist", {
            userId: args.userId,
            productId: args.productId,
            productData: args.productData,
            createdAt: Date.now(),
        });
    },
});

/**
 * Remove item from wishlist
 */
export const removeFromWishlist = mutation({
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

        if (item) {
            await ctx.db.delete(item._id);
        }

        return { success: true };
    },
});
