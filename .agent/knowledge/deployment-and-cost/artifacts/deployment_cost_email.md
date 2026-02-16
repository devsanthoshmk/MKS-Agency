# MKS Agencies — Deployment, Cost Optimization & Email Server

## Deployment Commands

### Backend (Cloudflare Workers)
```bash
# Development (uses wrangler.jsonc — local URLs)
cd backend && pnpm run dev

# Production (uses wrangler.production.jsonc — production URLs)
cd backend && pnpm run deploy
# Equivalent to: wrangler deploy -c wrangler.production.jsonc
```

### Frontend (Cloudflare Pages)
```bash
# Development
cd frontend && pnpm run dev

# Production build (uses .env.production)
cd frontend && pnpm run build

# Deployed via Cloudflare Pages dashboard (auto-deploy from Git)
```

### Email Server (Netlify)
```bash
# Development
cd email-server && netlify dev

# Production
cd email-server && netlify deploy --prod
```

### Convex
```bash
# Development (watches for changes)
cd frontend && pnpm exec convex dev

# Production deployment
cd frontend && pnpm exec convex deploy --prod
```

## Pre-Deployment Checklist

- [ ] All environment variables set in production
- [ ] Secrets added via `wrangler secret put` (not in config files)
- [ ] Convex schema deployed and compatible with existing data
- [ ] CORS origins updated for production URLs
- [ ] Rate limiting configured
- [ ] Error handling tested for edge cases
- [ ] Bundle size under 1MB (Workers)

## Free Tier Limits & Mitigation

| Service | Limit | Mitigation Strategy |
|---------|-------|---------------------|
| **Workers** | 100k req/day, 10ms CPU, 1MB bundle | Cache aggressively in KV, minimal deps, early returns |
| **Convex** | Metered queries | Always use indexes, `.take(N)`, batch operations |
| **Netlify** | 125k invocations/month | Batch emails, don't re-send unnecessarily |
| **Pages** | 500 builds/month | Don't trigger unnecessary deploys |
| **Gmail SMTP** | 500 emails/day | Batch notifications where possible |
| **KV** | 100k reads/day (free) | Cache results, minimize redundant reads |

## Cost Optimization Patterns

```javascript
// ✅ Cache GitHub API responses in KV
const cached = await env.RATE_LIMIT.get('products_cache', 'json')
if (cached && cached.expiry > Date.now()) return cached.data

// ✅ Bounded queries
const orders = await ordersQuery.take(args.limit || 50)

// ✅ Use indexes for filtered queries
const userOrders = await ctx.db
  .query("orders")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .order("desc")
  .take(20)

// ✅ Parallel independent requests
const [user, orders] = await Promise.all([
  convex.query(api.queries.getUserByEmail, { email }),
  convex.query(api.queries.getOrdersByUser, { userId })
])
```

---

## Email Server Patterns

### Architecture
- Single function at `email-server/functions/email.js`
- Uses `nodemailer` with Gmail SMTP (**App Password**, NOT regular password)
- Deployed as a Netlify serverless function
- All requests redirect through `/.netlify/functions/email/:splat`

### Email Types Supported

| Type | Purpose |
|------|---------|
| Order Confirmation | Sent to customer after order placed |
| Guest Verification | Email verification for guest checkout |
| Admin Notification | Notify admin of new orders |
| Login Magic Link | Passwordless email authentication |
| Order Status Update | Shipped, delivered, cancelled notifications |

### Email Server Rules

1. **CORS headers required** on all responses (including OPTIONS preflight)
2. Environment variables: `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ADMIN_EMAIL`
3. All emails use **HTML templates** with inline CSS (no external stylesheets)
4. Email templates must be **mobile-responsive** (max-width: 600px)
5. Always include a plain-text fallback
6. Rate limit email sending (don't spam Gmail's sending limits — 500/day free tier)
7. Never expose email credentials in error responses
8. Don't create a new SMTP transport per request (reuse at module level)

---

## Breaking Change Protocol

### What Counts as a Breaking Change

| Category | Examples |
|----------|---------|
| **Schema** | Adding required fields, removing fields, renaming tables/fields |
| **API** | Changing route paths, request/response shapes, auth requirements |
| **Auth** | Modifying JWT claims, token expiry, OAuth flow |
| **Dependencies** | Adding new packages, upgrading major versions |
| **Config** | Changing wrangler bindings, KV namespaces, env var names |
| **Build** | Changing Vite config, build commands, deployment targets |
| **Order Flow** | Adding/removing/renaming order statuses |
| **Data Model** | Changing how products, users, or orders are structured |

### Protocol When Encountering

```
⚠️ BREAKING CHANGE DETECTED

I need to [describe change] because [reason].

This will affect:
- [ ] Frontend (list affected files/components)
- [ ] Backend (list affected routes/handlers)
- [ ] Database (list affected tables/fields)
- [ ] Email Server (list affected templates/endpoints)

Migration required: Yes/No
Data loss risk: Yes/No
Downtime required: Yes/No

Shall I proceed? Please confirm with "yes" or provide alternative direction.
```
