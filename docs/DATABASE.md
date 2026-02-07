# MKS Agencies E-commerce - Database Documentation (Convex)

## Overview

The database uses **Convex** with real-time sync. Data is accessible:
- **Publicly**: Product catalog (from `products.json`)
- **Authenticated**: User's own orders, cart, wishlist
- **Admin**: All orders and analytics

## Schema

### Tables

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│     users       │     │     orders      │     │     orderItems       │
├─────────────────┤     ├─────────────────┤     ├──────────────────────┤
│ _id             │◀────│ userId          │◀────│ orderId              │
│ email           │     │ orderNumber     │     │ productId            │
│ name            │     │ status          │     │ productName          │
│ phone           │     │ total           │     │ quantity             │
│ provider        │     │ shipping...     │     │ subtotal             │
│ isGuest         │     │ tracking...     │     └──────────────────────┘
└─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌──────────────────────┐
        │               │ orderStatusHistory   │
        │               ├──────────────────────┤
        │               │ orderId              │
        │               │ status               │
        │               │ note                 │
        │               │ changedBy            │
        │               └──────────────────────┘
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

### Public Queries

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
│  │ (JSON file)  │   │ (Convex*)    │   │  (Backend)   │      │
│  └──────────────┘   └──────────────┘   └──────────────┘      │
│         │                  │                  │               │
│         ▼                  ▼                  ▼               │
│   Static import     localStorage +      API calls via        │
│                     Convex sync        Backend Worker         │
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

**Products**: Served from static JSON file for fast loading
**Cart**: localStorage for guests, synced to Convex on login
**Orders**: Always go through backend for validation
**Admin**: All operations via authenticated backend routes

---

## File Storage

Convex's built-in file storage is used for product images. The admin panel uploads images directly to Convex storage.

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    Admin Panel Image Upload                       │
│                                                                   │
│  1. Generate Upload URL    2. POST File        3. Save URL       │
│  ──────────────────────    ────────────        ────────────      │
│  GET /api/storage/upload → Convex returns → Browser uploads →    │
│                            short-lived URL    file directly       │
│                                                     ↓            │
│                                              storageId returned   │
│                                                     ↓            │
│                              Product image URL saved to JSON      │
└─────────────────────────────────────────────────────────────────┘
```

### Storage Functions (convex/files.ts)

```typescript
// Generate a short-lived upload URL
generateUploadUrl()

// Get public URL for a storage ID
getFileUrl({ storageId })

// Get URLs for multiple storage IDs
getFileUrls({ storageIds })

// Delete a file from storage
deleteFile({ storageId })
```

### Image URL Format

Images are served from Convex's storage site:
```
https://{deployment}.convex.site/api/storage/{storageId}
```

Example:
```
https://woozy-otter-565.convex.site/api/storage/kg2d...xyz
```

### Environment Variables

Required environment variables for file uploads:
```bash
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CONVEX_SITE_URL=https://your-deployment.convex.site
```

### Upload Limits

- Maximum file size: 5MB
- Supported formats: PNG, JPG, GIF, WebP
- Images are stored permanently until explicitly deleted
