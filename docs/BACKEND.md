# MKS Agencies E-commerce - Backend Documentation

## Overview

The backend is a **Cloudflare Worker** that handles:
- 🔐 Authentication (Google OAuth, email, guest)
- 📦 Order management with Convex database
- 👑 Admin operations (order status, products via Convex)
- ⏱️ Rate limiting via KV
- 📧 Transactional emails via Netlify Functions

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Vue Frontend  │────▶│ Cloudflare Worker │────▶│     Convex      │
│  (localhost:5173)│     │ (localhost:8787)  │     │ (Database +     │
└─────────────────┘     └──────────────────┘     │  Products)      │
                                                  └─────────────────┘
```

> **Note:** Products are now managed entirely via Convex. The previous GitHub API integration for products has been removed.

## Setup

### 1. Install Dependencies

```bash
cd backend
pnpm install
```

### 2. Configure Environment

Edit `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "FRONTEND_URL": "http://localhost:5173",
    "CONVEX_URL": "https://your-deployment.convex.cloud",
    "ADMIN_PASSCODE": "your-secure-passcode"
  },
  "kv_namespaces": [
    { "binding": "RATE_LIMIT", "id": "your-kv-id" },
    { "binding": "ADMIN_SECRETS", "id": "your-admin-kv-id" }
  ]
}
```

### 3. Add Secrets

```bash
# JWT secret for signing tokens
wrangler secret put JWT_SECRET
# Enter: (generate a random 32+ character string)

# Convex admin key (from Convex dashboard > Settings > Deploy Key)
wrangler secret put CONVEX_ADMIN_KEY
# Enter: your-convex-admin-key
```

> **Note:** `GITHUB_TOKEN` is no longer required. Products are managed via Convex, not GitHub commits.

### 4. Create KV Namespaces

```bash
# Rate limiting storage
wrangler kv:namespace create RATE_LIMIT
# Copy the ID to wrangler.jsonc

# Admin secrets storage
wrangler kv:namespace create ADMIN_SECRETS
# Copy the ID to wrangler.jsonc
```

### 5. Run Development Server

```bash
pnpm run dev
# or
wrangler dev
```

Backend runs at: `http://localhost:8787`

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google` | Google OAuth login |
| POST | `/api/auth/guest` | Guest checkout session |
| POST | `/api/auth/verify-guest` | Verify guest email |
| POST | `/api/auth/email/send` | Send email login link |
| POST | `/api/auth/email/verify` | Verify email login token |
| GET | `/api/auth/verify` | Verify JWT token |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create new order |
| GET | `/api/orders` | Get user's orders (auth required) |
| GET | `/api/orders/:id` | Get single order (auth required) |
| GET | `/api/orders/track/:orderNumber` | Track order (public) |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login (rate limited) |
| GET | `/api/admin/orders` | Get all orders |
| PUT | `/api/admin/orders/:id/status` | Update order status |
| GET | `/api/admin/analytics` | Get order analytics |
| PUT | `/api/admin/products` | Manage products (Convex) |

### Cart Sync

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cart/sync` | Sync localStorage cart to Convex |
| GET | `/api/cart` | Get user's cart |
| DELETE | `/api/cart` | Clear cart |

---

## Testing with curl

### Health Check
```bash
curl http://localhost:8787/api/health
```

### Admin Login
```bash
curl -X POST http://localhost:8787/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"passcode": "mksagencies-admin"}'
```

### Create Order (Guest)
```bash
curl -X POST http://localhost:8787/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"id": "prod_001", "name": "Test Product", "price": 299, "quantity": 1}],
    "shipping": {
      "name": "Test User",
      "phone": "9876543210",
      "email": "test@example.com",
      "address": "123 Main St",
      "city": "Chennai",
      "state": "Tamil Nadu",
      "postal": "600001"
    },
    "subtotal": 299,
    "shippingFee": 50,
    "total": 349,
    "isGuest": true
  }'
```

### Get Admin Analytics
```bash
# First get admin token from login
TOKEN="your-admin-token-here"

curl http://localhost:8787/api/admin/analytics \
  -H "Authorization: Bearer $TOKEN"
```

### Update Order Status
```bash
curl -X PUT http://localhost:8787/api/admin/orders/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "PAYMENT_VERIFIED",
    "note": "Payment confirmed via bank transfer"
  }'
```

---

## Order Status Flow

```
PENDING_VERIFICATION  ──▶  PAYMENT_VERIFIED  ──▶  PROCESSING  ──▶  SHIPPED  ──▶  DELIVERED
         │                        │                   │              │
         │                        │                   │              │
         └────────────────────────┴───────────────────┴──────────────┴───▶  CANCELLED
         │                        │                   │              │
         └────────────────────────┴───────────────────┴──────────────┴───▶  FAILED
```

---

## Deployment

### Development Deployment
```bash
# Deploy with development settings (wrangler.jsonc)
pnpm run deploy
# or
wrangler deploy
```

### Production Deployment
```bash
# Deploy with production settings (wrangler.production.jsonc)
pnpm run deploy:prod
# or
wrangler deploy -c wrangler.production.jsonc
```

### Production Configuration (`wrangler.production.jsonc`)
```jsonc
{
  "vars": {
    "FRONTEND_URL": "https://mksagencies.pages.dev",
    "EMAIL_SERVER_URL": "https://mksagencies-email.netlify.app",
    "CONVEX_URL": "https://tame-ermine-520.convex.cloud"
  }
}
```

### Production URLs
| Service | URL |
|---------|-----|
| Backend | https://backend.mks-agencies-official.workers.dev |
| Frontend | https://mksagencies.pages.dev |
| Email Server | https://mksagencies-email.netlify.app |
| Database | https://tame-ermine-520.convex.cloud |

## Related Documentation

- [Email Server Documentation](EMAIL_SERVER.md)
