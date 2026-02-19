---
description: Protocol for handling breaking changes in the MKS Agencies codebase
---

# Breaking Change Protocol 🚨

This workflow MUST be followed whenever a potential breaking change is identified. A "breaking change" requires EXPLICIT developer approval before implementation.

## 1. Identification
Is this a breaking change? Check this list:
- **Schema**: Adding required fields, removing fields, renaming tables/fields in Convex?
- **API**: Changing route paths, request/response shapes, auth requirements (JWT claims, OAuth flow)?
- **Dependencies**: Adding new pnpm packages (size impact!), upgrading major versions?
- **Config**: Changing `wrangler.jsonc`, KV namespaces, environment variable names?
- **Build**: Changing Vite config, build commands, deployment targets?
- **Order Flow**: Adding/removing/renaming order statuses (`PENDING_VERIFICATION`, `PAYMENT_VERIFIED`, etc.)?
- **Data Model**: Changing structure of products (JSON), users, or orders?

## 2. Notification & Approval
If ANY of the above are true, you MUST pause and seek approval using the template below.

**Copy this template into your chat:**

```markdown
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

## 3. Implementation Plan (Post-Approval)
Once approved, follow these steps:
1. **Migration**: Create a plan to migrate existing data if needed.
2. **Backward Compatibility**: Can you make the change additive (e.g., add optional field first)?
3. **Deployment Order**: Should database changes go before code changes? Document this.
4. **Communication**: Update relevant documentation in `docs/` and `README.md`.