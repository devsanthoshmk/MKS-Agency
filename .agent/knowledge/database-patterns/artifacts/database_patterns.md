# MKS Agencies — Database Patterns (Convex)

## Schema Is the Source of Truth

The Convex schema at `frontend/convex/schema.ts` is the **canonical database structure**. The `db/schema.sql` file is a reference/legacy schema only.

## Tables & Their Purpose

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| `users` | Registered + guest users | `by_email`, `by_provider_id`, `by_verification_token` |
| `orders` | Customer orders | `by_user`, `by_order_number`, `by_status`, `by_guest_email`, `by_created_at` |
| `orderItems` | Line items per order | `by_order` |
| `orderStatusHistory` | Status change audit trail | `by_order` |
| `wishlist` | User saved products | `by_user`, `by_user_product` |
| `cart` | Server-side persistent cart | `by_user`, `by_user_product` |

## Query Patterns

### ✅ CORRECT: Always Use Indexes
```typescript
const user = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", args.email))
  .first()
```

### ❌ WRONG: Full Table Scan (expensive and slow)
```typescript
const user = await ctx.db
  .query("users")
  .filter((q) => q.eq(q.field("email"), args.email))
  .first()
```

## Mutation Rules

1. **Always validate args** with `v.` validators in the `args` object
2. Use `v.id("tableName")` for document ID references
3. Use `v.optional()` for nullable/optional fields
4. Always set `createdAt: Date.now()` and `updatedAt: Date.now()` on create
5. Always update `updatedAt: Date.now()` on patch
6. Use `ctx.db.patch()` for partial updates (NOT `ctx.db.replace()`)

### Mutation Example
```typescript
export const myMutation = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    userId: v.id("users"),
    items: v.array(v.object({
      productId: v.string(),
      quantity: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // args are fully typed by Convex validators
  },
})
```

## File Upload Workflow (Product Images)

### ✅ CORRECT Workflow
```javascript
// 1. Get upload URL via mutation
const uploadUrl = await convexClient.mutation(api.files.generateUploadUrl, {})

// 2. Upload file directly to Convex
const result = await fetch(uploadUrl, {
  method: 'POST',
  headers: { 'Content-Type': file.type },
  body: file
})
const { storageId } = await result.json()

// 3. Get public URL via query (calls ctx.storage.getUrl())
const publicUrl = await convexClient.query(api.files.getFileUrl, { storageId })

// 4. Save publicUrl to product.images[]
```

### ❌ WRONG — These Will Break
```javascript
// DO NOT use string paths for mutations/queries
await convexClient.mutation('files:generateUploadUrl', {})  // ❌ Won't work!

// DO NOT manually construct storage URLs
const url = `${CONVEX_SITE_URL}/api/storage/${storageId}`  // ❌ Returns 404!
```

## Mutation/Query Call Pattern

### ✅ CORRECT — Use API Objects
```javascript
import { api } from '../convex/_generated/api.js'
await convexClient.mutation(api.files.generateUploadUrl, {})
await convexClient.query(api.queries.getAllProducts, {})
```

### ❌ WRONG — String Paths Don't Work
```javascript
await convexClient.mutation('files:generateUploadUrl', {})  // ❌
```

## Schema Change Protocol

> ⚠️ **STOP — ASK THE DEVELOPER BEFORE MODIFYING `schema.ts`**
>
> Schema changes in Convex are deployed and affect live data immediately.
> Before ANY schema change:
> 1. Confirm the change is necessary
> 2. Check if existing data needs migration
> 3. Ensure backward compatibility (add optional fields, never remove required ones)
> 4. Test locally with `pnpm exec convex dev` first

## Cost Optimization

- Queries/mutations are **metered** — use indexes to avoid full scans
- `.collect()` loads ALL matching docs into memory — always use `.take(N)` or `.first()` for bounded queries
- Batch related operations in a single mutation when possible
- Use Convex's real-time subscriptions (frontend) instead of polling
- Avoid N+1: When fetching orders with items, use `Promise.all()`

## Bounded Query Pattern

```javascript
// ✅ CORRECT: Bounded query
const orders = await ordersQuery.take(args.limit || 50)

// ❌ WRONG: Unbounded — could fetch thousands of docs
const orders = await ctx.db.query("orders").collect()

// ✅ CORRECT: Indexed + bounded
const userOrders = await ctx.db
  .query("orders")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .order("desc")
  .take(20)
```

## Error Handling in Convex

```typescript
// Throw errors for invalid state
const order = await ctx.db.get(orderId)
if (!order) {
  throw new Error("Order not found")
}

// Return error objects for expected failures
if (user.verificationExpires && user.verificationExpires < Date.now()) {
  return { success: false, error: "Token expired" }
}
```

## Product Data Note

- Products are stored as **static JSON** in the GitHub repository, NOT in Convex
- Products are fetched by the Worker from GitHub API and cached
- The `productData` object in cart/wishlist is a **cached snapshot** — it may become stale
- Product schema in cart/wishlist: `{ id, slug, name, price, comparePrice?, image?, category?, stock? }`
