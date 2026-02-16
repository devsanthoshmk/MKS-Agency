# MKS Agencies E-commerce - Database Documentation (Convex)

## Overview

The database uses **Convex** with real-time sync. Data is accessible:
- **Publicly**: Product catalog (from `products` table)
- **Authenticated**: User's own orders, cart, wishlist
- **Admin**: All orders, all products (including inactive), and analytics

## Schema

### Tables

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│    products     │     │     orders      │     │     orderItems       │
├─────────────────┤     ├─────────────────┤     ├──────────────────────┤
│ _id             │     │ _id             │     │ orderId              │
│ productId       │     │ userId          │◀────│ productId            │
│ slug            │     │ orderNumber     │     │ productName          │
│ name            │     │ status          │     │ quantity             │
│ price           │     │ total           │     │ subtotal             │
│ category        │     │ shipping...     │     └──────────────────────┘
│ stock           │     │ tracking...     │
│ isActive        │     └─────────────────┘
│ images[]        │             │
│ tags[]          │             ▼
│ ...             │     ┌──────────────────────┐
└─────────────────┘     │ orderStatusHistory   │
                        ├──────────────────────┤
┌─────────────────┐     │ orderId              │
│     users       │     │ status               │
├─────────────────┤     │ note                 │
│ _id             │     │ changedBy            │
│ email           │     └──────────────────────┘
│ name            │
│ phone           │
│ provider        │
│ isGuest         │
└─────────────────┘
        │
        ▼
┌─────────────────┐     ┌─────────────────┐
│    wishlist     │     │      cart       │
├─────────────────┤     ├─────────────────┤
│ userId          │     │ userId          │
│ productId       │     │ productId       │
│ productData     │     │ productData     │
└─────────────────┘     │ quantity        │
                        └─────────────────┘
```

### products

Stores the full product catalog. Replaces the previous static `products.json` file.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Convex document ID |
| `productId` | string | Legacy ID (e.g. `prod_001`) for backward compatibility |
| `slug` | string | URL-friendly identifier |
| `name` | string | Product name |
| `description` | string? | Full description |
| `shortDescription` | string? | Brief description |
| `price` | number | Selling price (INR) |
| `comparePrice` | number? | Original/compare price (for showing discounts) |
| `category` | string? | Product category |
| `subcategory` | string? | Product subcategory |
| `images` | string[]? | Array of image URLs (Convex storage) |
| `stock` | number | Available stock quantity |
| `isActive` | boolean | Whether product is visible on storefront |
| `tags` | string[]? | Tags for filtering/search (e.g. `bestseller`) |
| `benefits` | string[]? | Product benefits list |
| `ingredients` | string? | Ingredients information |
| `usage` | string? | Usage instructions |
| `weight` | string? | Product weight |
| `metaTitle` | string? | SEO title |
| `metaDescription` | string? | SEO description |
| `createdAt` | number | Timestamp |
| `updatedAt` | number | Last modified timestamp |

**Indexes:**
- `by_slug` — Find by URL slug
- `by_category` — Filter by category
- `by_active` — Filter active/inactive products
- `by_product_id` — Find by legacy product ID

### users

Stores both registered and guest users.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Convex document ID |
| `email` | string | User email (unique) |
| `name` | string? | Display name |
| `phone` | string? | Phone number |
| `avatarUrl` | string? | Profile picture URL |
| `provider` | string | 'google' \| 'email' \| 'guest' |
| `providerId` | string? | OAuth provider ID |
| `emailVerified` | boolean | Email verified? |
| `isGuest` | boolean | Guest user? |
| `verificationToken` | string? | Email verification token |
| `createdAt` | number | Timestamp |

**Indexes:**
- `by_email` - Find by email
- `by_provider_id` - Find by OAuth provider
- `by_verification_token` - Find by verification token

### orders

| Field | Type | Description |
|-------|------|-------------|
| `_id` | Id | Convex document ID |
| `orderNumber` | string | Display ID (MKS-YYYYMMDD-XXXX) |
| `userId` | Id? | Reference to users |
| `guestEmail` | string? | Guest's email |
| `status` | string | Order status |
| `subtotal` | number | Items total |
| `shippingFee` | number | Shipping cost |
| `total` | number | Grand total |
| `shipping*` | string | Shipping details |
| `tracking*` | string? | Tracking info |
| `createdAt` | number | Timestamp |

**Statuses:**
- `PENDING_VERIFICATION` - Awaiting payment verification
- `PAYMENT_VERIFIED` - Payment confirmed
- `PROCESSING` - Being prepared
- `SHIPPED` - In transit
- `DELIVERED` - Complete
- `CANCELLED` - Cancelled
- `FAILED` - Failed

**Indexes:**
- `by_user` - User's orders
- `by_order_number` - Find by order number
- `by_status` - Filter by status
- `by_created_at` - Sort by date

### orderItems

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | Id | Reference to orders |
| `productId` | string | Product ID from catalog |
| `productName` | string | Snapshot of name |
| `productSlug` | string | Product URL slug |
| `productImage` | string? | Product image URL |
| `productPrice` | number | Price at purchase |
| `quantity` | number | Units ordered |
| `subtotal` | number | Line total |

### orderStatusHistory

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | Id | Reference to orders |
| `status` | string | New status |
| `note` | string? | Admin note |
| `changedBy` | string | 'system' \| 'admin' \| 'user' |
| `createdAt` | number | Timestamp |

### wishlist

| Field | Type | Description |
|-------|------|-------------|
| `userId` | Id | Reference to users |
| `productId` | string | Product ID |
| `productData` | object | Cached product info |
| `createdAt` | number | Timestamp |

### cart

| Field | Type | Description |
|-------|------|-------------|
| `userId` | Id | Reference to users |
| `productId` | string | Product ID |
| `productData` | object | Cached product info |
| `quantity` | number | Units |
| `createdAt` | number | Timestamp |
| `updatedAt` | number | Last modified |

---

## Queries

### Product Queries

```typescript
// Get all active products for public storefront
getAllProducts()
// Returns products with isActive === true, mapped with `id` field for compatibility

// Get a single product by slug
getProductBySlug({ slug })

// Get all distinct categories from active products
getProductCategories()

// Get all products for admin (including inactive)
getAllProductsAdmin()
```

### Order Queries

```typescript
// Get order analytics (admin uses via backend)
getOrderAnalytics()

// Get all orders (admin uses via backend)
getAllOrders({ status?, limit? })

// Get order by ID
getOrderById({ orderId })

// Track order by number
getOrderByNumber({ orderNumber })
```

### User Queries

```typescript
// Get user by email
getUserByEmail({ email })

// Get user's orders
getUserOrders({ userId })

// Get user's wishlist
getWishlist({ userId })

// Get user's cart
getCart({ userId })
```

---

## Mutations

### Product Mutations

```typescript
// Create a new product
createProduct({
  productId, slug, name, price, stock, isActive,
  description?, shortDescription?, comparePrice?,
  category?, subcategory?, images?, tags?, benefits?,
  ingredients?, usage?, weight?, metaTitle?, metaDescription?
})

// Update an existing product (by Convex _id)
updateProduct({
  _id,          // Required: Convex document ID
  slug?, name?, price?, stock?, isActive?,
  ...           // All other fields are optional
})

// Delete a product
deleteProduct({ _id })

// Seed products from JSON data (idempotent migration utility)
seedProducts({ products: [{ id, slug, name, price, stock, isActive, ... }] })
// Skips products that already exist by productId
```

### User Mutations

```typescript
// Create/update user (upsert)
upsertUser({ email, name, provider, ... })

// Create guest user
createGuestUser({ email, name, phone, verificationToken })

// Verify guest email
verifyGuestUser({ verificationToken })
```

### Order Mutations

```typescript
// Create order with items
createOrder({
  orderNumber,
  userId?,
  guestEmail?,
  subtotal,
  shippingFee,
  total,
  shipping*,
  items: [{ productId, productName, ... }]
})

// Update order status (admin)
updateOrderStatus({
  orderId,
  status,
  trackingUrl?,
  trackingNumber?,
  courierName?,
  note?,
  adminNotes?,
  cancellationReason?,
  failureReason?
})
```

### Cart Mutations

```typescript
// Add to cart
addToCart({ userId, productId, productData, quantity })

// Update quantity
updateCartQuantity({ userId, productId, quantity })

// Remove from cart
removeFromCart({ userId, productId })

// Clear cart
clearCart({ userId })
```

### Wishlist Mutations

```typescript
// Add to wishlist
addToWishlist({ userId, productId, productData })

// Remove from wishlist
removeFromWishlist({ userId, productId })
```

---

## Setup

### 1. Initialize Convex

```bash
cd frontend
pnpm exec convex dev
```

### 2. Get Admin Key

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Go to **Settings** > **Deploy Key**
4. Copy the key for backend

### 3. Configure Backend

Add to backend secrets:
```bash
wrangler secret put CONVEX_ADMIN_KEY
# Paste your deploy key
```

Add to `wrangler.jsonc`:
```jsonc
"CONVEX_URL": "https://your-deployment.convex.cloud"
```

---

## Data Access Pattern

```
┌──────────────────────────────────────────────────────────────┐
│                         Frontend                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐      │
│  │  Products    │   │   Cart       │   │   Orders     │      │
│  │  (Convex)    │   │ (Convex*)    │   │  (Backend)   │      │
│  └──────────────┘   └──────────────┘   └──────────────┘      │
│         │                  │                  │               │
│         ▼                  ▼                  ▼               │
│  ConvexHttpClient    localStorage +      API calls via       │
│   (queries.ts)       Convex sync        Backend Worker       │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    Backend (Worker)                           │
│                          │                                    │
│                          ▼                                    │
│                  ┌──────────────┐                             │
│                  │    Convex    │                             │
│                  │   (HTTP API) │                             │
│                  └──────────────┘                             │
└──────────────────────────────────────────────────────────────┘

* Cart syncs to Convex on user login
```

**Products**: Fetched from Convex `products` table via `ConvexHttpClient` in `useProducts.js`
**Cart**: localStorage for guests, synced to Convex on login
**Orders**: Always go through backend for validation
**Admin Products**: CRUD via Convex mutations directly from `ProductsManager.vue`
**Admin Orders**: All operations via authenticated backend routes

---

## File Storage

Convex's built-in file storage is used for product images. The admin panel uploads images directly to Convex storage.

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Admin Panel Image Upload Workflow                      │
│                                                                           │
│  1. Generate Upload URL     2. POST File         3. Get Public URL       │
│  ────────────────────────   ────────────────     ──────────────────      │
│  mutation(generateUploadUrl) → Returns temp URL → Browser uploads file   │
│                                                         ↓                │
│                                                   storageId returned      │
│                                                         ↓                │
│                                    query(getFileUrl, { storageId })      │
│                                                         ↓                │
│                              Returns CDN-backed public URL via           │
│                               ctx.storage.getUrl(storageId)              │
│                                                         ↓                │
│                           Public URL saved to products.images[]          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Storage Functions (convex/files.ts)

```typescript
// Generate a short-lived upload URL (mutation)
generateUploadUrl()
// Returns a temporary URL where the client can POST the file

// Get public URL for a storage ID (query)
getFileUrl({ storageId })
// Returns the actual CDN URL via ctx.storage.getUrl()

// Get URLs for multiple storage IDs (query)
getFileUrls({ storageIds })

// Delete a file from storage (mutation)
deleteFile({ storageId })
```

### Image Upload Implementation (ProductsManager.vue)

**CORRECT** implementation:
```javascript
// Step 1: Get upload URL
const uploadUrl = await convexClient.mutation(api.files.generateUploadUrl, {})

// Step 2: Upload file to Convex
const result = await fetch(uploadUrl, {
  method: 'POST',
  headers: { 'Content-Type': file.type },
  body: file,
})
const { storageId } = await result.json()

// Step 3: Get the public URL via ctx.storage.getUrl()
const publicUrl = await convexClient.query(api.files.getFileUrl, { storageId })

// Step 4: Save publicUrl to product.images[] array
```

**❌ INCORRECT** (this was the bug):
```javascript
// DO NOT manually construct URLs like this:
const publicUrl = `${CONVEX_SITE_URL}/api/storage/${storageId}` // ❌ Returns 404!
```

### Image URL Format

Images are served from Convex's CDN with URLs generated by `ctx.storage.getUrl(storageId)`. The exact format is managed by Convex and may change. Always use `getFileUrl()` query to get the correct URL.

Example URL (format may vary):
```
https://xxxxx.convex.cloud/api/storage/...
```

### Environment Variables

Required environment variable for Convex connection:
```bash
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

**Note**: `VITE_CONVEX_SITE_URL` is **NOT** required for file storage. Public URLs are retrieved via `getFileUrl()` query.

### Upload Limits

- Maximum file size: 5MB (enforced in ProductsManager.vue)
- Supported formats: PNG, JPG, GIF, WebP
- Images are stored permanently until explicitly deleted via `deleteFile()` mutation

---

## Automated Image Cleanup

### Daily Cron Job for Orphaned Images

A scheduled Convex cron job runs **daily at 2:30 AM UTC** to automatically clean up unused images from file storage.

**Location**: `convex/crons.ts`, `convex/maintenance.ts`

**Features**:
- **Orphan Detection**: Identifies images not referenced by any product (active, inactive, or draft)
- **Grace Period**: 24-hour safety window — newly uploaded files are never deleted to prevent race conditions
- **Batched Deletion**: Max 100 files per run to avoid timeouts
- **Atomic Execution**: Uses `internalMutation` for exactly-once, safe execution
- **Logging**: Returns detailed summary for monitoring

**How it works**:
```typescript
// 1. Collects all image URLs from products table
const allProducts = await ctx.db.query("products").collect()
const referencedUrls = new Set<string>()
for (const product of allProducts) {
  if (product.images) referencedUrls.add(...product.images)
}

// 2. Queries all files from _storage system table
const allStoredFiles = await ctx.db.system.query("_storage").collect()

// 3. For each file:
//    - Skip if uploaded < 24 hours ago (grace period)
//    - Resolve public URL via ctx.storage.getUrl()
//    - If URL not in referencedUrls → delete via ctx.storage.delete()

// 4. Returns summary:
{
  success: true,
  timestamp: Date.now(),
  summary: {
    totalStoredFiles: 42,
    totalProductImages: 38,
    totalProducts: 15,
    deletedOrphans: 4,
    hitDeletionLimit: false
  }
}
```

**Monitoring**: Check Convex Dashboard → **Schedules** tab to view cron job execution history and logs.

**Safety Features**:
- All products checked (including inactive/draft) — prevents deletion of temporarily deactivated product images
- 24-hour grace period prevents deletion of images mid-upload or during multi-step product creation
- Batch limit ensures reliable completion
- Internal mutation guarantees atomic execution

---

## JSON Import/Export

### Product Data Import/Export via JSON

The admin panel's **Product Edit Modal** includes a JSON import/export feature for bulk product edits and migrations.

**Location**: `ProductEditModal.vue`

**Features**:
- **Export**: Copy current product fields as JSON
- **Paste**: Apply JSON data to product form
- **Smart Image URL Detection**: Environment-aware Convex URL handling
- **Persistent Notifications**: Clear feedback on what happened with images

### How It Works

```
┌────────────────────────────────────────────────────────────────────┐
│                    JSON Paste Workflow                              │
│                                                                    │
│  User pastes JSON → Parse → Separate images by source             │
│                                     ↓                              │
│                         ┌───────────┴────────────┐                 │
│                         │                        │                 │
│                    Own Convex URLs         External URLs           │
│                    (same deployment)       (or other deployments)  │
│                         │                        │                 │
│                    Reuse as-is           Download → Upload         │
│                         │                        │                 │
│                         └────────────┬───────────┘                 │
│                                      ↓                              │
│                         Update product.images[]                    │
│                                      ↓                              │
│                        Show persistent notice                      │
└────────────────────────────────────────────────────────────────────┘
```

### Smart Image URL Detection

The system intelligently handles image URLs from different sources:

| URL Source | Behavior | Example |
|------------|----------|---------|
| **Current deployment** | Reused directly (no re-upload) | Dev mode: `woozy-otter-565.convex.cloud` URLs stay as-is |
| **Other Convex deployment** | Downloaded + re-uploaded | Dev mode: `tame-ermine-520.convex.cloud` (prod) URLs are downloaded |
| **External URL** | Downloaded + uploaded to Convex | `https://example.com/image.jpg` → uploads to current storage |

**Implementation**:
```typescript
// Extract current deployment hostname from VITE_CONVEX_URL
const ownConvexHost = new URL(import.meta.env.VITE_CONVEX_URL).hostname
// e.g., "woozy-otter-565.convex.cloud"

function isOwnConvexUrl(url) {
  const urlHost = new URL(url).hostname
  return urlHost === ownConvexHost
}

// In applyJsonData():
for (const imgUrl of parsed.images) {
  if (isOwnConvexUrl(imgUrl)) {
    ownConvexImages.push(imgUrl)  // Reuse directly
  } else {
    externalImageUrls.push(imgUrl) // Download + upload
  }
}
```

**Why this matters**:
- **Dev → Prod migration**: Pasting JSON from dev with dev image URLs in prod will correctly re-upload to prod storage
- **Prod → Dev testing**: Vice-versa works too
- **External migrations**: Images from any external source are automatically uploaded to your current Convex storage
- **Performance**: Own images skip wasteful re-download/re-upload

### Persistent Image Notifications

A dismissable notification banner appears after JSON paste showing what happened:

```
┌────────────────────────────────────────────────────────────────────┐
│  ✅ 3 image(s) reused from storage — no re-upload needed.    [×]   │
└────────────────────────────────────────────────────────────────────┘
```

**Notification Scenarios**:

| Scenario | Notification | Color |
|----------|--------------|-------|
| All images from this deployment | `✅ 3 image(s) reused from storage — no re-upload needed.` | Blue (info) |
| All external URLs | `⬇️ Downloading 2 image(s) from URL and uploading to storage...` → Final: `✅ 2 image(s) downloaded and uploaded` | Blue (info) |
| Mix of own + external | `✅ 1 image(s) reused. ⬇️ Downloading 2 external image(s)...` | Blue (info) |
| No valid image URLs | `⚠️ No valid image URLs found in JSON. Please upload images manually.` | Amber (warning) |
| Some failed | `✅ 3 image(s) downloaded · ❌ 1 image(s) failed` | Blue + error in console |

**Features**:
- **Persistent**: Stays visible until dismissed (× button)
- **Auto-clears**: Removed when opening/creating/cancelling a different product
- **Informative**: Shows counts and actions taken
- **Non-blocking**: Doesn't interfere with form interaction

**Implementation**:
- `imageNotice` ref in `ProductsManager.vue`
- Passed as `v-model:imageNotice` to `ProductEditModal.vue`
- Updated by modal during JSON paste and by parent during download/upload
- Rendered as `.prod-msg--notice` banner with conditional warning styling
