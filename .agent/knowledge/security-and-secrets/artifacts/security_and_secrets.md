# MKS Agencies — Security, Secrets & Environment Management

## Authentication Flows

### Google OAuth
- Verify ID tokens **server-side** using Google's tokeninfo endpoint
- Never trust client-side token validation alone

### JWT Tokens
- Sign with **HMAC-SHA256** using **Web Crypto API** (NOT Node.js `crypto`)
- 7-day expiry
- Used for admin auth and user sessions

### Admin Auth
- Bcrypt-hashed passcode stored in KV
- Rate-limited login: **5 attempts per 15 minutes** per IP
- Flow: passcode → compare against `ADMIN_SECRETS` KV → issue JWT

### Magic Links
- One-time use tokens
- 24-hour expiry
- Cleared after verification

### Guest Checkout
- Verification tokens tied to email
- 24-hour expiry

## Input Validation

```javascript
// ✅ ALWAYS validate on the backend
if (!email || !email.includes('@') || email.length > 255) {
  return errorResponse('Invalid email', 400)
}

if (!orderNumber || !/^MKS-\d{8}-\d{4}$/.test(orderNumber)) {
  return errorResponse('Invalid order number format', 400)
}

// Convex validators handle type safety:
args: {
  email: v.string(),
  quantity: v.number(),
}
```

## XSS Prevention

1. Vue.js auto-escapes template interpolation `{{ }}` — **NEVER** use `v-html` with user data
2. Sanitize all user input before storing in database
3. CSP headers on Cloudflare Pages via `_headers` file

## CORS Configuration

```javascript
// ✅ CORRECT: Restrict to known origins
const corsHeaders = (env) => ({
  'Access-Control-Allow-Origin': env.FRONTEND_URL, // NOT '*'
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
})
```

## Rate Limiting

- Admin login: **5 attempts per 15 minutes** per IP (KV-backed)
- API endpoints: Consider rate limiting per user/IP for order creation
- Email sending: Respect Gmail's daily sending limits

## Security Checklist (apply to EVERY change)

- [ ] Input validated on both frontend AND backend
- [ ] No secrets exposed in frontend or logs
- [ ] CORS restricted to `env.FRONTEND_URL` (not `*`)
- [ ] Rate limiting on sensitive endpoints
- [ ] JWT verified with Web Crypto API
- [ ] SQL/NoSQL injection prevented via Convex validators

## Environment Variable Mapping

| Variable | Where Stored | How Set |
|----------|-------------|---------|
| `JWT_SECRET` | Workers Secret | `wrangler secret put JWT_SECRET` |
| `CONVEX_ADMIN_KEY` | Workers Secret | `wrangler secret put CONVEX_ADMIN_KEY` |
| `GITHUB_TOKEN` | Workers Secret | `wrangler secret put GITHUB_TOKEN` |
| `CONVEX_URL` | `wrangler.jsonc` vars | In config file |
| `FRONTEND_URL` | `wrangler.jsonc` vars | In config file |
| `EMAIL_SERVER_URL` | `wrangler.jsonc` vars | In config file |
| `GITHUB_REPO` | `wrangler.jsonc` vars | In config file |
| `ADMIN_PASSCODE` | `wrangler.jsonc` vars | In config file (fallback) |
| `VITE_API_URL` | `frontend/.env.production` | In env file |
| `VITE_GOOGLE_CLIENT_ID` | `frontend/.env.production` | In env file |
| `VITE_CONVEX_URL` | `frontend/.env.production` | In env file |
| `GMAIL_USER` | Netlify Env Vars | Netlify dashboard |
| `GMAIL_APP_PASSWORD` | Netlify Env Vars | Netlify dashboard |
| `ADMIN_EMAIL` | Netlify Env Vars | Netlify dashboard |

## Secrets Management Rules

1. **NEVER** commit real values to `.env` files (use `.env.example` as template)
2. Frontend env vars **MUST** start with `VITE_` to be exposed to the browser
3. Only put **non-sensitive config** in `wrangler.jsonc` vars — secrets use `wrangler secret put`
4. Production URLs differ from development — always use env vars, never hardcode
5. **NEVER** put `JWT_SECRET`, `CONVEX_ADMIN_KEY`, or `GITHUB_TOKEN` in `vars` — use `secrets`
