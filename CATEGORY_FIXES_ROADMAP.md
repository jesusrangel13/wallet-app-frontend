# Category System Fixes - Implementation Roadmap

## Quick Reference

### CRITICAL BLOCKERS (Must Fix First)
1. Settings page form has no submit handler
2. No mutations for create/update/delete operations
3. Type field missing from custom categories (frontend & backend)
4. No React Query cache invalidation

### STATUS OVERVIEW
```
Backend:    90% Complete ✓ (just needs type field migration)
Frontend:   40% Complete ✗ (UI exists, no backend integration)
Database:   85% Complete ✓ (needs one new field)
```

---

## DETAILED FIX LOCATIONS

### Frontend - File: `/frontend/src/app/dashboard/settings/categories/page.tsx`

#### Problem 1: No Submit Handler on Modal Form
**Lines 375-376**: Button exists but has no onClick
```typescript
// CURRENT (BROKEN):
<Button className="bg-blue-600 hover:bg-blue-700">
  {editingCustom ? 'Update' : 'Create'}
</Button>

// NEEDED:
<Button 
  className="bg-blue-600 hover:bg-blue-700"
  onClick={handleSaveCategory}  // ADD THIS
>
  {editingCustom ? 'Update' : 'Create'}
</Button>
```

#### Problem 2: No Type Field in Form
**Lines 40-45**: formData state missing type
```typescript
// CURRENT:
const [formData, setFormData] = useState({
  name: '',
  icon: '📦',
  color: '#FF6B6B',
})

// NEEDED:
const [formData, setFormData] = useState({
  name: '',
  icon: '📦',
  color: '#FF6B6B',
  type: selectedType,  // ADD THIS
})
```

**Lines 369-381**: Add type selector UI
```typescript
// ADD AFTER COLOR SECTION:
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Type
  </label>
  <div className="flex gap-2">
    {(['EXPENSE', 'INCOME'] as const).map((type) => (
      <button
        key={type}
        type="button"
        onClick={() => setFormData({...formData, type})}
        className={`flex-1 px-3 py-2 rounded border-2 ${
          formData.type === type
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200'
        }`}
      >
        {type}
      </button>
    ))}
  </div>
</div>
```

#### Problem 3: Missing useMutation Hooks
**Add at top of component (around line 28)**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

// Inside component:
const queryClient = useQueryClient()

const createCustomMutation = useMutation({
  mutationFn: (data) => categoryTemplateAPI.createCustom(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['userCategories'] })
    queryClient.invalidateQueries({ queryKey: ['customCategories'] })
    setIsModalOpen(false)
    toast.success('Category created successfully')
  },
  onError: (error: any) => {
    toast.error(error.response?.data?.message || 'Failed to create category')
  },
})

const updateCustomMutation = useMutation({
  mutationFn: (data) => categoryTemplateAPI.updateOverride(data.id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['userCategories'] })
    queryClient.invalidateQueries({ queryKey: ['customCategories'] })
    setIsModalOpen(false)
    toast.success('Category updated successfully')
  },
  onError: (error: any) => {
    toast.error(error.response?.data?.message || 'Failed to update category')
  },
})

const deleteCustomMutation = useMutation({
  mutationFn: (customId) => categoryTemplateAPI.deleteOverride(customId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['userCategories'] })
    queryClient.invalidateQueries({ queryKey: ['customCategories'] })
    toast.success('Category deleted successfully')
  },
  onError: (error: any) => {
    toast.error(error.response?.data?.message || 'Failed to delete category')
  },
})
```

#### Problem 4: handleDeleteCustom is Fake
**Lines 99-107**: Replace with real mutation
```typescript
const handleDeleteCustom = async (customId?: string) => {
  if (!customId) return
  deleteCustomMutation.mutate(customId)
}
```

#### Problem 5: handleDeleteOverride Missing Error Handling
**Lines 88-97**: Add try-catch
```typescript
const handleDeleteOverride = async (overrideId?: string) => {
  if (!overrideId) return
  deleteCustomMutation.mutate(overrideId)
}
```

#### Problem 6: Add handleSaveCategory Function
**Add around line 86**:
```typescript
const handleSaveCategory = async () => {
  if (!formData.name.trim()) {
    toast.error('Category name is required')
    return
  }

  if (editingCustom) {
    updateCustomMutation.mutate({
      id: editingCustom.id,
      name: formData.name,
      icon: formData.icon,
      color: formData.color,
    })
  } else {
    createCustomMutation.mutate({
      name: formData.name,
      icon: formData.icon,
      color: formData.color,
      type: formData.type,
    })
  }
}
```

---

### Backend - File: `/backend/src/services/userCategory.service.ts`

#### Problem: createCustomCategory Doesn't Store Type
**Lines 163-204**: Add type parameter

**CURRENT**:
```typescript
static async createCustomCategory(
  userId: string,
  data: {
    name: string;
    icon?: string;
    color?: string;
    type?: TransactionType;  // ← Has parameter but not used!
  }
): Promise<any> {
  // ...
  return await prisma.userCategoryOverride.create({
    data: {
      userId,
      name: data.name,
      icon: data.icon || null,
      color: data.color || null,
      isCustom: true,
      isActive: true,
      templateId: null,
      // ← Missing: type field!
    },
  })
}
```

**NEEDED**: Add type to create data, but first need DB migration!

---

### Database - File: `/backend/prisma/schema.prisma`

#### Problem: UserCategoryOverride Has No Type Field
**Lines 174-196**: Add type field

**CURRENT**:
```prisma
model UserCategoryOverride {
  id                String   @id @default(uuid())
  userId            String
  templateId        String?
  name              String
  icon              String?
  color             String?
  isActive          Boolean  @default(true)
  isCustom          Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  // ← Missing type field for custom categories!
}
```

**NEEDED**:
```prisma
model UserCategoryOverride {
  id                String          @id @default(uuid())
  userId            String
  templateId        String?
  name              String
  icon              String?
  color             String?
  type              TransactionType? // ← ADD THIS
  isActive          Boolean         @default(true)
  isCustom          Boolean         @default(false)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}
```

**Migration Steps**:
1. Update schema.prisma (add `type: TransactionType?`)
2. Run: `npx prisma migrate dev --name add_type_to_user_category_override`
3. Update backend code to use type field

---

### Backend - File: `/backend/src/services/userCategory.service.ts`

#### After DB Migration: Update createCustomCategory
**Lines 186-195**:
```typescript
return await prisma.userCategoryOverride.create({
  data: {
    userId,
    name: data.name,
    icon: data.icon || null,
    color: data.color || null,
    type: data.type || 'EXPENSE',  // ← ADD THIS
    isCustom: true,
    isActive: true,
    templateId: null,
  },
})
```

#### After DB Migration: Update getUserCategory
**Lines 101-115** (custom category case):
```typescript
return {
  id: override.id,
  templateId: null,
  name: override.name,
  icon: override.icon,
  color: override.color,
  type: override.type || 'EXPENSE' as TransactionType,  // ← USE ACTUAL TYPE
  orderIndex: 0,
  isActive: override.isActive,
  isCustom: true,
  isTemplate: false,
}
```

---

## Implementation Checklist

### Phase 1: Frontend Form Integration (2-3 hours)

- [ ] Add useQueryClient import
- [ ] Add useMutation imports
- [ ] Add type field to formData state
- [ ] Add type field UI in modal form
- [ ] Implement createCustomMutation hook
- [ ] Implement updateCustomMutation hook
- [ ] Implement deleteCustomMutation hook
- [ ] Add handleSaveCategory function
- [ ] Connect modal form submit button to handler
- [ ] Update handleDeleteCustom to use mutation
- [ ] Update handleDeleteOverride to use mutation
- [ ] Test create/update/delete with existing endpoints
- [ ] Verify React Query invalidation works

### Phase 2: Database Migration (30 minutes - 1 hour)

- [ ] Update UserCategoryOverride model in schema.prisma
- [ ] Run migration: `npx prisma migrate dev`
- [ ] Verify migration created successfully
- [ ] Check database for new type column

### Phase 3: Backend Updates (1-2 hours)

- [ ] Update createCustomCategory to store type
- [ ] Update getUserCategory to return actual type
- [ ] Update any other methods that reference type
- [ ] Test backend endpoints with type field
- [ ] Verify database stores type correctly

### Phase 4: Testing & Cleanup (1 hour)

- [ ] Test create custom category with different types
- [ ] Test update custom category
- [ ] Test delete custom category
- [ ] Test that type filters work correctly
- [ ] Verify UI updates immediately after mutations
- [ ] Check error handling for all operations
- [ ] Remove console.logs if needed
- [ ] Add comments/JSDoc to new code

---

## Expected Outcomes

After implementing these fixes:

✓ Users can create custom categories
✓ Users can edit custom categories
✓ Users can delete custom categories
✓ Custom categories have correct type (EXPENSE/INCOME)
✓ UI updates immediately after changes (React Query invalidation)
✓ Proper error handling and user feedback
✓ All CRUD operations work end-to-end

---

## Testing Commands

```bash
# After implementing changes, test endpoints:

# Create custom category
curl -X POST http://localhost:3001/api/categories/custom \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Category",
    "icon": "🎯",
    "color": "#FF6B6B",
    "type": "EXPENSE"
  }'

# Get user categories (should include the new one)
curl -X GET http://localhost:3001/api/categories/user/categories \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update custom category
curl -X PUT http://localhost:3001/api/categories/overrides/CATEGORY_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "icon": "🎨",
    "color": "#4ECDC4"
  }'

# Delete custom category
curl -X DELETE http://localhost:3001/api/categories/overrides/CATEGORY_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Files Modified Summary

| File | Changes | Estimated Time |
|------|---------|-----------------|
| `/frontend/.../categories/page.tsx` | Add mutations, handlers, type field, UI | 2-3 hours |
| `/backend/prisma/schema.prisma` | Add type field to UserCategoryOverride | 10 min |
| `/backend/.../userCategory.service.ts` | Use type field in create/get methods | 1 hour |
| `/frontend/src/hooks/useCategories.ts` | Optional: Clean up unused code | 30 min |
| `/frontend/src/types/index.ts` | Optional: Align with backend types | 30 min |

**Total estimated time: 4-6 hours**

