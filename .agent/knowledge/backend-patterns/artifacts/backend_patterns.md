# MKS Agencies — Backend Patterns (Cloudflare Workers)

## Architecture: Single-File Worker

The entire backend is in `backend/src/index.js` — this is **intentional** for Cloudflare Workers simplicity. Do NOT split into multiple files unless the codebase grows beyond maintainability.

## Worker Environment Bindings

```javascript
// Available bindings in `env`:
env.JWT_SECRET          // Secret: JWT signing key
env.CONVEX_ADMIN_KEY    // Secret: Convex admin key
env.GITHUB_TOKEN        // Secret: GitHub PAT
env.CONVEX_URL          // Var: Convex deployment URL
env.FRONTEND_URL        // Var: Frontend URL for CORS
env.EMAIL_SERVER_URL    // Var: Netlify email server URL
env.GITHUB_REPO         // Var: GitHub repo for products
env.ADMIN_PASSCODE      // Var: Fallback admin passcode
env.RATE_LIMIT          // KV: Rate limiting namespace
env.ADMIN_SECRETS       // KV: Admin secrets (passcode, github_pat)
```

## API Route Pattern

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const path = url.pathname

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env) })
    }

    // Route matching
    if (path === '/api/auth/google' && request.method === 'POST') {
      return handleGoogleAuth(request, env)
    }
    // ... more routes
  }
}
```

## Response Format (ALWAYS follow)

```javascript
// ✅ Success response
return new Response(JSON.stringify({
  success: true,
  data: result,
}), {
  status: 200,
  headers: { 'Content-Type': 'application/json', ...corsHeaders(env) }
})

// ✅ Error response
return new Response(JSON.stringify({
  success: false,
  error: 'Human-readable error message',
}), {
  status: 400, // Use appropriate HTTP status
  headers: { 'Content-Type': 'application/json', ...corsHeaders(env) }
})
```

## HTTP Status Codes

| Code | When to Use |
|------|-------------|
| 200 | Success |
| 201 | Created (new order, new user) |
| 400 | Bad request (validation failure) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (valid token, insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict (duplicate entry) |
| 429 | Rate limited |
| 500 | Internal server error (unexpected) |

## Cloudflare Workers Constraints

1. **Bundle size limit**: 1MB compressed — keep dependencies minimal
2. **CPU time limit**: 10ms (free), 50ms (paid) per request
3. **Subrequest limit**: 50 per request (free), 1000 (paid)
4. **No Node.js APIs**: No `fs`, `path`, `Buffer`, `crypto` module — use Web APIs
5. **Use Web Crypto API** for JWT signing: `crypto.subtle.importKey()`, `crypto.subtle.sign()`
6. **Only dependency allowed**: `convex` — everything else must be vanilla JS or Web APIs

## Convex Client Usage (from Worker)

```javascript
import { ConvexHttpClient } from 'convex/browser'

// ✅ Create client per request (stateless Workers)
const convex = new ConvexHttpClient(env.CONVEX_URL)
convex.setAdminAuth(env.CONVEX_ADMIN_KEY)

// Call mutations/queries
const result = await convex.mutation(api.mutations.createOrder, { ...args })
const data = await convex.query(api.queries.getUserByEmail, { email })
```

## KV Storage Patterns (Rate Limiting)

```javascript
// Rate limiting pattern
const key = `rate:${ip}:${action}`
const data = await env.RATE_LIMIT.get(key, 'json')
// ... check attempts, update, set with expiration
await env.RATE_LIMIT.put(key, JSON.stringify(updatedData), { expirationTtl: 900 })
```

## Admin Authentication Flow

1. Admin sends passcode to `/api/admin/login`
2. Worker compares against `ADMIN_SECRETS` KV or fallback `ADMIN_PASSCODE`
3. On success, Worker issues a JWT with admin claims
4. All admin endpoints verify JWT via `Authorization: Bearer <token>` header
5. Rate limiting enforced via KV (5 attempts per 15 minutes per IP)

## CORS Pattern

```javascript
// ✅ CORRECT: Restrict to known origins
const corsHeaders = (env) => ({
  'Access-Control-Allow-Origin': env.FRONTEND_URL, // NOT '*'
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
})
```

## Security — Input Validation

```javascript
// ✅ ALWAYS validate on the backend
if (!email || !email.includes('@') || email.length > 255) {
  return errorResponse('Invalid email', 400)
}

if (!orderNumber || !/^MKS-\d{8}-\d{4}$/.test(orderNumber)) {
  return errorResponse('Invalid order number format', 400)
}
```

## Error Handling Pattern

```javascript
try {
  // ... business logic
} catch (error) {
  console.error(`[${new Date().toISOString()}] Error in ${endpoint}:`, error.message)

  return new Response(JSON.stringify({
    success: false,
    error: 'Internal server error', // Generic message to client
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(env) }
  })
}
```

## Backend Code Style
- **Indentation**: Tabs
- **Quotes**: Single quotes
- **Semicolons**: None
- **Module system**: ESM only (`import`/`export`)
- Early returns for validation
- `Promise.all()` for parallel independent operations
