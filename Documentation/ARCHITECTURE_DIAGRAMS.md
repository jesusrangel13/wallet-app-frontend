# Architecture Diagrams: Category Templates System

## Current State (Legacy System - USE_CATEGORY_TEMPLATES=false)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Components                    Hooks                 API          │
│  ─────────────────────────────────────────────────────────────   │
│                                                                   │
│  CategorySelector           useCategories()    categoryAPI        │
│  TransactionFormModal           │                  │             │
│  TransactionFilters             │              getAll(type)      │
│  SettingsCategories             │                  │             │
│  TransactionsPage               └──────────────────┘             │
│                                                                   │
│                         HTTP Request                             │
│                               ▼                                  │
│                    GET /api/categories                           │
│                                                                   │
└──────────────────────────────────┬──────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
┌────────────────────────────────┐  ┌───────────────────────────┐
│      BACKEND (Legacy)          │  │    DATABASE              │
├────────────────────────────────┤  ├───────────────────────────┤
│                                │  │                           │
│  categoryAPI.getCategories()   │  │  Category Table          │
│         ▼                      │  │  ├─ id                   │
│  Get user's own categories     │  │  ├─ userId              │
│  from Category table           │  │  ├─ name                │
│  (per-user copies)             │  │  ├─ icon                │
│                                │  │  ├─ color               │
│                                │  │  ├─ type                │
│                                │  │  └─ parentId            │
│                                │  │                           │
│  ❌ PROBLEM:                   │  │  ❌ Issues:              │
│  • Slow registration (80 cats)  │  │  • 800k+ records        │
│  • Duplicated data             │  │  • High storage         │
│  • Can't share categories      │  │  • Difficult to update  │
│                                │  │                           │
└────────────────────────────────┘  └───────────────────────────┘
```

---

## Future State (Template System - USE_CATEGORY_TEMPLATES=true)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Components                    Hooks                      API              │
│  ────────────────────────────────────────────────────────────────────   │
│                                                                            │
│  CategorySelector         ┌─ useMergedCategories()    categoryTemplateAPI │
│  TransactionFormModal     │      │                         │             │
│  TransactionFilters       │      ├─ useTemplateCategories() ├─ getAllTemplates()
│  SettingsCategories       │      │  ├─ Templates            ├─ getTemplatesHierarchy()
│  TransactionsPage         │      │                          │             │
│                           │      ├─ useUserOverrides()      ├─ createOverride()
│                           │      │  ├─ Overrides            ├─ updateOverride()
│                           │      │  └─ Merges with custom   ├─ deleteOverride()
│                           │      │                          │             │
│                           └─────┬┴─ useCustomCategories()   ├─ createCustom()
│                                  │  ├─ Custom (full CRUD)   └─ getCustomCategories()
│                                  │  │
│                                  └──┴─ Merged View          (+ legacy fallback)
│                                       (Templates +           categoryAPI
│                                        Overrides +           .getAll()
│                                        Custom)               
│                                                                            │
│                       HTTP Requests (Multiple)                           │
│         ┌─────────────────┬──────────────────────┬─────────────────┐    │
│         │                 │                      │                 │    │
│         ▼                 ▼                      ▼                 ▼    │
│  GET /categories/  GET /categories/  POST /categories/  GET /categories/ │
│  templates/all     overrides/all     custom              custom/all     │
│                                                                            │
└─────────────┬────────────────────────────┬────────────────────────┬──────┘
              │                            │                        │
              └────────────────┬───────────┴──────────────┬─────────┘
                               │                         │
                    ┌──────────▼──────────┐   ┌──────────▼──────────┐
                    │   BACKEND/SERVICE   │   │  LEGACY FALLBACK    │
                    ├─────────────────────┤   ├────────────────────┤
                    │                     │   │                    │
                    │ CategoryTemplate    │   │ categoryAPI        │
                    │ Service             │   │ (for backward      │
                    │                     │   │  compatibility)    │
                    │ UserCategoryService │   │                    │
                    │                     │   │                    │
                    └────────────┬────────┘   └──────────┬─────────┘
                                 │                       │
                    ┌────────────┴───────────┬───────────┘
                    │                       │
                    ▼                       ▼
          ┌──────────────────────┐  ┌────────────────────┐
          │   NEW TABLES         │  │  LEGACY TABLES     │
          ├──────────────────────┤  ├────────────────────┤
          │                      │  │                    │
          │ CategoryTemplate     │  │ Category (legacy)  │
          │ ├─ id               │  │ ├─ id              │
          │ ├─ name             │  │ ├─ userId          │
          │ ├─ icon             │  │ ├─ name            │
          │ ├─ color            │  │ ├─ icon            │
          │ ├─ type             │  │ ├─ color           │
          │ └─ description      │  │ └─ type            │
          │                      │  │                    │
          │ UserCategoryOverride │  │ (Deprecated)       │
          │ ├─ id               │  │                    │
          │ ├─ userId           │  │ (Can be deleted)   │
          │ ├─ templateId       │  │                    │
          │ ├─ name (override)  │  │                    │
          │ └─ ...              │  │                    │
          │                      │  │                    │
          │ CustomCategory       │  │                    │
          │ ├─ id               │  │                    │
          │ ├─ userId           │  │                    │
          │ ├─ name             │  │                    │
          │ └─ ...              │  │                    │
          │                      │  │                    │
          │ ✅ BENEFITS:        │  │ ❌ DEPRECATED:     │
          │ • Fast registration  │  │ • High storage     │
          │ • Shared data        │  │ • Duplicated data  │
          │ • Easier updates     │  │ • Slow operations  │
          │ • ~10MB for 10k users│  │ • 240MB for 10k    │
          │                      │  │                    │
          └──────────────────────┘  └────────────────────┘
```

---

## Component Dependency Flow

### Legacy System
```
TransactionPage
    ├── loadCategories()
    │   └── categoryAPI.getAll()
    │
    ├── TransactionFilters
    │   └── categories prop (Category[])
    │
    └── CategorySelector
        └── Direct: categoryAPI.getAll()
```

### Template System (After Update)
```
TransactionPage
    ├── loadMergedCategories()
    │   └── useMergedCategories()
    │
    ├── TransactionFilters
    │   └── categories prop (MergedCategory[])
    │
    └── CategorySelector
        └── useMergedCategories()
            ├── useTemplateCategories()
            │   └── categoryTemplateAPI.getAllTemplates()
            ├── useUserOverrides()
            │   └── categoryTemplateAPI.* (override methods)
            └── useCustomCategories()
                └── categoryTemplateAPI.getCustomCategories()
```

---

## Data Merging Process

```
┌─────────────────────────────────────────────────────────────┐
│                    useMergedCategories()                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Step 1: Fetch Templates                                     │
│  ┌──────────────────────┐                                   │
│  │ Templates[] = [      │                                   │
│  │  {id: 'tpl-1',       │                                   │
│  │   name: 'Groceries'} │                                   │
│  │  ...80 templates     │                                   │
│  │ ]                    │                                   │
│  └──────────────────────┘                                   │
│           ▼                                                  │
│                                                               │
│  Step 2: Fetch User Overrides                               │
│  ┌──────────────────────┐                                   │
│  │ Overrides[] = [      │                                   │
│  │  {id: 'ovr-1',       │                                   │
│  │   templateId: 'tpl-1'│  ◄─ Links back to template      │
│  │   name: 'My Foods'}  │                                   │
│  │ ]                    │                                   │
│  └──────────────────────┘                                   │
│           ▼                                                  │
│                                                               │
│  Step 3: Fetch Custom Categories                            │
│  ┌──────────────────────┐                                   │
│  │ Custom[] = [         │                                   │
│  │  {id: 'cust-1',      │                                   │
│  │   name: 'My Special' │                                   │
│  │   type: 'EXPENSE'}   │                                   │
│  │ ]                    │                                   │
│  └──────────────────────┘                                   │
│           ▼                                                  │
│                                                               │
│  Step 4: Merge & Deduplicate                                │
│  ┌──────────────────────────────────┐                      │
│  │ Merged = [                       │                      │
│  │  {                               │                      │
│  │   id: 'tpl-1',                   │                      │
│  │   name: 'My Foods',(override) OR │  ◄─ From override   │
│  │       'Groceries'(template),     │                      │
│  │   source: 'override'|'template'  │                      │
│  │  },                              │                      │
│  │  {                               │                      │
│  │   id: 'cust-1',                  │                      │
│  │   name: 'My Special',            │                      │
│  │   source: 'custom'               │                      │
│  │  }                               │                      │
│  │ ]                                │                      │
│  └──────────────────────────────────┘                      │
│           ▼                                                  │
│                                                               │
│  Return: MergedCategory[]                                    │
│  (What components see & use)                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## CategorySelector: Before & After

### BEFORE (Direct API Call)
```typescript
const loadCategories = async () => {
  try {
    const response = await categoryAPI.getAll(type)  // Direct call
    setCategories(response.data.data)
  } catch (error) {
    console.error('Failed to load categories')
  }
}
```
**Issues:**
- Direct HTTP request
- No caching
- Single-purpose
- Can't support template system

---

### AFTER (Using Hook with Merge)
```typescript
const { data: mergedCategories, isLoading, error } = useMergedCategories(type)

useEffect(() => {
  if (mergedCategories) {
    // Add source indicator to UI
    const categoriesWithSource = mergedCategories.map(cat => ({
      ...cat,
      sourceLabel: cat.source === 'template' ? '[Template]' : 
                   cat.source === 'override' ? '[Custom]' : 
                   '[Custom Category]'
    }))
    setCategories(categoriesWithSource)
  }
}, [mergedCategories])
```
**Benefits:**
- Automatic caching
- Supports both systems
- Hook handles merging logic
- Clean separation of concerns
- Type-safe

---

## Settings Page Redesign

### BEFORE (Single List)
```
┌─────────────────────────────────────────┐
│  CATEGORY SETTINGS                      │
├─────────────────────────────────────────┤
│                                         │
│  All Categories (User Created)          │
│  ─────────────────────────────────────  │
│  └─ Groceries      [Edit] [Delete]     │
│  └─ Transport      [Edit] [Delete]     │
│  └─ Entertainment  [Edit] [Delete]     │
│  └─ My Custom Cat  [Edit] [Delete]     │
│                                         │
│  [+ New Category]                       │
│                                         │
└─────────────────────────────────────────┘

Problem: Can't handle templates!
```

---

### AFTER (Three Categories)
```
┌───────────────────────────────────────────────────────────┐
│  CATEGORY SETTINGS                                        │
├───────────────────────────────────────────────────────────┤
│  [Templates]  [Overrides]  [Custom]                       │ ◄─ Tabs
├───────────────────────────────────────────────────────────┤
│                                                            │
│  TEMPLATES (Global - Read Only)                           │
│  ────────────────────────────────                         │
│  These are shared categories. You can customize them.     │
│                                                            │
│  ├─ 🛒 Groceries                    [Create Override]    │
│  ├─ 🚗 Transport                    [Create Override]    │
│  ├─ 🎬 Entertainment                [Create Override]    │
│  └─ ... (80 total templates)                             │
│                                                            │
│  OVERRIDES (Your Customizations)                          │
│  ────────────────────────────────────                     │
│  ├─ 📍 My Groceries [Based on 🛒]  [Edit] [Revert]      │
│  ├─ 🏍️ My Transport  [Based on 🚗]  [Edit] [Revert]      │
│                                                            │
│  CUSTOM CATEGORIES (Your Own)                             │
│  ────────────────────────────────────                     │
│  ├─ 🎪 My Special Stuff             [Edit] [Delete]      │
│  ├─ 🌟 Personal                     [Edit] [Delete]      │
│                                                            │
│  [+ New Custom Category]                                  │
│                                                            │
└───────────────────────────────────────────────────────────┘

Benefits:
- Clear separation
- Different actions per type
- Users understand system
- Can't accidentally delete templates
```

---

## Type System Evolution

### BEFORE
```typescript
// types/index.ts
export interface Category {
  id: string
  userId: string        // ← Always present (legacy assumption)
  name: string
  icon?: string
  color?: string
  type: TransactionType
  parentId?: string
  isDefault: boolean
  subcategories?: Category[]
}

// Problem: Templates don't have userId!
```

---

### AFTER
```typescript
// types/index.ts

// Global template (no userId)
export interface CategoryTemplate {
  id: string
  name: string
  icon?: string
  color?: string
  type: TransactionType
  description?: string
  parentId?: string
  isDefault: boolean
  subcategories?: CategoryTemplate[]
}

// User's override of template
export interface CategoryOverride {
  id: string
  userId: string        // ← User who created override
  templateId: string    // ← Links to template
  name?: string         // ← Optional override values
  icon?: string
  color?: string
  createdAt: string
  updatedAt: string
}

// User's custom category (full control)
export interface CustomCategory {
  id: string
  userId: string        // ← Always present
  name: string
  icon?: string
  color?: string
  type: TransactionType
  createdAt: string
  updatedAt: string
}

// What components see (merged view)
export interface MergedCategory {
  id: string
  name: string
  icon?: string
  color?: string
  type: TransactionType
  source: 'template' | 'override' | 'custom'  // ← Indicates type
  templateId?: string   // ← If override
  userId?: string       // ← If custom
  subcategories?: MergedCategory[]
}

// Benefits: Type-safe, clear roles, no confusion
```

---

## Error Handling & Fallback

```
Feature Flag Detection
         │
         ├─ If USE_CATEGORY_TEMPLATES=true
         │     │
         │     ├─ Try: categoryTemplateAPI.getAllTemplates()
         │     │  │
         │     │  └─ Success ✅ → Use template system
         │     │  
         │     └─ If fails → Try fallback
         │          │
         │          └─ categoryAPI.getAll() (legacy)
         │              │
         │              └─ If works → Use legacy
         │              └─ If fails → Show error
         │
         └─ If USE_CATEGORY_TEMPLATES=false
               │
               └─ Use: categoryAPI.getAll() (legacy)
```

---

## Implementation Timeline

```
Week 1: Foundation
├─ Day 1-2: Types & API (CRITICAL)
├─ Day 3: Hooks (CRITICAL)
└─ Day 4-5: CategorySelector (CRITICAL)

Week 2: Features
├─ Day 1-2: Settings Page (HIGH)
├─ Day 3: Page Updates (HIGH)
└─ Day 4-5: Polish

Week 3: Testing
├─ Day 1-2: Integration Testing
├─ Day 3: E2E Testing
└─ Day 4-5: Bug Fixes & Docs
```

---

## Summary

**Key Changes:**
1. Three types of categories (Template, Override, Custom)
2. Frontend must merge them into single view
3. Settings page needs complete redesign
4. Hooks centralize merge logic
5. Components receive merged data

**Why it matters:**
1. Instant user registration (no 80 category creates)
2. Shared category definitions (less data duplication)
3. Users can customize without affecting others
4. Better database performance

**Implementation order:**
1. Types (foundation)
2. API/Hooks (data layer)
3. Components (UI layer)
4. Pages (integration)
5. Testing (validation)
