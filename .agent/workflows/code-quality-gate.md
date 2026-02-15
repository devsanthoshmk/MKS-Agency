---
description: Code review and quality gate before any code is committed or merged
---

# Code Quality Gate Workflow 🔍

This workflow MUST be followed before finalizing any code change in the MKS Agencies project. This ensures production-readiness, scalability, and cost optimization.

## 1. Pattern Compliance Check
Before writing new code, verify:
- [ ] Did I check existing codebase for a similar pattern first?
- [ ] Am I following the Composition API + `<script setup>` pattern for Vue?
- [ ] Am I using the singleton composable pattern for state?
- [ ] Does my backend response use `{ success: true/false, data/error }` format?
- [ ] Am I using Convex indexes (not `.filter()`) for queries?

## 2. Security Review
- [ ] All user inputs validated on BOTH frontend AND backend
- [ ] No secrets, tokens, or API keys in frontend code or console.log
- [ ] CORS set to `env.FRONTEND_URL` (not `*`)
- [ ] No `v-html` with user-supplied data
- [ ] No `eval()`, `Function()`, or `innerHTML` with user data
- [ ] JWT verification uses Web Crypto API (not Node.js `crypto`)
- [ ] Rate limiting applied to new sensitive endpoints

## 3. Cost Optimization Review
- [ ] No `.collect()` without `.take(N)` or index filtering
- [ ] All Convex queries use indexes (no full table scans)
- [ ] No unnecessary API calls (check if data can be cached or batched)
- [ ] No new heavy npm dependencies (Workers bundle < 1MB)
- [ ] No polling — use Convex real-time subscriptions on frontend
- [ ] GitHub API calls cached in KV with TTL

## 4. Performance Review
- [ ] Images use `loading="lazy"`
- [ ] Search inputs debounced (300ms)
- [ ] `computed()` used for derived state (not recalculated in template)
- [ ] Backend uses early returns for invalid requests
- [ ] Independent async calls use `Promise.all()`
- [ ] No N+1 query patterns in Convex

## 5. Error Handling Review
- [ ] Every `fetch()` call wrapped in try/catch
- [ ] Frontend shows user-friendly toast for errors
- [ ] Backend returns appropriate HTTP status codes
- [ ] Backend logs errors with timestamps (not sensitive data)
- [ ] Convex mutations validate args with `v.` validators

## 6. Breaking Change Check
If ANY of these apply, STOP and follow the `breaking-change-protocol` workflow:
- Schema change to `frontend/convex/schema.ts`
- API route path modified
- JWT claims or token format changed
- New npm dependency added
- Order status values modified
- wrangler.jsonc bindings changed

## 7. Final Checklist
- [ ] Code follows existing indentation (2 spaces frontend, tabs backend)
- [ ] No semicolons, single quotes used
- [ ] No `require()` — ESM imports only
- [ ] No Node.js APIs in Workers code
- [ ] Functions have JSDoc comments
- [ ] Related documentation updated in `docs/`
