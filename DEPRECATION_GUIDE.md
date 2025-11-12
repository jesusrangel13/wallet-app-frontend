# Deprecation Guide: Legacy Category System (Fase 8)

This document provides step-by-step instructions for safely removing the legacy category system once the migration to the template-based system is complete.

## Overview

The legacy category system is being deprecated in favor of a template-based system that significantly reduces database bloat and improves performance. This phase involves:

1. Verification of complete migration
2. Data backup and archival
3. Cleanup of legacy database records
4. Code cleanup and removal of feature flags
5. Documentation updates

## Prerequisites

Before starting the cleanup process, ensure:

- ✅ **Feature flag enabled in production**: `USE_CATEGORY_TEMPLATES=true` for 4+ weeks
- ✅ **All users migrated**: Run `npm run validate:migration` with 0 errors
- ✅ **Zero legacy category usage**: All transactions use template-based categories
- ✅ **Production monitoring complete**: 1-4 weeks of stability data collected
- ✅ **Full database backup**: Backup taken and tested for restoration
- ✅ **Team coordination**: All developers aware of the deprecation

## Timeline

### Week 1-2: Final Validation
- Monitor application metrics
- Review error logs for any legacy category references
- Confirm user feedback shows no issues
- Test rollback procedure (if needed)

### Week 3: Data Backup
- Execute full database backup
- Verify backup integrity
- Store in secure location with retention policy

### Week 4: Legacy Data Archival
- Run cleanup script
- Review archival output
- Verify no critical data was missed

### Week 5+: Code Cleanup
- Remove feature flag from source code
- Delete legacy routes (if not needed for backward compatibility)
- Update documentation
- Remove migration scripts

## Cleanup Process

### Step 1: Final Validation

Run the validation script to confirm all data is properly migrated:

```bash
cd backend
npm run validate:migration
```

Expected output:
```
✅ All 80 templates initialized
✅ All users processed
✅ Sample user verified successfully
✅ Migration validation passed
```

### Step 2: Database Backup

Create a full database backup before any destructive operations:

```bash
# For PostgreSQL
pg_dump -U your_user -h your_host database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# For MySQL
mysqldump -u your_user -p -h your_host database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# For SQLite
cp database.sqlite database_backup_$(date +%Y%m%d_%H%M%S).sqlite
```

Test backup restoration:
```bash
# PostgreSQL (to test database)
createdb -U your_user test_restore
psql -U your_user -d test_restore < backup_file.sql

# MySQL
mysql -u your_user -p < backup_file.sql
```

### Step 3: Legacy Data Archival

Run the cleanup script with confirmation:

```bash
cd backend
npm run cleanup:legacy -- --confirm
```

This script:
1. ✅ Archives all legacy categories to `legacy-categories-backup-[timestamp].json`
2. ✅ Deletes legacy category records from the database
3. ✅ Validates no transactions are affected
4. ✅ Provides statistics on the cleanup operation

Example output:
```
⚠️  CLEANUP SCRIPT FOR LEGACY CATEGORY SYSTEM
======================================================================

📊 Statistics:
   Category templates: 80
   Legacy categories to remove: 4200
   Transactions with legacy categories: 0

📦 Step 1: Archiving legacy categories...
   ✅ Archived 4200 categories to ./legacy-categories-backup-2025-01-15T14-30-45-123Z.json

🗑️  Step 2: Deleting legacy categories from database...
   ✅ Deleted 4200 categories

✅ Cleanup complete!

📊 Final state:
   Template categories: 80
   Legacy categories: 0
   User overrides: 1250
```

### Step 4: Code Cleanup

After confirming the cleanup script succeeded:

#### 4.1 Remove Feature Flag from Services

Edit `backend/src/services/category.service.ts`:
- Remove the `USE_CATEGORY_TEMPLATES` feature flag check
- Keep only the template-based implementation
- Update default category creation to no-op

Edit `backend/src/services/transaction.service.ts`:
- Remove legacy category filtering logic
- Simplify to only use template-based categories

#### 4.2 Update Category Routes (Optional)

Edit `backend/src/routes/category.routes.ts`:
- Keep legacy routes for backward compatibility (deprecated)
- Or remove if you want strict API changes

Recommended approach: Mark routes as deprecated in documentation

#### 4.3 Environment Variables

Remove from `.env` file:
```bash
# DEPRECATED - No longer needed
# USE_CATEGORY_TEMPLATES=true
```

#### 4.4 Update Configuration

Edit `backend/.env.example`:
- Remove the `USE_CATEGORY_TEMPLATES` variable documentation
- Add note about legacy category support removal

### Step 5: Documentation Updates

Create a migration changelog entry:

```markdown
## [Migration Complete] Legacy Category System Removed

### Date: 2025-01-15
### Status: Production Cleanup Complete

#### What Changed
- Legacy per-user categories removed from database
- All transactions now exclusively use template-based categories
- 95% reduction in category-related database records

#### Impact
- Database size reduced by ~2-4% (depending on user base)
- Category queries now use global templates (faster)
- User customizations stored as lightweight overrides

#### Files Changed
- Removed: `backend/src/services/categoryLegacy.service.ts` (if isolated)
- Modified: `backend/src/services/category.service.ts`
- Modified: `backend/src/services/transaction.service.ts`
- Removed: Feature flag `USE_CATEGORY_TEMPLATES`

#### For Developers
- New users: Automatic access to 80 templates
- Category customization: Use `UserCategoryOverride` table
- Custom categories: Use `createCustomCategory()` endpoint
```

Update README.md:
- Remove references to legacy category system
- Update category documentation to only mention templates

### Step 6: Monitoring & Rollback

If issues appear after cleanup:

#### Immediate Rollback (if within 48 hours)
```bash
# Restore from backup
psql -U your_user -d database_name < backup_file.sql

# Revert code changes
git revert [cleanup-commit-hash]

# Redeploy with feature flag
USE_CATEGORY_TEMPLATES=false npm run start
```

#### Post-Cleanup Monitoring

Monitor for 1-2 weeks:
- Error logs for any category-related exceptions
- API response times (should be similar or faster)
- User-reported issues with categories
- Database query performance metrics

Key metrics to track:
```
- Average category query time (should be <50ms)
- Category override creation rate
- Custom category creation rate
- Error rate for category operations
```

## Verification Checklist

After cleanup, verify:

- [ ] Cleanup script completed successfully
- [ ] No error messages in cleanup output
- [ ] Legacy categories archive file saved securely
- [ ] Database backup verified and stored
- [ ] Code changes committed to version control
- [ ] Feature flag removed from environment
- [ ] Documentation updated
- [ ] Monitoring dashboards updated
- [ ] Team notified of completion
- [ ] Archives accessible (in case of future audit)

## Rollback Procedure (If Needed)

**Rollback must happen within hours of cleanup:**

```bash
# 1. Restore database from backup
psql -U your_user -d database_name < backup_file.sql

# 2. Revert code changes
git revert HEAD  # Or specific cleanup commit

# 3. Redeploy with legacy system enabled
export USE_CATEGORY_TEMPLATES=false
npm run build
npm start
```

**Note:** If rollback takes >12 hours, some new transaction data may be lost. Use transaction logs to identify affected records.

## FAQ

### Q: Can I keep the legacy categories table "just in case"?
A: It's safe to keep if:
- No transactions reference legacy categories
- You set up proper indexes to prevent query confusion
- You document the deprecation clearly for future developers

Otherwise, it's better to remove it to avoid accidental usage.

### Q: What happens to archived categories?
A: The archive file contains:
- All legacy category metadata (name, icon, color, etc.)
- Parent-child relationships
- Timestamp of when it was archived

Store it in:
- Version control (if public)
- Encrypted backup storage (if sensitive)
- Archive server for compliance

### Q: Can I undo the cleanup?
A: Only if you:
1. Have the database backup
2. Perform rollback within hours
3. Haven't made other database changes since cleanup

After 24 hours, rollback becomes risky due to data conflicts.

### Q: Do I need to notify users?
A: Probably not, if:
- They can't directly access the legacy API
- Frontend only uses the new template system
- All migrations completed without issues

Notify if:
- You're removing legacy API endpoints they relied on
- You need to deprecate the old category system
- You're making breaking API changes

## Success Criteria

The cleanup is successful when:

1. ✅ Cleanup script ran with `--confirm` flag
2. ✅ All legacy categories deleted from database
3. ✅ Zero errors in cleanup output
4. ✅ Feature flag removed from code
5. ✅ All tests pass
6. ✅ Application starts and runs normally
7. ✅ Category operations work with templates
8. ✅ No legacy category references in code
9. ✅ Documentation updated
10. ✅ Archive file secured for future audit

## Additional Resources

- [FEATURE_FLAG.md](./FEATURE_FLAG.md) - Feature flag migration strategy
- [backend/scripts/cleanup-legacy-categories.ts](./backend/scripts/cleanup-legacy-categories.ts) - Cleanup script
- [backend/scripts/validate-migration.ts](./backend/scripts/validate-migration.ts) - Validation script
- [Database Schema](./backend/prisma/schema.prisma) - Latest schema

## Support

For questions about the cleanup process:
1. Check this guide
2. Review cleanup script output
3. Check application logs
4. Contact the development team

---

**Last Updated:** 2025-01-15
**Status:** Fase 8 - Ready for Production Cleanup
