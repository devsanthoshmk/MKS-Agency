# 🚀 MKS Agencies — Antigravity Rules
# Comprehensive AI Coding Rules for LLM-Assisted Development
# Repository: devsanthoshmk/MKS-Agency
# Last Updated: 2026-02-15

---

## 📋 TABLE OF CONTENTS

1. [Project Identity & Architecture](#1-project-identity--architecture)
2. [Golden Rules — Never Break These](#2-golden-rules--never-break-these)
3. [Monorepo Structure & File Conventions](#3-monorepo-structure--file-conventions)
4. [Frontend Rules — Vue.js + Cloudflare Pages](#4-frontend-rules--vuejs--cloudflare-pages)
5. [Backend Rules — Cloudflare Workers](#5-backend-rules--cloudflare-workers)
6. [Database Rules — Convex](#6-database-rules--convex)
7. [Email Server Rules — Netlify Functions](#7-email-server-rules--netlify-functions)
8. [Security Rules](#8-security-rules)
9. [Cost Optimization Rules](#9-cost-optimization-rules)
10. [Performance Rules](#10-performance-rules)
11. [Breaking Change Protocol](#11-breaking-change-protocol)
12. [Error Handling Standards](#12-error-handling-standards)
13. [Code Style & Conventions](#13-code-style--conventions)
14. [Deployment Rules](#14-deployment-rules)
15. [Environment & Secrets Management](#15-environment--secrets-management)
16. [Testing Rules](#16-testing-rules)

---

## 1. PROJECT IDENTITY & ARCHITECTURE

### What Is This Project?
MKS Agencies is a **production e-commerce platform** for an Ayurvedic products business (MKS Ayurvedic) with **manual payment verification** workflow. This is NOT a hobby project — it serves real customers and handles real orders.

### Tech Stack (DO NOT change without explicit approval)

| Layer | Technology | Hosting |
|-------|-----------|---------|
| **Frontend** | Vue.js 3 (Composition API) + Vite 7 + Tailwind CSS 4 | Cloudflare Pages |
| **Backend** | Cloudflare Workers (vanilla JS, NO framework) | Cloudflare Workers |
| **Database** | Convex (real-time, TypeScript) | Convex Cloud |
| **Email** | Netlify Functions + Nodemailer (Gmail SMTP) | Netlify |
| **Auth** | Google OAuth + Email Magic Links + Guest Checkout | — |
| **Products** | Static JSON synced from GitHub | GitHub API |
| **State** | Vue Composables (NO Vuex/Pinia) | — |
| **Package Manager** | pnpm | — |
| **Testing** | Vitest + @cloudflare/vitest-pool-workers | — |

### Production URLs (NEVER hardcode these — use environment variables)

| Service | URL |
|---------|-----|
| Frontend | `https://mksagencies.pages.dev` |
| Backend | `https://backend.mks-agencies-official.workers.dev` |
| Email Server | `https://mksagencies-email.netlify.app` |
| Convex DB | `https://tame-ermine-520.convex.cloud` |

### Order Status Flow (SACRED — never modify without asking)
```
PENDING_VERIFICATION → PAYMENT_VERIFIED → PROCESSING → SHIPPED → DELIVERED
         ↘ CANCELLED (any stage)
         ↘ FAILED (any stage)
```

---

## 2. GOLDEN RULES — NEVER BREAK THESE

### 🛑 ALWAYS ASK BEFORE:
1. **Changing the Convex schema** (`frontend/convex/schema.ts`) — this is a DEPLOYED database with live data
2. **Modifying order status flow** or adding/removing status values
3. **Changing authentication logic** — Google OAuth flow, JWT structure, magic links
4. **Altering API route paths** — frontend depends on exact routes
5. **Adding new npm dependencies** — every byte counts on Workers (1MB limit) and Pages
6. **Changing the database provider** or adding a secondary database
7. **Modifying CORS configuration** — breaks cross-origin communication
8. **Changing the admin authentication mechanism** (passcode → ADMIN_SECRETS KV → JWT)
9. **Restructuring the monorepo layout** (backend/, frontend/, email-server/, db/, docs/)
10. **Modifying wrangler.jsonc or wrangler.production.jsonc** KV namespace bindings

### ✅ ALWAYS DO:
1. Use **existing patterns** from the codebase before inventing new ones
2. Validate ALL user inputs on BOTH frontend AND backend (defense in depth)
3. Use Convex **indexes** for all queries — never do full table scans in production
4. Return consistent JSON response shapes: `{ success: true, data: ... }` or `{ success: false, error: "..." }`
5. Handle errors gracefully with try/catch and meaningful error messages
6. Use `Date.now()` for timestamps (Convex stores numbers, not Date objects)
7. Ensure all Convex mutations validate args using `v.` validators
8. Keep the Workers bundle under **1MB** (no heavy dependencies)
9. Write code that works in **V8 isolates** (no Node.js built-ins in Workers)

### ❌ NEVER DO:
1. **NEVER** expose secrets, API keys, or JWTs in frontend code or console logs
2. **NEVER** use `console.log` with sensitive data in production code
3. **NEVER** use Node.js-specific APIs (`fs`, `path`, `crypto` module) in Cloudflare Workers — use Web Crypto API
4. **NEVER** install `express`, `koa`, or any Node.js server framework in the Workers backend
5. **NEVER** use `require()` — this is an ESM project (`"type": "module"`)
6. **NEVER** store passwords or tokens in plaintext
7. **NEVER** use `eval()`, `Function()`, or `innerHTML` with user-supplied data
8. **NEVER** commit `.env` files or real secrets to the repository
9. **NEVER** use `localStorage` for sensitive auth tokens on the frontend (use httpOnly cookies where possible, or be explicit about risks)
10. **NEVER** bypass rate limiting checks for admin endpoints
11. **NEVER** use `any` type in Convex TypeScript files — use proper Convex validators
12. **NEVER** use `.collect()` on large tables without `.take(N)` or index filtering

---

## 3. MONOREPO STRUCTURE & FILE CONVENTIONS

```
MKS-Agency/
├── backend/                    # Cloudflare Worker (vanilla JS)
│   ├── src/index.js            # ALL API routes (single file Worker)
│   ├── wrangler.jsonc          # Dev config (local URLs)
│   ├── wrangler.production.jsonc # Prod config (production URLs)
│   ├── test/                   # Vitest tests
│   └── package.json            # pnpm, convex dependency
├── frontend/                   # Vue.js 3 + Vite + Tailwind
│   ├── convex/                 # Convex schema, queries, mutations
│   │   ├── schema.ts           # DATABASE SCHEMA (TypeScript)
│   │   ├── queries.ts          # Read-only queries
│   │   ├── mutations.ts        # Write mutations
│   │   ├── files.ts            # File storage functions
│   │   └── _generated/         # Auto-generated (DO NOT EDIT)
│   ├── src/
│   │   ├── App.vue             # Root component with router
│   │   ├── main.js             # App entry, router config, Convex setup
│   │   ├── style.css           # Global styles + Tailwind
│   │   ├── composables/        # State management (NO Vuex/Pinia)
│   │   │   ├── useAuth.js      # Authentication state & methods
│   │   │   ├── useCart.js       # Cart state & methods
│   │   │   ├── useOrders.js    # Order state & methods
│   │   │   ├── useProducts.js  # Products state, filtering, search
│   │   │   ├── useWishlist.js  # Wishlist state & methods
│   │   │   └── useUI.js        # Toast notifications, modals
│   │   ├── views/              # Route-level page components
│   │   │   ├── HomePage.vue    # Home + Products listing
│   │   │   ├── AdminDashboard.vue # Admin panel
│   │   │   ├── GuestVerification.vue
│   │   │   └── LoginVerification.vue
│   │   └── components/         # Reusable UI components
│   │       ├── AuthModal.vue
│   │       ├── CartPanel.vue
│   │       ├── CheckoutModal.vue
│   │       ├── NavbarComp.vue
│   │       ├── OrdersModal.vue
│   │       ├── ProductCard.vue
│   │       ├── ProductModal.vue
│   │       ├── ToastNotifications.vue
│   │       ├── WishlistPanel.vue
│   │       └── admin/          # Admin sub-components
│   └── package.json            # pnpm, Vue, Convex, Tailwind
├── email-server/               # Netlify Functions
│   ├── functions/email.js      # Email sending function
│   ├── netlify.toml            # Netlify config
│   └── package.json            # nodemailer
├── db/
│   └── schema.sql              # Reference SQL schema (Neon/Postgres RLS)
├── docs/                       # Documentation
│   ├── BACKEND.md
│   ├── FRONTEND.md
│   ├── DATABASE.md
│   └── EMAIL_SERVER.md
├── .env.example                # Environment variable reference
└── README.md
```

### File Naming Rules:
- **Vue components**: PascalCase (`ProductCard.vue`, `NavbarComp.vue`)
- **Composables**: camelCase with `use` prefix (`useAuth.js`, `useCart.js`)
- **Convex functions**: camelCase (`schema.ts`, `queries.ts`, `mutations.ts`)
- **Backend**: Single file at `backend/src/index.js`
- **Config files**: lowercase with dots (`wrangler.jsonc`, `netlify.toml`)

---

## 4. FRONTEND RULES — Vue.js + Cloudflare Pages

### Vue.js Patterns (MUST follow existing patterns)

```javascript
// ✅ CORRECT: Use Composition API with <script setup>
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from '../composables/useAuth'

const { user, isAuthenticated } = useAuth()
const isLoading = ref(false)
</script>

// ❌ WRONG: Options API, Vuex, Pinia, or Class components
export default {
  data() { return {} },  // NEVER
  computed: {},           // NEVER
  methods: {}             // NEVER
}
```

### Composable Rules:
1. **All state management lives in composables** — never in components directly
2. Composables use `ref()` and `computed()` for reactive state
3. Each composable is a **singleton pattern** using module-level state
4. API calls use `fetch()` with `VITE_API_URL` environment variable
5. Error handling wraps every API call in try/catch

```javascript
// ✅ CORRECT pattern from this codebase
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

async function fetchData() {
  try {
    const response = await fetch(`${API_URL}/api/endpoint`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const data = await response.json()
    if (response.ok && data.success) {
      // handle success
    } else {
      // handle API error
    }
  } catch (e) {
    // handle network error
  }
}
```

### Component Rules:
1. **Props**: Use `defineProps()` with type definitions
2. **Emits**: Use `defineEmits()` for all custom events
3. **Slots**: Prefer named slots for complex components
4. **CSS**: Use Tailwind utility classes — minimal custom CSS
5. **Images**: Lazy load with `loading="lazy"` attribute
6. **Icons**: Use inline SVGs (no icon library installed)
7. **Modals/Panels**: Follow existing slide-panel pattern (CartPanel, WishlistPanel)

### Routing (defined in `main.js`):
- Routes are defined in `frontend/src/main.js` using `vue-router`
- Use `useRoute()` and `useRouter()` from `vue-router`
- Dynamic routes use params (e.g., `/verify/:token`)

### Tailwind CSS 4 Rules:
- Using `@tailwindcss/vite` plugin (Tailwind 4 — NOT the old PostCSS plugin)
- Custom design tokens defined in `style.css` (surface colors, primary colors)
- Use existing utility patterns: `gradient-hero`, `gradient-primary`, `btn`, `btn-primary`
- Font stack: `font-display` for headings, system fonts for body

### Convex Vue Integration:
- Uses `convex-vue` package for reactive queries
- Convex client initialized in `main.js`
- Use `useQuery()` and `useMutation()` from convex-vue for real-time data
- Convex URL: `VITE_CONVEX_URL` environment variable

### Performance:
- Use `v-if` over `v-show` for expensive components
- Lazy load route-level components where appropriate
- Use `computed()` for derived state (never recalculate in template)
- Keep component template expressions simple (move logic to setup)

---

## 5. BACKEND RULES — Cloudflare Workers

### Architecture: Single-File Worker
The entire backend is in `backend/src/index.js` — this is intentional for Cloudflare Workers simplicity. Do NOT split into multiple files unless the codebase grows beyond maintainability.

### Worker Environment:
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

### API Route Pattern:
```javascript
// ✅ CORRECT: How routes work in this Worker
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

### Response Format (ALWAYS follow):
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

### Cloudflare Workers Constraints:
1. **Bundle size limit**: 1MB compressed — keep dependencies minimal
2. **CPU time limit**: 10ms (free), 50ms (paid) per request — optimize hot paths
3. **Subrequest limit**: 50 per request (free), 1000 (paid) — batch Convex calls
4. **No Node.js APIs**: No `fs`, `path`, `Buffer`, `crypto` module — use Web APIs
5. **Use Web Crypto API** for JWT signing: `crypto.subtle.importKey()`, `crypto.subtle.sign()`
6. **Only dependency allowed**: `convex` — everything else must be vanilla JS or Web APIs

### Convex Client Usage (from Worker):
```javascript
import { ConvexHttpClient } from 'convex/browser'

// ✅ Create client per request (stateless Workers)
const convex = new ConvexHttpClient(env.CONVEX_URL)
convex.setAdminAuth(env.CONVEX_ADMIN_KEY)

// Call mutations/queries
const result = await convex.mutation(api.mutations.createOrder, { ...args })
const data = await convex.query(api.queries.getUserByEmail, { email })
```

### KV Storage Patterns (Rate Limiting):
```javascript
// ✅ Rate limiting pattern
const key = `rate:${ip}:${action}`
const data = await env.RATE_LIMIT.get(key, 'json')
// ... check attempts, update, set with expiration
await env.RATE_LIMIT.put(key, JSON.stringify(updatedData), { expirationTtl: 900 })
```

### Admin Authentication Flow:
1. Admin sends passcode to `/api/admin/login`
2. Worker compares against `ADMIN_SECRETS` KV or fallback `ADMIN_PASSCODE`
3. On success, Worker issues a JWT with admin claims
4. All admin endpoints verify JWT via `Authorization: Bearer <token>` header
5. Rate limiting enforced via KV (5 attempts per 15 minutes per IP)

---

## 6. DATABASE RULES — Convex

### Schema is the Source of Truth
The Convex schema at `frontend/convex/schema.ts` is the **canonical database structure**. The `db/schema.sql` file is a reference/legacy schema only.

### Tables & Their Purpose:

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| `users` | Registered + guest users | `by_email`, `by_provider_id`, `by_verification_token` |
| `orders` | Customer orders | `by_user`, `by_order_number`, `by_status`, `by_guest_email`, `by_created_at` |
| `orderItems` | Line items per order | `by_order` |
| `orderStatusHistory` | Status change audit trail | `by_order` |
| `wishlist` | User saved products | `by_user`, `by_user_product` |
| `cart` | Server-side persistent cart | `by_user`, `by_user_product` |

### Convex Query Rules:
```typescript
// ✅ CORRECT: Always use indexes
const user = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", args.email))
  .first()

// ❌ WRONG: Full table scan — expensive and slow
const user = await ctx.db
  .query("users")
  .filter((q) => q.eq(q.field("email"), args.email))
  .first()
```

### Convex Mutation Rules:
1. **Always validate args** with `v.` validators in the `args` object
2. Use `v.id("tableName")` for document ID references
3. Use `v.optional()` for nullable/optional fields
4. Always set `createdAt: Date.now()` and `updatedAt: Date.now()` on create
5. Always update `updatedAt: Date.now()` on patch
6. Use `ctx.db.patch()` for partial updates (NOT `ctx.db.replace()`)

### Convex Schema Change Protocol:
> ⚠️ **STOP — ASK THE DEVELOPER BEFORE MODIFYING `schema.ts`**
> 
> Schema changes in Convex are deployed and affect live data immediately.
> Before ANY schema change:
> 1. Confirm the change is necessary
> 2. Check if existing data needs migration
> 3. Ensure backward compatibility (add optional fields, never remove required ones)
> 4. Test locally with `pnpm exec convex dev` first

### Product Data:
- Products are stored as **static JSON** in the GitHub repository, NOT in Convex
- Products are fetched by the Worker from GitHub API and cached
- The `productData` object in cart/wishlist is a **cached snapshot** — it may become stale
- Product schema in cart/wishlist: `{ id, slug, name, price, comparePrice?, image?, category?, stock? }`

---

## 7. EMAIL SERVER RULES — Netlify Functions

### Architecture:
- Single function at `email-server/functions/email.js`
- Uses `nodemailer` with Gmail SMTP (App Password, NOT regular password)
- Deployed as a Netlify serverless function
- All requests redirect through `/.netlify/functions/email/:splat`

### Email Types Supported:
1. **Order Confirmation** — sent to customer after order placed
2. **Guest Verification** — email verification for guest checkout
3. **Admin Notification** — notify admin of new orders
4. **Login Magic Link** — passwordless email authentication
5. **Order Status Update** — shipped, delivered, cancelled notifications

### Rules:
1. **CORS headers required** on all responses (including OPTIONS preflight)
2. Environment variables: `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ADMIN_EMAIL`
3. All emails use **HTML templates** with inline CSS (no external stylesheets)
4. Email templates must be **mobile-responsive** (max-width: 600px)
5. Always include a plain-text fallback
6. Rate limit email sending (don't spam Gmail's sending limits — 500/day free tier)
7. Never expose email credentials in error responses

---

## 8. SECURITY RULES

### Authentication:
1. **Google OAuth**: Verify ID tokens server-side using Google's tokeninfo endpoint
2. **JWT tokens**: Sign with HMAC-SHA256 using Web Crypto API, 7-day expiry
3. **Admin auth**: bcrypt-hashed passcode stored in KV, rate-limited login
4. **Magic links**: One-time use tokens, 24-hour expiry, cleared after verification
5. **Guest checkout**: Verification tokens tied to email, 24-hour expiry

### Input Validation:
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
  quantity: v.number(), // Convex enforces type at runtime
}
```

### XSS Prevention:
1. Vue.js auto-escapes template interpolation `{{ }}` — NEVER use `v-html` with user data
2. Sanitize all user input before storing in database
3. CSP headers on Cloudflare Pages via `_headers` file

### CORS:
```javascript
// ✅ CORRECT: Restrict to known origins
const corsHeaders = (env) => ({
  'Access-Control-Allow-Origin': env.FRONTEND_URL, // NOT '*'
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
})
```

### Rate Limiting:
- Admin login: **5 attempts per 15 minutes** per IP (KV-backed)
- API endpoints: Consider rate limiting per user/IP for order creation
- Email sending: Respect Gmail's daily sending limits

### Secrets Management:
- Workers secrets via `wrangler secret put <KEY>`
- Netlify env vars via Netlify dashboard
- Frontend: Only `VITE_` prefixed vars are exposed to the browser
- **NEVER** put `JWT_SECRET`, `CONVEX_ADMIN_KEY`, or `GITHUB_TOKEN` in `vars` — use `secrets`

---

## 9. COST OPTIMIZATION RULES

### Cloudflare Workers (Free Tier):
- **100,000 requests/day** — cache aggressively, batch operations
- **10ms CPU time** — keep handlers fast, avoid heavy computation
- **1MB bundle** — minimal dependencies (only `convex` package)
- Use KV for caching (read-heavy, 100k free reads/day)

### Convex (Free Tier):
- Queries/mutations are metered — use indexes to avoid full scans
- `.collect()` loads ALL matching docs into memory — always use `.take(N)` or `.first()` for bounded queries
- Batch related operations in a single mutation when possible
- Use Convex's real-time subscriptions (frontend) instead of polling

### Netlify Functions (Free Tier):
- **125,000 function invocations/month** — batch emails when possible
- **10-second execution time** — send emails asynchronously if needed
- Don't create a new SMTP transport per request (reuse at module level)

### Cloudflare Pages (Free Tier):
- **500 builds/month** — don't trigger unnecessary deployments
- Static assets served from CDN — leverage caching
- Use Vite's code splitting and tree shaking

### General:
```javascript
// ✅ CORRECT: Bounded query
const orders = await ordersQuery.take(args.limit || 50)

// ❌ WRONG: Unbounded — could fetch thousands of docs
const orders = await ctx.db.query("orders").collect()

// ✅ CORRECT: Use index for filtered query
const userOrders = await ctx.db
  .query("orders")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .order("desc")
  .take(20)

// ✅ CORRECT: Cache GitHub API responses in KV
const cached = await env.RATE_LIMIT.get('products_cache', 'json')
if (cached && cached.expiry > Date.now()) return cached.data
```

---

## 10. PERFORMANCE RULES

### Frontend:
1. **Lazy load images**: Use `loading="lazy"` on all product images
2. **Debounce search**: 300ms debounce on search input filtering
3. **Virtual scrolling**: Consider for product listings > 100 items
4. **Cache products**: Products are static JSON — cache in composable state
5. **Minimize re-renders**: Use `computed()` for derived state, `shallowRef()` for large lists
6. **Code split**: Route-level lazy loading for AdminDashboard

### Backend:
1. **Early returns**: Validate and reject bad requests before doing work
2. **Parallel requests**: Use `Promise.all()` for independent Convex calls
3. **Minimize KV reads**: Cache rate limit state in-memory within request
4. **Response streaming**: Return JSON directly, no unnecessary transformations

### Convex:
1. **Index everything**: Every query must use an index
2. **Limit results**: Always use `.take(N)` or `.first()` — never unbounded `.collect()`
3. **Minimize mutations**: Batch related writes in a single mutation
4. **Avoid N+1**: When fetching orders with items, use `Promise.all()` (as done in queries.ts)

---

## 11. BREAKING CHANGE PROTOCOL

> **🚨 A "breaking change" requires EXPLICIT developer approval before implementation.**

### What Counts as a Breaking Change:

| Category | Examples |
|----------|---------|
| **Schema** | Adding required fields, removing fields, renaming tables/fields in Convex |
| **API** | Changing route paths, request/response shapes, auth requirements |
| **Auth** | Modifying JWT claims, token expiry, OAuth flow |
| **Dependencies** | Adding new packages, upgrading major versions |
| **Config** | Changing wrangler.jsonc bindings, KV namespaces, env var names |
| **Build** | Changing Vite config, build commands, deployment targets |
| **Order Flow** | Adding/removing/renaming order statuses |
| **Data Model** | Changing how products, users, or orders are structured |

### Protocol When Encountering a Breaking Change:

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

---

## 12. ERROR HANDLING STANDARDS

### Frontend:
```javascript
// ✅ CORRECT: User-friendly errors with toast notifications
import { useUI } from '../composables/useUI'
const { success, error: showError } = useUI()

try {
  const response = await fetch(`${API_URL}/api/orders`, { ... })
  const data = await response.json()
  
  if (!response.ok) {
    showError(data.error || 'Something went wrong')
    return
  }
  
  success('Order placed successfully!')
} catch (e) {
  showError('Network error. Please check your connection.')
}
```

### Backend (Workers):
```javascript
// ✅ CORRECT: Structured error responses
try {
  // ... business logic
} catch (error) {
  // Log for debugging (Cloudflare dashboard)
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

### Convex:
```typescript
// ✅ CORRECT: Throw errors in mutations for invalid state
const order = await ctx.db.get(orderId)
if (!order) {
  throw new Error("Order not found")
}

// ✅ CORRECT: Return error objects for expected failures
if (user.verificationExpires && user.verificationExpires < Date.now()) {
  return { success: false, error: "Token expired" }
}
```

### HTTP Status Code Guide:
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

---

## 13. CODE STYLE & CONVENTIONS

### General:
- **Indentation**: Tabs for backend (`.editorconfig`), 2 spaces for frontend
- **Quotes**: Single quotes for JS/TS strings
- **Semicolons**: None (consistent with prettierrc)
- **Line length**: Keep under 100 characters where reasonable
- **Comments**: JSDoc for functions, inline comments for complex logic only

### JavaScript/Vue:
```javascript
// ✅ Use const by default, let when reassignment is needed
const data = await response.json()
let retries = 3

// ✅ Destructure when accessing multiple properties
const { email, name, phone } = args
const { success, data: orderData } = await response.json()

// ✅ Template literals for string interpolation
const url = `${API_URL}/api/orders/${orderId}`

// ✅ Arrow functions for callbacks and handlers
const handleClick = () => { ... }
items.map((item) => item.id)

// ✅ Optional chaining and nullish coalescing
const name = user?.name ?? 'Guest'
const country = orderData.shippingCountry || 'India'
```

### TypeScript (Convex files only):
```typescript
// ✅ Use Convex validators for args, not TypeScript types
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

### Vue Templates:
```html
<!-- ✅ Use v-if for conditional rendering -->
<div v-if="isLoading" class="spinner" />
<div v-else-if="error" class="error">{{ error }}</div>
<div v-else>{{ data }}</div>

<!-- ✅ Use :key on v-for -->
<ProductCard v-for="product in filteredProducts" :key="product.id" :product="product" />

<!-- ✅ Use @ shorthand for events -->
<button @click="handleSubmit">Submit</button>

<!-- ✅ Use : shorthand for bindings -->
<img :src="product.image" :alt="product.name" loading="lazy" />
```

---

## 14. DEPLOYMENT RULES

### Backend (Cloudflare Workers):
```bash
# Development (uses wrangler.jsonc — local URLs)
cd backend && pnpm run dev

# Production (uses wrangler.production.jsonc — production URLs)
cd backend && pnpm run deploy
# Equivalent to: wrangler deploy -c wrangler.production.jsonc
```

### Frontend (Cloudflare Pages):
```bash
# Development
cd frontend && pnpm run dev

# Production build (uses .env.production)
cd frontend && pnpm run build

# Deployed via Cloudflare Pages dashboard (auto-deploy from Git)
```

### Email Server (Netlify):
```bash
# Development
cd email-server && netlify dev

# Production
cd email-server && netlify deploy --prod
```

### Convex:
```bash
# Development (watches for changes)
cd frontend && pnpm exec convex dev

# Production deployment
cd frontend && pnpm exec convex deploy --prod
```

### Pre-Deployment Checklist:
- [ ] All environment variables set in production
- [ ] Secrets added via `wrangler secret put` (not in config files)
- [ ] Convex schema deployed and compatible with existing data
- [ ] CORS origins updated for production URLs
- [ ] Rate limiting configured
- [ ] Error handling tested for edge cases
- [ ] Bundle size under 1MB (Workers)

---

## 15. ENVIRONMENT & SECRETS MANAGEMENT

### What Goes Where:

| Variable | Where Stored | How Set |
|----------|-------------|---------|
| `JWT_SECRET` | Cloudflare Workers Secret | `wrangler secret put JWT_SECRET` |
| `CONVEX_ADMIN_KEY` | Cloudflare Workers Secret | `wrangler secret put CONVEX_ADMIN_KEY` |
| `GITHUB_TOKEN` | Cloudflare Workers Secret | `wrangler secret put GITHUB_TOKEN` |
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

### Rules:
1. **NEVER** commit real values to `.env` files (use `.env.example` as template)
2. Frontend env vars MUST start with `VITE_` to be exposed to the browser
3. Only put non-sensitive config in `wrangler.jsonc` vars — secrets use `wrangler secret put`
4. Production URLs differ from development — always use env vars, never hardcode

---

## 16. TESTING RULES

### Backend (Vitest + Cloudflare Workers Pool):
```javascript
// Uses @cloudflare/vitest-pool-workers for Worker-compatible testing
// Config in backend/vitest.config.js

// ✅ Test pattern:
import { describe, it, expect } from 'vitest'

describe('API Routes', () => {
  it('should return 401 for unauthenticated admin requests', async () => {
    const response = await fetch('http://localhost:8787/api/admin/orders')
    expect(response.status).toBe(401)
  })
})
```

### General Testing Rules:
1. Test API endpoints for correct status codes and response shapes
2. Test authentication flows (valid token, expired token, missing token)
3. Test input validation (missing fields, invalid formats, XSS payloads)
4. Test rate limiting behavior
5. Mock Convex client calls in unit tests
6. Don't test Convex's internal behavior — test your business logic

---

## 🧠 CONTEXT FOR AI ASSISTANTS

When working with this codebase, remember:

1. **This is a LIVE production e-commerce site** — changes affect real users and orders
2. **The owner is a solo developer** — keep solutions simple and maintainable
3. **Cost matters** — this runs on free tiers, optimize for minimal resource usage
4. **The tech stack is intentionally minimal** — don't add complexity without justification
5. **Manual payment verification** is a feature, not a bug — no payment gateway needed
6. **Products come from GitHub JSON** — the database doesn't store product catalog
7. **The backend is a single file** — this is the Cloudflare Workers pattern, not a code smell
8. **Convex handles real-time** — don't reinvent real-time subscriptions
9. **Always reference existing code patterns** before writing new code
10. **When in doubt, ASK** — it's better to confirm than to break production