# MKS Agencies — AI Agent Rules
# Last Updated: 2026-02-15

## IDENTITY
- **Project**: MKS Agencies — Production e-commerce platform for Ayurvedic products
- **Status**: LIVE in production with real customers and real orders
- **Owner**: Solo developer — keep solutions simple, maintainable, and cost-effective

## 🚨 AI AGENT RESPONSIBILITIES — CRITICAL

### MANDATORY SYNCHRONIZATION
**Every change you make to the codebase MUST be synchronized with:**
1. **This AGENTS.md file** — Update relevant sections when you modify patterns, add constraints, or discover issues
2. **All Workflows** (`.agent/workflows/*.md`) — Update or create workflows for repeatable processes
3. **User Rules** — Ensure consistency with established project rules
4. **Knowledge Items** — Document architectural decisions and discoveries

### DOCUMENTING DISCOVERIES — OFFLOAD FUTURE WORK
**You MUST add to this AGENTS.md file whenever you:**
- ✅ Discover a bug pattern or common mistake (add to ❌ NEVER DO)
- ✅ Find a configuration gotcha or edge case (add to relevant section)
- ✅ Identify a new best practice that should be followed (add to ✅ ALWAYS DO)
- ✅ Learn about a free tier limit or constraint (add to CRITICAL CONSTRAINTS)
- ✅ Create a new reusable pattern (add to CODING CONVENTIONS or new section)
- ✅ Encounter a breaking change or deprecated API (add to 🛑 MANDATORY: ASK BEFORE)
- ✅ Solve a non-obvious problem that might recur (add to dedicated section)

### WHY THIS MATTERS
- **Prevent Rework**: Future AI agents (or yourself in new conversations) won't repeat research
- **Maintain Consistency**: All agents follow the same evolving patterns
- **Knowledge Continuity**: Project knowledge compounds instead of being lost between conversations
- **Reduce Context Switching**: Critical information is always in this single source of truth

### ENFORCEMENT RULES
1. **Before completing ANY task** — Ask yourself: "Did I learn something that should be documented here?"
2. **After modifying patterns** — Update the corresponding section in this file immediately
3. **When creating workflows** — Reference them in this file so agents know they exist
4. **If you're unsure** — Document it anyway with a note that it needs verification

**FAILURE TO SYNC = TECHNICAL DEBT**. Treat this as seriously as writing the code itself.

## TECH STACK — DO NOT CHANGE WITHOUT APPROVAL
| Layer | Tech | Hosting |
|---|---|---|
| Frontend | Vue.js 3 (Composition API) + Vite 7 + Tailwind CSS 4 | Cloudflare Pages |
| Backend | Cloudflare Workers (vanilla JS, NO framework) | Cloudflare Workers |
| Database | Convex (real-time, TypeScript) | Convex Cloud |
| Email | Netlify Functions + Nodemailer (Gmail SMTP) | Netlify |
| Auth | Google OAuth + Email Magic Links + Guest Checkout | — |
| Products | Static JSON synced from GitHub | GitHub API |
| State | Vue Composables (NO Vuex/Pinia) | — |
| Package Manager | pnpm | — |

## 🛑 MANDATORY: ASK BEFORE DOING ANY OF THESE
1. Changing `frontend/convex/schema.ts` — deployed DB with live data
2. Modifying order status flow values
3. Changing authentication logic (OAuth, JWT, magic links)
4. Altering API route paths
5. Adding ANY new npm dependency (Workers has 1MB limit)
6. Changing database provider
7. Modifying CORS configuration
8. Changing admin auth mechanism
9. Restructuring monorepo layout
10. Modifying wrangler KV namespace bindings

## ✅ ALWAYS DO
- Use EXISTING patterns from codebase before inventing new ones
- Validate inputs on BOTH frontend AND backend
- Use Convex INDEXES for all queries — never full table scans
- Return `{ success: true, data }` or `{ success: false, error }` consistently
- Handle errors with try/catch and meaningful messages
- Use `Date.now()` for all timestamps
- Keep Workers bundle under 1MB
- Write code that works in V8 isolates (no Node.js built-ins in Workers)

## ❌ NEVER DO
- Expose secrets, API keys, or JWTs in frontend code
- Use Node.js APIs (`fs`, `path`, `crypto`) in Workers — use Web Crypto API
- Install `express`, `koa`, or any server framework in Workers
- Use `require()` — ESM only (`import`)
- Use `eval()`, `Function()`, or `innerHTML` with user data
- Commit `.env` files with real secrets
- Use `.collect()` on large tables without `.take(N)` or index filtering
- Use `any` type in Convex TypeScript files

## ORDER STATUS FLOW (SACRED — never modify without asking)
```
PENDING_VERIFICATION → PAYMENT_VERIFIED → PROCESSING → SHIPPED → DELIVERED
         ↘ CANCELLED (any stage)
         ↘ FAILED (any stage)
```

## MONOREPO STRUCTURE
```
MKS-Agency/
├── backend/                    # Cloudflare Worker (vanilla JS)
│   ├── src/index.js            # ALL API routes (single file)
│   ├── wrangler.jsonc          # Dev config
│   └── wrangler.production.jsonc # Prod config
├── frontend/                   # Vue.js 3 + Vite + Tailwind
│   ├── convex/                 # Schema, queries, mutations
│   │   ├── schema.ts           # ⚠️ LIVE DATABASE SCHEMA
│   │   └── _generated/         # Auto-generated (DO NOT EDIT)
│   └── src/
│       ├── composables/        # State management (singleton pattern)
│       ├── views/              # Route-level pages
│       └── components/         # Reusable UI components
├── email-server/               # Netlify Functions
│   └── functions/email.js      # Email function
└── docs/                       # Documentation
```

## CRITICAL CONSTRAINTS (FREE TIER LIMITS)
| Service | Limit | Action |
|---|---|---|
| Workers | 100k req/day, 10ms CPU, 1MB bundle | Cache aggressively, minimal deps |
| Convex | Metered queries | Always use indexes, `.take(N)` |
| Netlify | 125k invocations/month | Batch emails whenever possible |
| Pages | 500 builds/month | Don't trigger unnecessary deploys |

## RESPONSE FORMAT (Backend Workers)
```javascript
// Success
{ success: true, data: result }
// Error
{ success: false, error: 'Human-readable message' }
```

## SECURITY CHECKLIST (apply to every change)
- [ ] Input validated on both frontend AND backend
- [ ] No secrets exposed in frontend or logs
- [ ] CORS restricted to `env.FRONTEND_URL` (not `*`)
- [ ] Rate limiting on sensitive endpoints
- [ ] JWT verified with Web Crypto API
- [ ] SQL/NoSQL injection prevented via Convex validators

## CODING CONVENTIONS
- **Frontend**: 2 spaces, no semicolons, single quotes, Composition API + `<script setup>`
- **Backend**: Tabs, no semicolons, single quotes, ESM exports
- **Convex**: TypeScript with `v.` validators, always use indexes
- **Components**: PascalCase files, `defineProps()`, `defineEmits()`
- **Composables**: `useXxx.js` with module-level singleton state

## WHEN IN DOUBT
1. Check existing code patterns FIRST
2. Reference the full rules in `agents.md` for detailed examples
3. ASK the developer — never guess on production decisions

## DETAILED REFERENCE
For comprehensive code examples, patterns, and edge cases, see `agents.md` in the project root.
