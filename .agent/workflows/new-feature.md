---
description: How to add a new feature to the MKS Agencies platform
---

# New Feature Implementation Workflow 🚀

Follow this workflow when implementing any new feature in MKS Agencies.

## 1. Requirements Analysis
- Understand the feature requirements completely
- Identify which services are affected (Frontend / Backend / Convex / Email)
- Check if this introduces any breaking changes → if yes, follow `/breaking-change-protocol`

## 2. Check Existing Patterns
Before writing ANY code:

// turbo
```bash
# Search for similar patterns in the codebase
grep -r "relevant_pattern" --include="*.js" --include="*.ts" --include="*.vue" frontend/src/ backend/src/
```

- Review existing composables, components, and API handlers for reusable patterns
- DO NOT invent new patterns when existing ones work

## 3. Backend Changes (if needed)

### Add API Route
- Add route handler in `backend/src/index.js` following the existing pattern:
```javascript
if (path === '/api/your-endpoint' && request.method === 'POST') {
  return handleYourEndpoint(request, env)
}
```
- Use consistent response format: `{ success: true/false, data/error }`
- Add input validation at the top of the handler
- Add rate limiting for sensitive endpoints
- Ensure CORS headers on every response

### Add Convex Functions (if needed)
- ⚠️ **ASK BEFORE** modifying `schema.ts`
- Add queries to `frontend/convex/queries.ts` — always use indexes
- Add mutations to `frontend/convex/mutations.ts` — always validate args with `v.`
- Add indexes to schema if new query patterns are needed

## 4. Frontend Changes

### Add Composable (if needed)
- Create `frontend/src/composables/useFeatureName.js`
- Use singleton pattern with module-level state
- Use `ref()` and `computed()` for reactivity
- Wrap all API calls in try/catch
- Use `VITE_API_URL` for backend calls

### Add Component
- Create in `frontend/src/components/FeatureName.vue`
- Use `<script setup>` + Composition API
- Use `defineProps()` and `defineEmits()`
- Use Tailwind utility classes for styling
- Add `loading="lazy"` on images

### Add Route (if needed)
- Add to `frontend/src/main.js` router config
- Create view in `frontend/src/views/`
- Consider lazy loading for heavy pages

## 5. Testing
```bash
# Run backend tests
cd backend && pnpm test

# Run frontend dev server and manually test
cd frontend && pnpm run dev
```
- Test success and error paths
- Test with missing/invalid inputs
- Test auth flows (authenticated, unauthenticated, admin)

## 6. Quality Gate
Follow the `/code-quality-gate` workflow for final review.

## 7. Documentation
- Update relevant `docs/*.md` files
- Update `README.md` if needed
- Add inline JSDoc comments to new functions
