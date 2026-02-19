# MKS Agencies E-commerce - Backend Documentation

## Overview

The backend is a **Cloudflare Worker** that handles:
- 🔐 Authentication (Google OAuth, email magic link, guest checkout)
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

> **Note:** Products are managed entirely via Convex. GitHub API integration for products has been removed.

---

## Project Structure

```
backend/
├── src/
│   ├── index.js              # Entry point — router setup, CORS & Convex middleware
│   ├── lib/
│   │   ├── auth.js           # requireAuth, requireAdmin middleware
│   │   ├── convex.js         # ConvexClient HTTP class (query + mutation)
│   │   ├── email.js          # sendEmail() helper
│   │   ├── jwt.js            # createJWT, verifyJWT
│   │   └── rate-limit.js     # checkRateLimit, incrementRateLimit, resetRateLimit
│   ├── routes/
│   │   ├── admin.js          # /api/admin/* routes (login, orders, analytics, products)
│   │   ├── auth.js           # /api/auth/* routes (google, guest, email, verify)
│   │   ├── cart.js           # /api/cart/* routes (get, add, update, remove, sync)
│   │   ├── orders.js         # /api/orders/* routes (create, get, track)
│   │   └── wishlist.js       # /api/wishlist/* routes (get, add, remove)
│   └── utils/
│       ├── cors.js           # Shared CORS headers object
│       ├── helpers.js        # getClientIP, generateToken, generateOrderNumber
│       └── response.js       # json() and error() response helpers
├── package.json
├── wrangler.jsonc            # Dev config
└── wrangler.production.jsonc # Production config
```

### Routing — itty-router AutoRouter

The backend uses **[itty-router](https://itty.dev/itty-router) `AutoRouter`** instead of a custom router class. Each domain is split into its own sub-router, all mounted in `index.js`.

**`src/index.js`** acts as the application entry point:
- Configures global CORS via `cors()` middleware (preflight + corsify)
- Injects a `ConvexClient` instance into every `request` object via a `before` middleware
- Mounts sub-routers under their respective base paths
- Provides a **global `catch` handler** that returns structured JSON for any unhandled error

**Each route file** (e.g., `routes/cart.js`) uses its own `AutoRouter({ base: '/api/cart' })` for clean, scoped route definitions.

---

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

# Convex admin key (from Convex dashboard > Settings > Deploy Key)
wrangler secret put CONVEX_ADMIN_KEY
```

> **Note:** `GITHUB_TOKEN` is no longer required.

### 4. Create KV Namespaces

```bash
# Rate limiting storage
wrangler kv:namespace create RATE_LIMIT

# Admin secrets storage
wrangler kv:namespace create ADMIN_SECRETS
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

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google` | Google OAuth login |
| POST | `/api/auth/guest` | Guest checkout session |
| POST | `/api/auth/verify-guest` | Verify guest email |
| POST | `/api/auth/email/send` | Send magic login link (rate-limited: 3/5min) |
| POST | `/api/auth/email/verify` | Verify magic link token → JWT |
| GET  | `/api/auth/verify` | Verify existing JWT token |

### Orders (`/api/orders`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create new order |
| GET  | `/api/orders` | Get user's orders (auth required) |
| GET  | `/api/orders/:id` | Get single order (auth required) |
| GET  | `/api/orders/track/:orderNumber` | Track order (public) |

### Cart (`/api/cart`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/cart` | Get user's cart |
| POST   | `/api/cart/add` | Add item to cart |
| POST   | `/api/cart/update` | Update item quantity |
| POST   | `/api/cart/remove` | Remove item from cart |
| POST   | `/api/cart/clear` | Clear all items |
| POST   | `/api/cart/sync` | Sync localStorage cart to Convex on login |
| DELETE | `/api/cart` | Clear cart (alternative DELETE method) |

### Wishlist (`/api/wishlist`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/wishlist` | Get user's wishlist |
| POST | `/api/wishlist/add` | Add item to wishlist |
| POST | `/api/wishlist/remove` | Remove item from wishlist |

### Admin (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login (rate-limited: 5/15min) |
| GET  | `/api/admin/orders` | Get all orders |
| PUT  | `/api/admin/orders/:id/status` | Update order status |
| GET  | `/api/admin/analytics` | Get order analytics |
| PUT  | `/api/admin/products` | Manage products (Convex) |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

---

## Key Libraries

### `lib/convex.js` — ConvexClient

A lightweight HTTP client for server-side Convex access:

```js
import { ConvexClient } from './lib/convex'
const convex = new ConvexClient(env.CONVEX_URL)

await convex.query('queries:getCart', { userId })
await convex.mutation('mutations:createOrder', { ... })
```

The client automatically injects into every request via the middleware: `const { convex } = request`.

### `lib/jwt.js` — JWT Utilities

```js
import { createJWT, verifyJWT } from './lib/jwt'

const token = await createJWT({ userId, email }, env.JWT_SECRET, 86400)
const claims = await verifyJWT(token, env.JWT_SECRET)
```

### `lib/auth.js` — Auth Middleware

```js
import { requireAuth, requireAdmin } from './lib/auth'

const claims = await requireAuth(request, env) // returns null if invalid
const admin  = await requireAdmin(request, env) // returns null if not admin
```

### `lib/rate-limit.js` — Rate Limiting

```js
import { checkRateLimit, incrementRateLimit, resetRateLimit } from './lib/rate-limit'

const check = await checkRateLimit(env, ip, 'admin_login', 5, 900)
if (!check.allowed) return error(`Retry in ${check.retryAfter}s`, 429)

await incrementRateLimit(env, ip, 'admin_login')
await resetRateLimit(env, ip, 'admin_login')
```

### `utils/response.js` — Response Helpers

```js
import { json, error } from '../utils/response'

return json({ success: true })          // 200 JSON
return json({ data }, 201)              // Custom status
return error('Unauthorized', 401)       // Error JSON
```

---

## Error Handling

### Global Catch — `src/index.js`

All unhandled errors are caught by the global `catch` handler in `AutoRouter`:

```js
const router = AutoRouter({
    catch: (err) => json({ error: err.message, stack: err.stack }, 500),
})
```

### Route-level Try/Catch

Every route handler wraps logic in `try/catch`. On failure, it returns a structured JSON error with the real message (`e.message`) for easier debugging.

### Frontend (`useAuth.js`)

The `apiRequest` helper now handles non-JSON responses gracefully:
- If the server returns a plain text or HTML error (e.g., a crash before JSON serialization), the raw text is thrown as the error message.
- Falls back to `response.statusText` for completely unparseable responses.
- Extracts `data.error || data.message` from structured JSON error bodies.

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

### Send Email Login Link
```bash
curl -X POST http://localhost:8787/api/auth/email/send \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Get Admin Analytics
```bash
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
         └────────────────────────┴───────────────────┴──────────────┴───▶  CANCELLED
         │                        │                   │              │
         └────────────────────────┴───────────────────┴──────────────┴───▶  FAILED
```

---

## Deployment

### Development
```bash
pnpm run dev
```

### Production
```bash
pnpm run deploy
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

---

## Related Documentation

- [Email Server Documentation](EMAIL_SERVER.md)
- [Database Schema](DATABASE.md)
- [Frontend Documentation](FRONTEND.md)
