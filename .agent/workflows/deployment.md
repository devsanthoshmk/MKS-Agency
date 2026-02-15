---
description: Deploy the MKS Agencies application components to production
---

# MKS Agencies Deployment Workflow

This workflow guides you through deploying all components of the application to production environments.

## Prerequisite Checks
1. Ensure all environment variables are set in production dashboards.
2. Ensure secrets are updated via `wrangler secret put` (not in config files).
3. Verify that the Convex schema is compatible with existing data.
4. Verify CORS origins are updated for production URLs in `wrangler.production.jsonc`.
5. Ensure rate limiting is configured.
6. Verify bundle size is under 1MB for Workers.

## 1. Convex Database Deployment
Changes to the database schema must be deployed first.

```bash
cd frontend
pnpm exec convex deploy --prod
```

## 2. Backend Deployment (Cloudflare Workers)
This deploys the backend logic.

```bash
cd backend
# Uses wrangler.production.jsonc — production URLs
pnpm run deploy
# Equivalent to: wrangler deploy -c wrangler.production.jsonc
```

## 3. Frontend Deployment (Cloudflare Pages)
**Note**: Cloudflare Pages is typically configured to auto-deploy from Git pushes to `main`. If manual deployment is needed:

```bash
cd frontend
# Build for production (uses .env.production)
pnpm run build
# Upload to Cloudflare Pages (requires wrangler login)
pnpm run pages:deploy
```

## 4. Email Server Deployment (Netlify Functions)

```bash
cd email-server
netlify deploy --prod
```

## Post-Deployment Verification
- Access the production frontend: `https://mksagencies.pages.dev`
- Verify backend health: `https://backend.mks-agencies-official.workers.dev`
- Test a critical flow (e.g., Guest Verification or simple read query).
