# Customizable Dashboard Widgets - Implementation Progress

## ✅ Completed (Phase 1-4)

### Phase 1: Backend Foundation
- ✅ Added `UserDashboardPreference` model to Prisma schema
- ✅ Added `dashboardPreference` relation to User model
- ✅ Ran Prisma migration and reset database
- ✅ Created `dashboardPreference.service.ts` with all CRUD operations
- ✅ Created `dashboardPreference.controller.ts` with 7 endpoints
- ✅ Created `dashboardPreference.routes.ts` with proper routing
- ✅ Registered routes in `backend/src/server.ts`

**Backend Endpoints Available:**
```
GET    /api/users/dashboard-preferences
PUT    /api/users/dashboard-preferences
POST   /api/users/dashboard-preferences/widgets
DELETE /api/users/dashboard-preferences/widgets/:widgetId
PATCH  /api/users/dashboard-preferences/widgets/:widgetId/settings
PATCH  /api/users/dashboard-preferences/layout
DELETE /api/users/dashboard-preferences/reset
```

### Phase 2: Frontend Dependencies
- ✅ Installed `react-grid-layout` v1.4.4
- ✅ Installed `@types/react-grid-layout`

### Phase 3: Widget Registry & Configuration
- ✅ Created `frontend/src/config/widgets.ts` with:
  - 12 widget definitions (all dashboard widgets)
  - Widget metadata (name, category, dimensions, resizable, draggable)
  - Helper functions: `getAllWidgets()`, `getWidgetsByCategory()`, `getWidgetDefinition()`

### Phase 4: State Management & Types
- ✅ Created `frontend/src/types/dashboard.ts` with TypeScript interfaces
- ✅ Created `frontend/src/store/dashboardStore.ts` (Zustand store):
  - Persistent state via `persist` middleware
  - Full dashboard state management (widgets, layout, edit mode)
  - 15+ action methods for widget/layout manipulation
  - localStorage persistence as fallback

### Phase 5: API Client
- ✅ Added `dashboardPreferenceAPI` to `frontend/src/lib/api.ts`:
  - `getPreferences()` - Fetch user preferences
  - `savePreferences()` - Save widgets and layout
  - `addWidget()` - Add widget to dashboard
  - `removeWidget()` - Remove widget
  - `updateWidgetSettings()` - Update widget-specific settings
  - `updateLayout()` - Update grid layout
  - `resetToDefaults()` - Reset to default dashboard

### Phase 6: Widget Components (Started)
- ✅ Created `frontend/src/components/widgets/TotalBalanceWidget.tsx` (template example)

---

## ⏳ Remaining Work (Phase 5-7)

### Phase 5: Extract Widget Components (IN PROGRESS)

Create 11 remaining widget components. Each following the pattern of `TotalBalanceWidget.tsx`:

**Remaining Widgets to Create:**

1. `MonthlyIncomeWidget.tsx` - Show monthly income
2. `MonthlyExpensesWidget.tsx` - Show monthly expenses
3. `GroupsWidget.tsx` - Show group/account count
4. `QuickActionsWidget.tsx` - Links to main features
5. `BalancesWidget.tsx` - Import existing BalancesWidget component
6. `CashFlowWidget.tsx` - Bar chart (income vs expense)
7. `ExpensesByCategoryWidget.tsx` - Pie chart
8. `BalanceTrendWidget.tsx` - Line chart
9. `GroupBalancesWidget.tsx` - List of people who owe you
10. `AccountBalancesWidget.tsx` - List of accounts
11. `RecentTransactionsWidget.tsx` - Recent transactions list

**Pattern for Widget Components:**
```typescript
'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
// import necessary APIs and components

export const [WidgetName] = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await [API_CALL]
        setData(res.data.data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <SkeletonLoader />

  return (
    <Card>
      {/* Widget content */}
    </Card>
  )
}
```

**Data Sources for Each Widget:**
- Income: `transactionAPI.getStats(month, year)` → `monthlyIncome`
- Expenses: `transactionAPI.getStats(month, year)` → `monthlyExpense`
- Groups: `userAPI.getStats()` → `groups`, `accounts`
- Cash Flow: `dashboardAPI.getCashFlow(6)` → bar chart
- Categories: `dashboardAPI.getExpensesByCategory()` → pie chart
- Balance Trend: `dashboardAPI.getBalanceHistory(30)` → line chart
- Group Balances: `dashboardAPI.getGroupBalances()` → list
- Account Balances: `dashboardAPI.getAccountBalances()` → list
- Recent Transactions: `transactionAPI.getRecent(5)` → list

### Phase 6: Core UI Components

#### 1. `DashboardGrid.tsx` (Grid Layout Wrapper)
```typescript
'use client'
import GridLayout from 'react-grid-layout'
import { useDashboardStore } from '@/store/dashboardStore'
import { WidgetWrapper } from './WidgetWrapper'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

export const DashboardGrid = ({ children }) => {
  const { layout, isEditMode, saveLayout } = useDashboardStore()

  const handleLayoutChange = (newLayout: any) => {
    if (isEditMode) {
      // Debounce before saving
      saveLayout(newLayout)
    }
  }

  return (
    <GridLayout
      className="dashboard-grid"
      layout={layout}
      cols={4}
      rowHeight={100}
      width={1200}
      isResizable={isEditMode}
      isDraggable={isEditMode}
      onLayoutChange={handleLayoutChange}
      draggableHandle=".drag-handle"
      containerPadding={[16, 16]}
      margin={[16, 16]}
      compactType="vertical"
      preventCollision={false}
    >
      {children}
    </GridLayout>
  )
}
```

#### 2. `WidgetWrapper.tsx` (Widget Container)
```typescript
'use client'
import { X, GripHorizontal } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'

export const WidgetWrapper = ({ widgetId, children }) => {
  const { isEditMode, removeWidget } = useDashboardStore()

  return (
    <div className="relative h-full">
      {isEditMode && (
        <>
          <div className="drag-handle absolute top-2 left-2 cursor-move z-10">
            <GripHorizontal className="w-4 h-4 text-gray-400" />
          </div>
          <button
            onClick={() => removeWidget(widgetId)}
            className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      )}
      <div className={isEditMode ? 'pt-8' : ''}>
        {children}
      </div>
    </div>
  )
}
```

#### 3. `EditModeToolbar.tsx` (Floating Toolbar)
```typescript
'use client'
import { useDashboardStore } from '@/store/dashboardStore'
import { dashboardPreferenceAPI } from '@/lib/api'
import { toast } from 'sonner'

export const EditModeToolbar = () => {
  const { isEditMode, toggleEditMode, resetToDefaults, layout, widgets } = useDashboardStore()

  const handleSave = async () => {
    try {
      await dashboardPreferenceAPI.savePreferences(widgets, layout)
      toast.success('Dashboard saved')
      toggleEditMode()
    } catch {
      toast.error('Failed to save dashboard')
    }
  }

  if (!isEditMode) {
    return (
      <button
        onClick={toggleEditMode}
        className="fixed bottom-6 right-6 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg"
      >
        Edit Dashboard
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 flex gap-2 bg-white p-4 rounded-lg shadow-lg">
      <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">
        Save
      </button>
      <button onClick={toggleEditMode} className="px-4 py-2 bg-gray-300 rounded">
        Cancel
      </button>
      <button onClick={resetToDefaults} className="px-4 py-2 bg-red-400 text-white rounded">
        Reset
      </button>
    </div>
  )
}
```

#### 4. `WidgetSelector.tsx` (Add Widget Modal)
```typescript
'use client'
import { Modal } from '@/components/ui/Modal'
import { getAllWidgets } from '@/config/widgets'
import { useDashboardStore } from '@/store/dashboardStore'
import { useState } from 'react'

export const WidgetSelector = ({ isOpen, onClose }) => {
  const { addWidget } = useDashboardStore()
  const widgets = getAllWidgets()

  const handleAdd = (widgetType: any) => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: widgetType.id,
    }
    addWidget(newWidget)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Add Widget</h2>
        <div className="grid grid-cols-2 gap-4">
          {widgets.map((widget) => (
            <button
              key={widget.id}
              onClick={() => handleAdd(widget)}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
              <h3 className="font-semibold">{widget.name}</h3>
              <p className="text-sm text-gray-500">{widget.description}</p>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
```

### Phase 7: Dashboard Page Refactor

Refactor `frontend/src/app/dashboard/page.tsx`:

```typescript
'use client'
import { useEffect, useState } from 'react'
import { DashboardGrid } from '@/components/DashboardGrid'
import { WidgetWrapper } from '@/components/WidgetWrapper'
import { EditModeToolbar } from '@/components/EditModeToolbar'
import { WidgetSelector } from '@/components/WidgetSelector'
import { useDashboardStore } from '@/store/dashboardStore'
import { dashboardPreferenceAPI } from '@/lib/api'
import { TotalBalanceWidget } from '@/components/widgets/TotalBalanceWidget'
// ... import all other widgets

const WIDGET_COMPONENTS: Record<string, React.ComponentType> = {
  'total-balance': TotalBalanceWidget,
  'monthly-income': MonthlyIncomeWidget,
  // ... map all widgets
}

export default function DashboardPage() {
  const { preferences, setPreferences, isLoading, setIsLoading } = useDashboardStore()
  const [showWidgetSelector, setShowWidgetSelector] = useState(false)

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true)
        const res = await dashboardPreferenceAPI.getPreferences()
        setPreferences(res.data.data)
      } catch (error) {
        console.error('Error loading preferences:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [])

  if (isLoading) return <LoadingSpinner />
  if (!preferences) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button onClick={() => setShowWidgetSelector(true)} className="px-4 py-2 bg-blue-600 text-white rounded">
          Add Widget
        </button>
      </div>

      <DashboardGrid>
        {preferences.widgets.map((widget) => {
          const WidgetComponent = WIDGET_COMPONENTS[widget.type]
          if (!WidgetComponent) return null

          return (
            <div key={widget.id} data-grid={{ i: widget.id }}>
              <WidgetWrapper widgetId={widget.id}>
                <WidgetComponent settings={widget.settings} />
              </WidgetWrapper>
            </div>
          )
        })}
      </DashboardGrid>

      <EditModeToolbar />
      <WidgetSelector isOpen={showWidgetSelector} onClose={() => setShowWidgetSelector(false)} />
    </div>
  )
}
```

---

## 📋 Implementation Checklist

- [x] Backend schema and migration
- [x] Backend service/controller/routes
- [x] Frontend dependencies
- [x] Widget registry
- [x] Dashboard store
- [x] API client
- [ ] Widget components (11 remaining)
- [ ] DashboardGrid component
- [ ] WidgetWrapper component
- [ ] EditModeToolbar component
- [ ] WidgetSelector modal
- [ ] Dashboard page refactor
- [ ] Responsive layouts
- [ ] Testing

---

## 🔧 Next Steps

1. **Create remaining 11 widget components** following the TotalBalanceWidget pattern
2. **Create 4 core UI components** (DashboardGrid, WidgetWrapper, EditModeToolbar, WidgetSelector)
3. **Refactor dashboard page** to use the new system
4. **Add responsive layouts** for mobile/tablet/desktop
5. **Test end-to-end** widget add/remove/reorder functionality

---

## 🎨 CSS Requirements

Add to your Tailwind CSS config or create a new stylesheet:

```css
/* React Grid Layout styles (already in node_modules) */
@import 'react-grid-layout/css/styles.css';
@import 'react-resizable/css/styles.css';

.dashboard-grid {
  background-color: rgba(0, 0, 0, 0.01);
  border-radius: 0.5rem;
  padding: 1rem;
}

.react-grid-layout > .react-grid-item {
  border-radius: 0.5rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.react-grid-layout > .react-grid-item.react-grid-placeholder {
  background-color: #3b82f6;
  border: 2px solid #2563eb;
  opacity: 0.2;
  border-radius: 0.5rem;
}

.react-grid-layout > .react-grid-item > .react-resizable-hide > .react-resizable-handle {
  display: none;
}

.drag-handle {
  cursor: grab !important;
}

.drag-handle:active {
  cursor: grabbing !important;
}
```

---

## 💾 Estimated Remaining Time

- Widget components: 2-3 hours
- Core UI components: 2 hours
- Dashboard refactor: 1 hour
- Responsive layouts & polish: 2 hours
- Testing: 1 hour

**Total: ~9 hours**

---

## 📝 Notes

- All infrastructure is in place (backend, store, API client, config)
- Widget extraction is straightforward (copy from dashboard page)
- React Grid Layout handles all drag/drop/resize logic
- Zustand store persists preferences to localStorage as backup
- Backend API handles database persistence
- Ready for production with proper error handling and loading states

