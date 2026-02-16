# MKS Agencies — Common Pitfalls, Gotchas & Debugging Guide

## 🔴 Critical Gotchas (WILL break production)

### 1. Convex Storage URLs — NEVER Manually Construct
```javascript
// ❌ WRONG — Returns 404!
const url = `${CONVEX_SITE_URL}/api/storage/${storageId}`

// ✅ CORRECT — Use the query
const publicUrl = await convexClient.query(api.files.getFileUrl, { storageId })
```
**Why**: Convex storage URLs are not constructable from the site URL. You must use `ctx.storage.getUrl(storageId)` via a query.

### 2. Convex Mutation/Query Calls — NEVER Use String Paths
```javascript
// ❌ WRONG — Silently fails or throws
await convexClient.mutation('files:generateUploadUrl', {})

// ✅ CORRECT — Use API objects
import { api } from '../convex/_generated/api.js'
await convexClient.mutation(api.files.generateUploadUrl, {})
```
**Why**: Convex's JavaScript client requires the auto-generated API objects, not string identifiers.

### 3. Unbounded Queries — NEVER Use `.collect()` Without Limits
```javascript
// ❌ WRONG — Could fetch thousands of documents, will OOM
const allOrders = await ctx.db.query("orders").collect()

// ✅ CORRECT — Always bound results
const orders = await ctx.db
  .query("orders")
  .withIndex("by_status", (q) => q.eq("status", "PENDING_VERIFICATION"))
  .take(50)
```

### 4. Node.js APIs in Workers — Will Crash
```javascript
// ❌ WRONG — fs, path, crypto modules don't exist in Workers
const crypto = require('crypto')
const hash = crypto.createHash('sha256')

// ✅ CORRECT — Use Web Crypto API
const hash = await crypto.subtle.digest('SHA-256', data)
```

### 5. Schema Changes Without Asking — Can Corrupt Live Data
- `frontend/convex/schema.ts` is the **LIVE** database schema
- Changes deploy immediately via `convex dev` or `convex deploy`
- **ALWAYS** ask the developer before modifying schema.ts
- Add optional fields only; never remove required ones without migration

---

## 🟡 Common Mistakes (Will cause bugs)

### 6. Forgetting CORS Headers
Every response from the Worker — including **errors** — must include CORS headers. Otherwise the frontend can't read the response.

### 7. Using `require()` Instead of `import`
This is an ESM-only project (`"type": "module"`). `require()` will throw an error.

### 8. Using `v-html` with User Data
Vue's `{{ }}` auto-escapes. Using `v-html` with user-supplied content opens XSS vulnerabilities.

### 9. Forgetting `Date.now()` for Timestamps
Convex stores timestamps as numbers, not Date objects. Always use `Date.now()`.

### 10. Using `ctx.db.replace()` Instead of `ctx.db.patch()`
- `replace()` overwrites the **entire document** — any fields you don't include are deleted
- `patch()` only updates the fields you specify — safe for partial updates

### 11. Hardcoding Production URLs
Always use environment variables (`import.meta.env.VITE_API_URL`, `env.FRONTEND_URL`). Hardcoded URLs break dev/staging environments.

### 12. Using `localStorage` for Auth Tokens
`localStorage` is accessible to any JS on the page (XSS risk). Use httpOnly cookies where possible, or be explicit about the risk.

---

## 🟢 Debugging Tips

### Workers (backend)
- Use `console.error()` — visible in Cloudflare dashboard logs
- Add timestamps: `[${new Date().toISOString()}]` prefix
- Check bundle size: `wrangler deploy --dry-run`
- Test locally: `cd backend && pnpm run dev` (starts on `localhost:8787`)

### Frontend (Vue.js)
- Vue DevTools browser extension for state inspection
- Check Convex dashboard for query/mutation errors
- Network tab → filter by XHR to debug API calls
- `cd frontend && pnpm run dev` (starts on `localhost:5173`)

### Convex
- Convex dashboard shows all query/mutation logs with errors
- `pnpm exec convex dev` shows schema sync status
- Check `_generated/api.js` exists after schema changes

### Email Server
- `cd email-server && netlify dev` for local testing
- Check Netlify function logs in dashboard
- Gmail SMTP errors often indicate App Password issues (NOT regular password)

---

## Order Status Flow — SACRED (Never Modify Without Asking)

```
PENDING_VERIFICATION → PAYMENT_VERIFIED → PROCESSING → SHIPPED → DELIVERED
         ↘ CANCELLED (any stage)
         ↘ FAILED (any stage)
```

**Why it's sacred**: This flow is embedded across the entire stack — frontend UI, backend handlers, Convex mutations, email templates, and admin dashboard. Changing it requires coordinated updates everywhere.

---

## Testing Approach

### Backend (Vitest + Cloudflare Workers Pool)
```javascript
import { describe, it, expect } from 'vitest'

describe('API Routes', () => {
  it('should return 401 for unauthenticated admin requests', async () => {
    const response = await fetch('http://localhost:8787/api/admin/orders')
    expect(response.status).toBe(401)
  })
})
```

### What to Test
1. API endpoints — correct status codes and response shapes
2. Authentication flows — valid token, expired token, missing token
3. Input validation — missing fields, invalid formats, XSS payloads
4. Rate limiting behavior
5. Mock Convex client calls in unit tests
6. Don't test Convex's internal behavior — test **your** business logic
