# Quick Reference: Frontend Components & Changes Needed

## File-by-File Change List

### CRITICAL (Update First)
```
1. frontend/src/types/index.ts
   ├─ ADD: CategoryTemplate interface
   ├─ ADD: CategoryOverride interface
   ├─ ADD: CustomCategory interface
   ├─ ADD: MergedCategory interface
   └─ UPDATE: Category interface (optional)

2. frontend/src/lib/api.ts
   ├─ UPDATE: categoryTemplateAPI types (currently 'any[]')
   ├─ ADD: CreateCategoryOverrideForm type
   ├─ ADD: CreateCustomCategoryForm type
   └─ VERIFY: All response types correct

3. frontend/src/hooks/useCategories.ts
   ├─ ADD: useTemplateCategories() hook
   ├─ ADD: useUserOverrides() hook
   ├─ ADD: useMergedCategories() hook (CORE - combines all three)
   ├─ KEEP: useCategories() for backward compat
   └─ NOTE: Must handle feature flag detection

4. frontend/src/components/CategorySelector.tsx
   ├─ CHANGE: From direct API call to useMergedCategories hook
   ├─ ADD: Visual indicator for category source
   ├─ TEST: With template, override, and custom categories
   └─ VERIFY: Subcategories still work
```

### HIGH (Update Next)
```
5. frontend/src/app/dashboard/settings/categories/page.tsx
   ├─ REDESIGN: Split into three tabs/views:
   │  ├─ Templates (read-only, can create override)
   │  ├─ Overrides (edit/delete/revert)
   │  └─ Custom (full CRUD)
   ├─ ADD: Category source indicator
   ├─ ADD: "Create override" button on templates
   ├─ ADD: "Revert" button on overrides
   ├─ CHANGE: Delete only works on custom categories
   └─ VERIFY: Handle all three category types

6. frontend/src/app/dashboard/transactions/page.tsx
   ├─ CREATE: loadMergedCategories() helper function
   ├─ CHANGE: Use helper instead of categoryAPI.getAll()
   ├─ UPDATE: setCategories type to MergedCategory[]
   └─ TEST: Filtering still works

7. frontend/src/app/dashboard/import/page.tsx
   ├─ CHANGE: Use merged categories for template
   ├─ UPDATE: loadData() to get merged categories
   └─ VERIFY: Category selection in modal works
```

### MEDIUM (Update After)
```
8. frontend/src/components/TransactionFilters.tsx
   ├─ UPDATE: Accept MergedCategory[] type
   ├─ OPTIONAL: Show category source indicator
   └─ TEST: Filtering by all category types

9. frontend/src/components/TransactionFormModal.tsx
   ├─ NO CHANGES NEEDED (uses CategorySelector)
   └─ AUTO: Updates when CategorySelector updated

10. frontend/src/components/widgets/ExpensesByCategoryWidget.tsx
    ├─ NO CHANGES NEEDED
    └─ VERIFY: Still works with updated category system

11. frontend/src/components/widgets/RecentTransactionsWidget.tsx
    ├─ NO CHANGES NEEDED
    └─ VERIFY: Category display still works

12. frontend/src/lib/exportTransactions.ts
    ├─ NO CHANGES NEEDED
    └─ VERIFY: Category names export correctly

13. frontend/src/hooks/useTransactions.ts
    ├─ NO CHANGES NEEDED (uses categoryId filtering)
    └─ VERIFY: Still works with merged categories
```

---

## Implementation Checklist

### Phase 1: Types & API (1-2 days)
- [ ] Add new types to types/index.ts
- [ ] Update categoryTemplateAPI response types
- [ ] Create new form types for overrides/custom
- [ ] Verify TypeScript compilation
- [ ] Write unit tests for type compatibility

### Phase 2: Hooks (1 day)
- [ ] Create useTemplateCategories hook
- [ ] Create useUserOverrides hook
- [ ] Create useMergedCategories hook
- [ ] Add feature flag detection
- [ ] Test caching with React Query DevTools

### Phase 3: CategorySelector (1-2 days)
- [ ] Replace direct API with useMergedCategories
- [ ] Add source indicator UI
- [ ] Test with all transaction types
- [ ] Verify subcategories work
- [ ] Test emoji/color selection

### Phase 4: Settings Page (2-3 days)
- [ ] Design three-tab layout
- [ ] Implement Template tab (read-only + override button)
- [ ] Implement Override tab (edit/delete/revert)
- [ ] Implement Custom tab (full CRUD)
- [ ] Add source indicators
- [ ] Test all operations

### Phase 5: Pages (1-2 days)
- [ ] Create loadMergedCategories helper
- [ ] Update TransactionsPage
- [ ] Update ImportPage
- [ ] Update FilterComponent types
- [ ] Test all filtering

### Phase 6: Testing (1-2 days)
- [ ] Enable feature flag in dev
- [ ] Test with templates
- [ ] Test with overrides
- [ ] Test with custom categories
- [ ] Test backward compatibility
- [ ] E2E test full flows

---

## Key Points to Remember

### Category Source Types
1. **Template** - Global, shared, read-only (80 default ones)
2. **Override** - User customization of template
3. **Custom** - User-created from scratch

### What Frontend Must Merge
Frontend must combine:
- Templates (from `categoryTemplateAPI.getAllTemplates()`)
- User Overrides (from `categoryTemplateAPI` methods)
- Custom Categories (from `categoryTemplateAPI.getCustomCategories()`)

Result: Single merged view for components

### Breaking Changes
When migrating from legacy to templates:
- `categoryAPI.getAll()` still works but returns legacy data
- New `categoryTemplateAPI` methods must be used
- Frontend must detect which system is active
- Settings page UI must change completely

### Backward Compatibility
- Keep legacy `useCategories()` hook working
- Support both systems simultaneously during transition
- Feature flag controls which API is used
- Fallback logic if templates fail

---

## Common Pitfalls to Avoid

1. **Type Confusion**
   - Don't mix Category (legacy), CategoryTemplate, and CustomCategory
   - Use MergedCategory for UI components

2. **API Confusion**
   - Don't mix categoryAPI and categoryTemplateAPI
   - Use consistent API based on feature flag

3. **Caching Issues**
   - React Query cache keys must differentiate systems
   - Merge operation shouldn't break invalidation

4. **UI Confusion**
   - Show clear indicator of category source
   - Different actions for different sources
   - Don't let users delete templates (they can only delete custom)

5. **Performance**
   - Don't load all three sets separately
   - Merge in hook, not in components
   - Use proper caching strategy

---

## Testing Template Locally

```bash
# Set feature flag
export USE_CATEGORY_TEMPLATES=true

# Run frontend
npm run dev

# Test flows:
1. Create transaction - should show template categories
2. Settings - should show templates, overrides, custom
3. Create override - click override button on template
4. Create custom - add custom category
5. Filter - should work with all types
6. Delete - should only work on custom
```

---

## Questions to Answer Before Coding

1. How does frontend detect USE_CATEGORY_TEMPLATES flag?
   - Backend API response? Environment variable? Both?

2. How are existing user categories migrated?
   - Mapped to templates? Converted to custom?

3. What if template endpoint fails?
   - Fallback to legacy? Error message?

4. Should overrides show original template?
   - Reference or just override values?

5. How deep is category hierarchy?
   - Just parent/child or multi-level?

---

## Files Ready to Copy/Review

- `/tmp/frontend_analysis.md` - Full detailed analysis
- `/tmp/quick_reference.md` - This file

Generated from analysis of:
- 13 frontend files
- 2 type definition files
- 6 API route files
- 1 feature flag specification

Analysis Date: 2024-11-13
