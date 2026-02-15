---
description: How to debug and fix production issues in MKS Agencies
---

# Bug Fix / Debugging Workflow 🐛

Follow this workflow when diagnosing and fixing bugs in the MKS Agencies platform.

## 1. Identify the Service
Determine which service is affected:
- **Frontend** (Vue.js): UI issues, rendering bugs, state management issues
- **Backend** (Workers): API errors, auth failures, data issues
- **Database** (Convex): Schema issues, query failures, data corruption
- **Email** (Netlify): Email delivery failures, template issues

## 2. Reproduce the Issue
- Get exact error messages and stack traces
- Identify the request flow (Frontend → Backend → Convex/External)
- Check browser console for frontend errors
- Check Cloudflare Workers logs for backend errors

## 3. Investigate

### Frontend Debugging
```bash
cd frontend && pnpm run dev
```
- Check Vue DevTools for component state
- Check Network tab for API call details
- Verify composable state is correct
- Check if the issue is in template, composable, or API layer

### Backend Debugging
```bash
cd backend && pnpm run dev
```
- Check Wrangler logs for errors
- Test the specific endpoint with curl or Postman:
```bash
curl -X POST http://localhost:8787/api/endpoint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"key": "value"}'
```
- Verify environment variables are set correctly
- Check KV state for rate limiting issues

### Convex Debugging
```bash
cd frontend && pnpm exec convex dev
```
- Check Convex dashboard for function logs
- Verify indexes exist for the queries being used
- Check if data is in expected format

### Email Debugging
```bash
cd email-server && netlify dev
```
- Check Netlify function logs
- Verify Gmail SMTP credentials
- Test with a simple email first

## 4. Implement Fix
- Make the MINIMAL change needed to fix the issue
- DO NOT refactor unrelated code during a bug fix
- Follow existing code patterns
- Add input validation if the bug was caused by bad input
- Add error handling if the bug was an unhandled exception

## 5. Verify Fix
- Test the exact scenario that was broken
- Test related edge cases
- Run existing tests:
```bash
cd backend && pnpm test
```

## 6. Quality Gate
Follow the `/code-quality-gate` workflow before finalizing.

## 7. Post-Fix
- Document the root cause if it was non-obvious
- Consider if similar bugs could exist elsewhere
- Add test coverage if applicable
