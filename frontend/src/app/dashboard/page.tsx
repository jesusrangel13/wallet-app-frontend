'use client'

import { useEffect } from 'react'
import { useDashboardStore } from '@/store/dashboardStore'
import { dashboardPreferenceAPI } from '@/lib/api'
import { DashboardGrid } from '@/components/DashboardGrid'
import { WidgetWrapper } from '@/components/WidgetWrapper'
import { AddWidgetButton } from '@/components/AddWidgetButton'
import { toast } from 'sonner'
import { LoadingPage, LoadingMessages } from '@/components/ui/Loading'

// Import all widgets - using direct imports to avoid Next.js barrel export bundler issue
import { TotalBalanceWidget } from '@/components/widgets/TotalBalanceWidget'
import { MonthlyIncomeWidget } from '@/components/widgets/MonthlyIncomeWidget'
import { MonthlyExpensesWidget } from '@/components/widgets/MonthlyExpensesWidget'
import { PersonalExpensesWidget } from '@/components/widgets/PersonalExpensesWidget'
import { SharedExpensesWidget } from '@/components/widgets/SharedExpensesWidget'
import { SavingsWidget } from '@/components/widgets/SavingsWidget'
import { GroupsWidget } from '@/components/widgets/GroupsWidget'
import { LoansWidget } from '@/components/widgets/LoansWidget'
import { QuickActionsWidget } from '@/components/widgets/QuickActionsWidget'
import { CashFlowWidget } from '@/components/widgets/CashFlowWidget'
import { ExpensesByCategoryWidget } from '@/components/widgets/ExpensesByCategoryWidget'
import { ExpensesByParentCategoryWidget } from '@/components/widgets/ExpensesByParentCategoryWidget'
import { ExpenseDetailsPieWidget } from '@/components/widgets/ExpenseDetailsPieWidget'
import { BalanceTrendWidget } from '@/components/widgets/BalanceTrendWidget'
import { GroupBalancesWidget } from '@/components/widgets/GroupBalancesWidget'
import { AccountBalancesWidget } from '@/components/widgets/AccountBalancesWidget'
import { RecentTransactionsWidget } from '@/components/widgets/RecentTransactionsWidget'
import { BalancesWidget } from '@/components/BalancesWidget'
import { FixedAccountBalancesWidget } from '@/components/FixedAccountBalancesWidget'

// Widget component map
const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'total-balance': TotalBalanceWidget,
  'monthly-income': MonthlyIncomeWidget,
  'monthly-expenses': MonthlyExpensesWidget,
  'personal-expenses': PersonalExpensesWidget,
  'shared-expenses': SharedExpensesWidget,
  'savings': SavingsWidget,
  'groups': GroupsWidget,
  'loans': LoansWidget,
  'quick-actions': QuickActionsWidget,
  'balances': BalancesWidget,
  'cash-flow': CashFlowWidget,
  'expenses-by-category': ExpensesByCategoryWidget,
  'expenses-by-parent-category': ExpensesByParentCategoryWidget,
  'expense-details-pie': ExpenseDetailsPieWidget,
  'balance-trend': BalanceTrendWidget,
  'group-balances': GroupBalancesWidget,
  'account-balances': AccountBalancesWidget,
  'recent-transactions': RecentTransactionsWidget,
}

export default function DashboardPage() {
  const { preferences, setPreferences, isLoading, setIsLoading } = useDashboardStore()

  // Load dashboard preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true)
        const res = await dashboardPreferenceAPI.getPreferences()
        // Type cast the response to match our expected format
        const preferences = res.data.data as any
        setPreferences(preferences)
      } catch (error) {
        console.error('Error loading dashboard preferences:', error)
        toast.error('Failed to load dashboard preferences')
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [setPreferences, setIsLoading])

  // Show loading state
  if (isLoading || !preferences) {
    return <LoadingPage message={LoadingMessages.dashboard} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here&apos;s your financial overview.</p>
        </div>
      </div>

      {/* Fixed Account Balances Widget - Always at top, full width */}
      <FixedAccountBalancesWidget />

      {/* Dashboard Grid with Widgets */}
      <DashboardGrid>
        {preferences.widgets.filter((widget) => widget.type !== 'account-balances').map((widget) => {
          const WidgetComponent = WIDGET_COMPONENTS[widget.type]
          const layoutItem = preferences.layout.find((l) => l.i === widget.id)

          // Skip unknown widgets
          if (!WidgetComponent) {
            console.warn(`Unknown widget type: ${widget.type}`)
            return null
          }

          // Skip widgets without layout info
          if (!layoutItem) {
            console.warn(`No layout found for widget: ${widget.id}`)
            return null
          }

          return (
            <div
              key={widget.id}
              data-grid={{
                i: layoutItem.i,
                x: layoutItem.x,
                y: layoutItem.y,
                w: layoutItem.w,
                h: layoutItem.h,
                minW: layoutItem.minW,
                minH: layoutItem.minH,
                maxW: layoutItem.maxW,
                maxH: layoutItem.maxH,
              }}
            >
              <WidgetWrapper widgetId={widget.id}>
                <WidgetComponent
                  settings={widget.settings}
                  gridWidth={layoutItem.w}
                  gridHeight={layoutItem.h}
                />
              </WidgetWrapper>
            </div>
          )
        })}
      </DashboardGrid>

      {/* Empty state */}
      {preferences.widgets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No widgets on your dashboard</p>
          <AddWidgetButton />
        </div>
      )}
    </div>
  )
}
