# Month Selector Feature - Implementation Plan

## Overview
Add a month/year selector to the dashboard header that allows users to view historical data for different months across most widgets (excluding account carousel and recent transactions which always show current data).

## Architecture

### State Management
- **Context API**: `SelectedMonthContext` to share selected month/year across all widgets
- **Default Behavior**: Always defaults to current month
- **Scope**: Dashboard page only

### Component Structure
```
Dashboard Page
├── MonthSelector (Header Component)
│   └── Controls: Previous Month, Month/Year Picker, Next Month, Today Button
└── SelectedMonthProvider (Context)
    ├── Widgets (affected by month selector)
    │   ├── TotalBalanceWidget
    │   ├── MonthlyIncomeWidget
    │   ├── MonthlyExpensesWidget
    │   ├── PersonalExpensesWidget
    │   ├── SharedExpensesWidget
    │   ├── SavingsWidget
    │   ├── CashFlowWidget
    │   ├── ExpensesByCategoryWidget
    │   ├── ExpensesByParentCategoryWidget
    │   ├── ExpenseDetailsPieWidget
    │   ├── BalanceTrendWidget
    │   └── GroupBalancesWidget
    └── Widgets (NOT affected - always current)
        ├── AccountBalancesWidget
        ├── FixedAccountBalancesWidget
        └── RecentTransactionsWidget
```

---

## Phase 1: Backend API Modifications

### Files to Modify
1. `/backend/src/controllers/dashboard.controller.ts`
2. `/backend/src/services/dashboard.service.ts`

### Endpoints to Update

#### 1. `GET /api/dashboard/summary`
**Query Parameters (all optional):**
- `month`: number (0-11)
- `year`: number (e.g., 2024)

**Changes:**
- Extract month/year from query params
- Default to current month/year if not provided
- Pass to service layer

#### 2. `GET /api/dashboard/expenses-by-category`
**Query Parameters (all optional):**
- `month`: number (0-11)
- `year`: number

**Current Behavior:** Hardcoded to current month
**New Behavior:** Use provided month/year or default to current

#### 3. `GET /api/dashboard/expenses-by-parent-category`
**Query Parameters (all optional):**
- `month`: number (0-11)
- `year`: number

**Current Behavior:** Hardcoded to current month
**New Behavior:** Use provided month/year or default to current

#### 4. `GET /api/dashboard/personal-expenses`
**Query Parameters (all optional):**
- `month`: number (0-11)
- `year`: number

**Current Behavior:** Hardcoded to current month
**New Behavior:** Use provided month/year or default to current

#### 5. `GET /api/dashboard/shared-expenses`
**Query Parameters (all optional):**
- `month`: number (0-11)
- `year`: number

**Current Behavior:** Hardcoded to current month
**New Behavior:** Use provided month/year or default to current

#### 6. `GET /api/dashboard/savings`
**Query Parameters (all optional):**
- `month`: number (0-11)
- `year`: number

**Current Behavior:** Hardcoded to current month
**New Behavior:** Use provided month/year or default to current

#### 7. `GET /api/dashboard/group-balances`
**Query Parameters (all optional):**
- `month`: number (0-11)
- `year`: number

**Current Behavior:** Hardcoded to current month
**New Behavior:** Use provided month/year or default to current

### Endpoints NOT Modified (Already Have Date Filtering or Don't Need It)
- `GET /api/dashboard/cashflow` - Already has `months` parameter
- `GET /api/dashboard/balance-history` - Already has `days` parameter
- `GET /api/dashboard/account-balances` - Always current (point in time)

### Implementation Pattern

**Controller Pattern:**
```typescript
export const getExpensesByCategory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Extract month/year from query params, default to current
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth();
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();

    const expenses = await dashboardService.getExpensesByCategory(userId, month, year);
    res.json({ success: true, data: expenses });
  } catch (error) {
    // error handling
  }
};
```

**Service Pattern:**
```typescript
export const getExpensesByCategory = async (
  userId: string,
  month: number,
  year: number
): Promise<CategoryExpense[]> => {
  // Use provided month/year instead of hardcoded current date
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Rest of implementation using firstDayOfMonth and lastDayOfMonth
  // ...
};
```

---

## Phase 2: Frontend Implementation

### Step 1: Create Month Context

**File:** `/frontend/src/contexts/SelectedMonthContext.tsx`

**Exports:**
- `SelectedMonthProvider` component
- `useSelectedMonth` hook

**State:**
```typescript
interface SelectedMonthState {
  month: number;      // 0-11
  year: number;       // e.g., 2024
  isCurrentMonth: boolean;
  setMonth: (month: number) => void;
  setYear: (year: number) => void;
  setMonthYear: (month: number, year: number) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  resetToCurrentMonth: () => void;
}
```

**Features:**
- Defaults to current month/year on mount
- Provides helper functions for navigation
- Tracks if currently viewing current month

---

### Step 2: Create MonthSelector Component

**File:** `/frontend/src/components/MonthSelector.tsx`

**UI Layout:**
```
┌─────────────────────────────────────────────────┐
│  [◀ Prev]  [Enero 2024 ▼]  [Next ▶]  [📅 Hoy]  │
└─────────────────────────────────────────────────┘
```

**Features:**
- Previous/Next month buttons
- Month/Year dropdown picker
- "Hoy" button (only visible when not on current month)
- Responsive design
- Uses Tailwind styling consistent with dashboard

**Implementation:**
- Uses `useSelectedMonth` hook
- Month names in Spanish
- Disabled state for future months (can't select months that haven't happened yet)

---

### Step 3: Update Dashboard Page

**File:** `/frontend/src/app/dashboard/page.tsx`

**Changes:**
1. Import `SelectedMonthProvider`
2. Import `MonthSelector`
3. Wrap entire dashboard content in `SelectedMonthProvider`
4. Add `MonthSelector` to header area (before or after "Mi Dashboard" title)

**Layout:**
```tsx
<SelectedMonthProvider>
  <div>
    {/* Header with title and month selector */}
    <div className="flex items-center justify-between mb-6">
      <h1>Mi Dashboard</h1>
      <MonthSelector />
    </div>

    {/* Fixed Account Balances Widget (NOT affected by month) */}
    <FixedAccountBalancesWidget />

    {/* Balances Widget (NOT affected by month) */}
    <BalancesWidget />

    {/* Grid widgets (affected by month) */}
    <DashboardGrid />
  </div>
</SelectedMonthProvider>
```

---

### Step 4: Update Widget Components

**12 Widgets to Update:**

1. **TotalBalanceWidget** - `/frontend/src/components/widgets/TotalBalanceWidget.tsx`
2. **MonthlyIncomeWidget** - `/frontend/src/components/widgets/MonthlyIncomeWidget.tsx`
3. **MonthlyExpensesWidget** - `/frontend/src/components/widgets/MonthlyExpensesWidget.tsx`
4. **PersonalExpensesWidget** - `/frontend/src/components/widgets/PersonalExpensesWidget.tsx`
5. **SharedExpensesWidget** - `/frontend/src/components/widgets/SharedExpensesWidget.tsx`
6. **SavingsWidget** - `/frontend/src/components/widgets/SavingsWidget.tsx`
7. **CashFlowWidget** - `/frontend/src/components/widgets/CashFlowWidget.tsx`
8. **ExpensesByCategoryWidget** - `/frontend/src/components/widgets/ExpensesByCategoryWidget.tsx`
9. **ExpensesByParentCategoryWidget** - `/frontend/src/components/widgets/ExpensesByParentCategoryWidget.tsx`
10. **ExpenseDetailsPieWidget** - `/frontend/src/components/widgets/ExpenseDetailsPieWidget.tsx`
11. **BalanceTrendWidget** - `/frontend/src/components/widgets/BalanceTrendWidget.tsx`
12. **GroupBalancesWidget** - `/frontend/src/components/widgets/GroupBalancesWidget.tsx`

**Update Pattern for Each Widget:**

```typescript
import { useSelectedMonth } from '@/contexts/SelectedMonthContext';

export const SomeWidget = () => {
  const { month, year } = useSelectedMonth();
  const [data, setData] = useState(...);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Add month and year as query params
        const res = await someAPI.getData({ month, year });
        setData(res.data.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [month, year]); // Re-fetch when month/year changes

  // Rest of component...
};
```

**API Client Updates:**

Update API client functions to accept and pass month/year parameters:

```typescript
// Example in /frontend/src/lib/api.ts
export const dashboardAPI = {
  getExpensesByCategory: (params?: { month?: number; year?: number }) =>
    api.get('/dashboard/expenses-by-category', { params }),

  // Update other endpoints similarly...
};
```

---

### Step 5: Visual Indicators

**Add visual feedback showing which month is being viewed:**

1. **MonthSelector displays current selection**
2. **Widgets show subtitle** when viewing historical data:
   ```tsx
   <CardHeader className="pb-3">
     <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
       <Icon className="h-4 w-4" />
       Widget Title
     </CardTitle>
     {!isCurrentMonth && (
       <p className="text-xs text-gray-500">
         {getMonthName(month)} {year}
       </p>
     )}
   </CardHeader>
   ```

3. **Optional: Color indicator** for historical data (subtle blue tint on card border)

---

## Implementation Order

### Phase 1: Backend (Day 1)
1. ✅ Update `dashboard.controller.ts` - Add month/year params to 7 endpoints
2. ✅ Update `dashboard.service.ts` - Modify date logic in 7 service functions
3. ✅ Test endpoints with Postman/curl
4. ✅ Rebuild backend and verify no TypeScript errors

### Phase 2: Frontend Core (Day 1-2)
5. ✅ Create `SelectedMonthContext.tsx`
6. ✅ Create `MonthSelector.tsx` component
7. ✅ Update dashboard page to include provider and selector
8. ✅ Test month navigation works

### Phase 3: Widget Updates (Day 2)
9. ✅ Update API client functions in `/lib/api.ts`
10. ✅ Update all 12 widgets to use context and pass params
11. ✅ Add visual indicators for historical data viewing
12. ✅ Test each widget with different months

### Phase 4: Testing & Polish (Day 3)
13. ✅ End-to-end testing of month navigation
14. ✅ Verify widgets excluded from month filtering still work
15. ✅ Check responsive design on mobile
16. ✅ Performance testing (widget load times)
17. ✅ Edge case testing (year boundaries, future months, etc.)

---

## File Estimates

### New Files (2)
- `/frontend/src/contexts/SelectedMonthContext.tsx` (~100 lines)
- `/frontend/src/components/MonthSelector.tsx` (~150 lines)

### Modified Files (16)
**Backend (2 files):**
- `/backend/src/controllers/dashboard.controller.ts` (~100 lines modified)
- `/backend/src/services/dashboard.service.ts` (~150 lines modified)

**Frontend (14 files):**
- `/frontend/src/app/dashboard/page.tsx` (~20 lines modified)
- `/frontend/src/lib/api.ts` (~50 lines modified)
- 12 widget files (~15-30 lines each modified)

### Total Estimated Changes
- **New code**: ~250 lines
- **Modified code**: ~500 lines
- **Total**: ~750 lines across 18 files

---

## Testing Checklist

### Backend Testing
- [ ] Month param defaults to current when not provided
- [ ] Year param defaults to current when not provided
- [ ] Correct data returned for January (month boundary)
- [ ] Correct data returned for December (month boundary)
- [ ] Previous years work correctly
- [ ] Invalid month/year values handled gracefully

### Frontend Testing
- [ ] Month selector defaults to current month
- [ ] Previous month button works
- [ ] Next month button works
- [ ] Month/year dropdown picker works
- [ ] "Hoy" button resets to current month
- [ ] Can't select future months
- [ ] All 12 widgets update when month changes
- [ ] Account balances widget NOT affected by month
- [ ] Recent transactions widget NOT affected by month
- [ ] Loading states show during month changes
- [ ] Visual indicators show correct month
- [ ] Responsive design works on mobile
- [ ] Performance is acceptable when switching months

---

## Success Criteria

1. ✅ User can select any past month/year from dashboard header
2. ✅ All expense/income/savings widgets reflect selected month data
3. ✅ Account balances and recent transactions always show current data
4. ✅ Default behavior is always current month
5. ✅ Clear visual indication of which month is being viewed
6. ✅ Smooth navigation between months
7. ✅ No breaking changes to existing functionality
8. ✅ TypeScript compilation passes with no errors
9. ✅ All existing tests still pass
10. ✅ Performance is acceptable (< 1s to switch months)

---

## Rollback Plan

If issues arise:
1. Backend changes are backward compatible (params are optional)
2. Can remove MonthSelector component and context
3. Widgets will continue working with default (current month) behavior
4. No database migrations required - purely application logic changes

---

## Future Enhancements (Out of Scope)

- Date range selector (instead of just month)
- Compare two months side-by-side
- Month-over-month change indicators
- Year-to-date views
- Custom date ranges
- Export historical data for selected month
