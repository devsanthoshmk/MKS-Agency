# MKS Agencies — Workspace Rules for Antigravity IDE
# Auto-loaded by Antigravity for every conversation in this workspace
# Source of truth: AGENTS.md and agents.md in project root
# Last Updated: 2026-02-16

---

## 🚨 IDENTITY — READ THIS FIRST

- **Project**: MKS Agencies — a **LIVE production e-commerce platform** for Ayurvedic products
- **Status**: Deployed with **real customers** and **real orders** — treat every change as production-critical
- **Owner**: Solo developer — prioritize **simplicity, maintainability, and cost-effectiveness**
- **Manual payment verification** is a feature, not a bug — no payment gateway integration

---

## 🛑 MANDATORY: ASK BEFORE DOING ANY OF THESE

1. Changing `frontend/convex/schema.ts` — deployed DB with **live data**
2. Modifying order status flow values
3. Changing authentication logic (OAuth, JWT, magic links)
4. Altering API route paths
5. Adding ANY new npm dependency (Workers has **1MB limit**)
6. Changing database provider
7. Modifying CORS configuration
8. Changing admin auth mechanism
9. Restructuring monorepo layout
10. Modifying wrangler KV namespace bindings

---

## ✅ ALWAYS DO

- Use **existing patterns** from codebase before inventing new ones
- Validate inputs on **BOTH frontend AND backend**
- Use Convex **indexes** for all queries — **never** full table scans
- Return `{ success: true, data }` or `{ success: false, error }` consistently
- Handle errors with `try/catch` and meaningful messages
- Use `Date.now()` for all timestamps
- Keep Workers bundle under **1MB**
- Write code that works in **V8 isolates** (no Node.js built-ins in Workers)
- Use `v.` validators in all Convex mutations
- Use `ctx.db.patch()` for partial updates (not `ctx.db.replace()`)

---

## ❌ NEVER DO

- Expose secrets, API keys, or JWTs in frontend code
- Use Node.js APIs (`fs`, `path`, `crypto`) in Workers — use **Web Crypto API**
- Install `express`, `koa`, or any server framework in Workers
- Use `require()` — **ESM only** (`import`)
- Use `eval()`, `Function()`, or `innerHTML` with user data
- Commit `.env` files with real secrets
- Use `.collect()` on large tables without `.take(N)` or index filtering
- Use `any` type in Convex TypeScript files
- **Manually construct Convex storage URLs** — Always use `api.files.getFileUrl` query after upload
- Use `v-html` with user-supplied data
- Use `localStorage` for sensitive auth tokens
- Bypass rate limiting checks for admin endpoints

---

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

---

## ORDER STATUS FLOW (SACRED)

```
PENDING_VERIFICATION → PAYMENT_VERIFIED → PROCESSING → SHIPPED → DELIVERED
         ↘ CANCELLED (any stage)
         ↘ FAILED (any stage)
```

---

## CODING CONVENTIONS

- **Frontend**: 2 spaces, no semicolons, single quotes, Composition API + `<script setup>`
- **Backend**: Tabs, no semicolons, single quotes, ESM exports
- **Convex**: TypeScript with `v.` validators, always use indexes
- **Components**: PascalCase files, `defineProps()`, `defineEmits()`
- **Composables**: `useXxx.js` with module-level singleton state
- **General**: `const` by default, destructure props, template literals, arrow functions, optional chaining

---

## CRITICAL CONSTRAINTS (FREE TIER LIMITS)

| Service | Limit | Action |
|---|---|---|
| Workers | 100k req/day, 10ms CPU, 1MB bundle | Cache aggressively, minimal deps |
| Convex | Metered queries | Always use indexes, `.take(N)` |
| Netlify | 125k invocations/month | Batch emails whenever possible |
| Pages | 500 builds/month | Don't trigger unnecessary deploys |

---

## SYNCHRONIZATION RULE — CRITICAL

Every change to the codebase **MUST** be synchronized with:
1. **AGENTS.md** — Update relevant sections when you modify patterns or discover issues
2. **Workflows** (`.agent/workflows/*.md`) — Update or create workflows for repeatable processes
3. **Knowledge Items** (`.agent/knowledge/`) — Document architectural decisions and discoveries
4. **Project Docs** (`docs/`) — Keep DATABASE.md, BACKEND.md, FRONTEND.md, EMAIL_SERVER.md in sync

---

## REFERENCES

- **Full detailed rules**: `agents.md` (project root, 871 lines of comprehensive examples)
- **Summary rules**: `AGENTS.md` (project root, 199-line quick reference)
- **Knowledge Items**: `.agent/knowledge/` (topic-specific deep knowledge)
- **Workflows**: `.agent/workflows/` (step-by-step repeatable processes)
- **Documentation**: `docs/` (BACKEND.md, FRONTEND.md, DATABASE.md, EMAIL_SERVER.md)
