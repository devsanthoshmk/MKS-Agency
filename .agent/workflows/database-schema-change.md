---
description: How to add or modify Convex database schema safely in production
---

# Database Schema Change Workflow 🗄️

⚠️ **DANGER ZONE** — This workflow handles changes to the LIVE Convex database (`frontend/convex/schema.ts`).
Changes affect production data IMMEDIATELY after deployment.

## 1. Pre-Change Approval
**STOP.** Before ANY schema change, present this to the developer:

```
⚠️ DATABASE SCHEMA CHANGE REQUEST

I need to modify `frontend/convex/schema.ts` to [describe change].

Change type:
- [ ] Adding a new table
- [ ] Adding a new field (optional)  ← safest
- [ ] Adding a new field (required)  ← needs migration
- [ ] Removing a field              ← data loss risk
- [ ] Renaming a field              ← breaking change
- [ ] Adding a new index
- [ ] Modifying a validator

Impact on existing data: [describe]
Migration needed: Yes/No
Backward compatible: Yes/No

Shall I proceed?
```

**DO NOT proceed without explicit "yes" from the developer.**

## 2. Safe Schema Change Rules

### ✅ Safe Changes (additive, backward compatible):
- Adding a new table
- Adding an OPTIONAL field: `newField: v.optional(v.string())`
- Adding a new index
- Adding a new query or mutation

### ⚠️ Risky Changes (need migration plan):
- Adding a REQUIRED field (existing docs won't have it)
- Changing field type (e.g., `v.string()` → `v.number()`)
- Renaming a field (old code references break)

### 🛑 Dangerous Changes (data loss risk):
- Removing a field
- Removing a table
- Removing an index that queries depend on

## 3. Implementation Steps

### Step 1: Test Locally First
```bash
cd frontend
pnpm exec convex dev
```
- Verify schema compiles
- Test queries and mutations still work
- Check that existing data is compatible

### Step 2: Update Related Code
If adding a new field:
- Update relevant mutations to set the field
- Update relevant queries if they need to return it
- Update frontend composables/components to use it
- Update backend handlers if they read/write the field

### Step 3: Handle Existing Data
If the new field is required:
```typescript
// Option A: Make it optional first, backfill, then make required
newField: v.optional(v.string()) // Start optional

// Option B: Set default in creation mutation
newField: args.newField ?? 'default_value'
```

### Step 4: Deploy
```bash
cd frontend
pnpm exec convex deploy --prod
```

### Step 5: Verify Production
- Check Convex dashboard for deployment success
- Test affected queries/mutations in production
- Verify existing data is still accessible

## 4. Rollback Plan
If something goes wrong:
1. Revert schema.ts changes
2. Deploy the reverted schema: `pnpm exec convex deploy --prod`
3. Note: Removed fields may lose data — always add fields as optional first

## 5. Post-Change
- Update `docs/DATABASE.md` with schema changes
- Update this workflow if new patterns are discovered
