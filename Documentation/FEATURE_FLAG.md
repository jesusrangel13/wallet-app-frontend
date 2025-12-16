# Feature Flag: Category Templates System

## Overview

This document describes the `USE_CATEGORY_TEMPLATES` feature flag which controls the transition from the legacy per-user category system to the new template-based category system.

## Environment Variable

```bash
# Enable new template system (recommended for new deployments)
USE_CATEGORY_TEMPLATES=true

# Use legacy system (default, for backward compatibility)
USE_CATEGORY_TEMPLATES=false
```

## What Changes with the Flag

### ✅ When `USE_CATEGORY_TEMPLATES=true` (NEW SYSTEM)

**Registration:**
- User registration is instant (no 80 category records created)
- Categories are served from global templates on-demand
- Massive database reduction: 95% fewer records

**Category Management:**
- Users access 80 shared category templates
- Users can create overrides/custom categories
- Changes only stored in `UserCategoryOverride` table

**Performance:**
- Instant user registration
- Lower database load
- Redis-ready caching placeholders
- ~10MB database footprint for 10,000 users

**API Endpoints:**
- `/categories/templates/all` - Get all templates
- `/categories/templates/hierarchy` - Get hierarchical templates
- `/categories/overrides` - Manage overrides
- `/categories/custom` - Custom categories

### ❌ When `USE_CATEGORY_TEMPLATES=false` (LEGACY SYSTEM)

**Registration:**
- Creates 80 category records per user during registration (~800ms)
- Each user has their own copies of all categories
- High database usage

**Category Management:**
- Categories stored in `Category` table
- Full customization possible
- No template sharing

**Performance:**
- Slower registration
- Higher database load
- 800k+ records for 10,000 users (~160-240MB)

**API Endpoints:**
- Legacy `/categories` endpoints work as before

## Migration Guide

### Step 1: Deployment with Feature Flag OFF (Current)

```bash
# .env or environment variables
USE_CATEGORY_TEMPLATES=false
```

- New code is deployed but feature is inactive
- Legacy system continues working
- All existing data remains unchanged

### Step 2: Enable for New Users (Canary Deployment)

```bash
# Enable for specific users or accounts
USE_CATEGORY_TEMPLATES=true
```

Options:
1. **All users:** Set flag to `true` globally
2. **Specific users:** Implement per-user flag logic in code
3. **Percentage rollout:** Use environment-based feature toggle service

### Step 3: Data Migration

Run migration scripts to convert existing categories:

```bash
# Initialize templates (idempotent, safe to run multiple times)
npm run migrate:templates

# Validate migration results
npm run validate:migration
```

### Step 4: Monitor and Verify

- Monitor database metrics (record count, query performance)
- Verify category operations work correctly
- Check transaction filtering with categories
- Monitor API response times

### Step 5: Deprecate Legacy System (Fase 8)

After verification period (1-4 weeks):

```sql
-- Backup legacy data
CREATE TABLE category_legacy_backup AS SELECT * FROM categories;

-- Drop legacy table
DROP TABLE categories;
```

## Rollback Plan

If issues occur with new system:

```bash
# Revert to legacy system
USE_CATEGORY_TEMPLATES=false
```

**Important:** After rollback, you may need to:
1. Restore database from backup
2. Re-run legacy category initialization
3. Investigate root cause before attempting again

## Monitoring

Key metrics to track:

```
- User registration time (ms)
- Database record count
- API response times for category endpoints
- Transaction filtering performance
- Custom category creation success rate
```

## Code Impact Map

### CategoryService
- `getCategories()` - Routes to template or legacy system
- `createDefaultCategoriesForUser()` - Skips creation when flag enabled
- Other methods work with both systems

### TransactionService
- `getTransactions()` - Handles both category types
- Category filtering adapts to system in use

### AuthService
- No changes needed
- Works with both systems transparently

### Frontend API
- New `categoryTemplateAPI` endpoints available
- Legacy `categoryAPI` continues working
- Frontend can detect flag via API response

## Gradual Rollout Strategy

### Phase 1: Internal Testing (Day 1-3)
- Enable on staging/dev environments
- Run full test suite
- Validate migration scripts

### Phase 2: Canary Users (Day 4-7)
- Enable for 5-10% of new users
- Monitor error rates and performance
- Gather feedback

### Phase 3: Regional Rollout (Week 2)
- Enable for specific regions/countries
- Stage rollout to 50% of new users
- Monitor database and API performance

### Phase 4: Full Rollout (Week 3)
- Enable for all new users
- Keep legacy system available as fallback
- Begin existing user migration

### Phase 5: Cleanup (Week 4+)
- Verify all existing users migrated
- Deprecate legacy endpoints
- Remove legacy code (Fase 8)

## Troubleshooting

### Issue: Templates not showing up

```bash
# Check if templates are initialized
npm run validate:migration

# Manually initialize if needed
npm run migrate:templates
```

### Issue: Transaction filtering broken

Verify `USE_CATEGORY_TEMPLATES` is set correctly in environment and:
- Check TransactionService is handling both category types
- Verify category IDs match (template vs override)
- Check for missing overrides for user

### Issue: Performance degradation

- Monitor database query times
- Check for N+1 queries in category fetching
- Ensure indexes are created (migration handles this)
- Consider implementing Redis caching (placeholder in code)

## Support & Contact

For issues with the feature flag migration:

1. Check this document
2. Review test output: `npm run test`
3. Run validation: `npm run validate:migration`
4. Check logs for `USE_CATEGORY_TEMPLATES` related messages

## Timeline

| Date | Phase | Status |
|------|-------|--------|
| 2024-Q4 | Fase 1-5 Complete | ✅ Done |
| Next | Fase 6 Tests | ⏳ In Progress |
| Next | Fase 7 Feature Flag | ⏳ Planned |
| Next | Fase 8 Cleanup | ⏳ Planned |

---

For detailed technical information, see [CATEGORY_TEMPLATE_IMPLEMENTATION.md](./CATEGORY_TEMPLATE_IMPLEMENTATION.md)
