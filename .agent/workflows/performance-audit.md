---
description: Performance and cost optimization audit for MKS Agencies
---

# Performance & Cost Audit Workflow 💰

Run this audit periodically or before major deployments to ensure the platform stays within free tier limits and performs optimally.

## 1. Workers Bundle Size Check
// turbo
```bash
cd backend && npx wrangler deploy --dry-run -c wrangler.production.jsonc 2>&1 | grep -i "size\|bundle\|total"
```
- ⚠️ Must stay under **1MB compressed**
- If over 800KB: check for unnecessary dependencies
- Only allowed dependency: `convex`

## 2. Convex Query Audit
Check that ALL queries use indexes:

// turbo
```bash
cd frontend && grep -n "\.filter\(" convex/queries.ts convex/mutations.ts 2>/dev/null
```
- Any `.filter()` usage is a **full table scan** — replace with `.withIndex()`
- Every query MUST use `.withIndex()`, `.first()`, or `.take(N)`

Check for unbounded `.collect()`:
// turbo
```bash
cd frontend && grep -n "\.collect()" convex/queries.ts convex/mutations.ts 2>/dev/null
```
- Replace with `.take(N)` where N is a reasonable limit

## 3. Frontend Performance Audit

Check for lazy loading:
// turbo
```bash
cd frontend && grep -rn '<img' src/ --include="*.vue" | grep -v 'loading="lazy"'
```
- All `<img>` tags should have `loading="lazy"`

Check for search debouncing:
// turbo
```bash
cd frontend && grep -rn 'debounce\|setTimeout.*search\|watch.*search' src/ --include="*.vue" --include="*.js"
```

Check for code splitting:
// turbo
```bash
cd frontend && grep -n "import(" src/main.js
```
- Heavy pages (AdminDashboard) should use dynamic `import()` for lazy loading

## 4. Security Quick Scan

Check for secret leaks:
// turbo
```bash
cd frontend && grep -rn 'JWT_SECRET\|CONVEX_ADMIN_KEY\|GITHUB_TOKEN\|APP_PASSWORD' src/ --include="*.vue" --include="*.js"
```
- Should return **zero results** — these must NEVER appear in frontend code

Check for v-html usage:
// turbo
```bash
cd frontend && grep -rn 'v-html' src/ --include="*.vue"
```
- `v-html` with user data is a XSS vulnerability

Check for console.log in production:
// turbo
```bash
grep -rn 'console\.log' backend/src/index.js frontend/src/ --include="*.js" --include="*.vue" | grep -v 'node_modules' | grep -v 'console.error'
```
- Remove or replace sensitive console.log with console.error for actual errors only

## 5. Dependency Weight Check
// turbo
```bash
cd backend && cat package.json | grep -A 100 '"dependencies"' | head -20
cd frontend && cat package.json | grep -A 100 '"dependencies"' | head -30
```
- Backend should have minimal dependencies (ideally just `convex`)
- Frontend: flag any packages over 100KB that could be tree-shaken

## 6. Environment Variable Check
// turbo
```bash
# Check frontend doesn't expose non-VITE vars
cd frontend && grep -rn 'import\.meta\.env\.' src/ --include="*.js" --include="*.vue" | grep -v 'VITE_'
```
- Frontend should ONLY access `VITE_`-prefixed env vars

## 7. Generate Report
After running all checks, summarize:
- Bundle size: ____ KB / 1024 KB limit
- Full table scans found: ____
- Unbounded .collect() calls: ____
- Missing lazy loading images: ____
- Security issues found: ____
- Unnecessary console.log: ____
