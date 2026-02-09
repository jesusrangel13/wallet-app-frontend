'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useDashboardStore } from '@/store/dashboardStore'
import { dashboardPreferenceAPI } from '@/lib/api'
import { DashboardGrid } from '@/components/DashboardGrid'
import { WidgetWrapper } from '@/components/WidgetWrapper'
import { AddWidgetButton } from '@/components/AddWidgetButton'
import { toast } from 'sonner'
import { LoadingPage } from '@/components/ui/Loading'
import { SelectedMonthProvider, useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { DashboardMonthSelector } from '@/components/DashboardMonthSelector'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageTransition } from '@/components/ui/animations'

// Import light widgets directly - these don't use heavy libraries
import { TotalBalanceWidget } from '@/components/widgets/TotalBalanceWidget'
import { MonthlyIncomeWidget } from '@/components/widgets/MonthlyIncomeWidget'
import { MonthlyExpensesWidget } from '@/components/widgets/MonthlyExpensesWidget'
import { NetMonthlyExpensesWidget } from '@/components/widgets/NetMonthlyExpensesWidget'
import { PersonalExpensesWidget } from '@/components/widgets/PersonalExpensesWidget'
import { SharedExpensesWidget } from '@/components/widgets/SharedExpensesWidget'
import { SavingsWidget } from '@/components/widgets/SavingsWidget'
import { GroupsWidget } from '@/components/widgets/GroupsWidget'
import { LoansWidget } from '@/components/widgets/LoansWidget'
import { QuickActionsWidget } from '@/components/widgets/QuickActionsWidget'
import { GroupBalancesWidget } from '@/components/widgets/GroupBalancesWidget'
import { AccountBalancesWidget } from '@/components/widgets/AccountBalancesWidget'
import { RecentTransactionsWidget } from '@/components/widgets/RecentTransactionsWidget'
import { BalancesWidget } from '@/components/BalancesWidget'
import { FixedAccountBalancesWidget } from '@/components/FixedAccountBalancesWidget'
import { TopTagsWidget } from '@/components/widgets/TopTagsWidget'
import { HeroBalanceWidget } from '@/components/widgets/HeroBalanceWidget'
import { SmartInsightsWidget } from '@/components/widgets/SmartInsightsWidget'
import { useDashboardSummary } from '@/hooks/useDashboard'
import { EmptyState } from '@/components/ui/EmptyState'

// Import lazy-loaded chart widgets - these use recharts (~200KB)
// They are loaded on-demand to reduce initial bundle size
import { LazyChartWidgets } from '@/lib/lazyWidgets'

// Widget component map - uses lazy-loaded versions for chart widgets
const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
  // Light widgets (direct imports - no heavy dependencies)
  'total-balance': TotalBalanceWidget,
  'monthly-income': MonthlyIncomeWidget,
  'monthly-expenses': MonthlyExpensesWidget,
  'net-monthly-expenses': NetMonthlyExpensesWidget,
  'personal-expenses': PersonalExpensesWidget,
  'shared-expenses': SharedExpensesWidget,
  'savings': SavingsWidget,
  'groups': GroupsWidget,
  'loans': LoansWidget,
  'quick-actions': QuickActionsWidget,
  'balances': BalancesWidget,
  'group-balances': GroupBalancesWidget,
  'account-balances': AccountBalancesWidget,
  'recent-transactions': RecentTransactionsWidget,
  'top-tags': TopTagsWidget,
  // Chart widgets (lazy-loaded - uses recharts ~200KB)
  'cash-flow': LazyChartWidgets.CashFlowWidget,
  'expenses-by-category': LazyChartWidgets.ExpensesByCategoryWidget,
  'expenses-by-parent-category': LazyChartWidgets.ExpensesByParentCategoryWidget,
  'expense-details-pie': LazyChartWidgets.ExpenseDetailsPieWidget,
  'balance-trend': LazyChartWidgets.BalanceTrendWidget,
  'expenses-by-tag': LazyChartWidgets.ExpensesByTagWidget,
  'tag-trend': LazyChartWidgets.TagTrendWidget,
  'category-breakdown-list': LazyChartWidgets.CategoryBreakdownWidget,
}

// Widget names map for Error Boundary display
const WIDGET_NAMES: Record<string, string> = {
  'total-balance': 'Saldo Total',
  'monthly-income': 'Ingresos Mensuales',
  'monthly-expenses': 'Gastos Totales',
  'net-monthly-expenses': 'Mis Gastos Mensuales',
  'personal-expenses': 'Gastos Personales',
  'shared-expenses': 'Gastos Compartidos',
  'savings': 'Ahorros',
  'groups': 'Grupos',
  'loans': 'Préstamos',
  'quick-actions': 'Acciones Rápidas',
  'balances': 'Balances',
  'cash-flow': 'Flujo de Caja',
  'expenses-by-category': 'Gastos por Categoría',
  'expenses-by-parent-category': 'Gastos por Categoría Padre',
  'expense-details-pie': 'Detalle de Gastos',
  'balance-trend': 'Tendencia de Balance',
  'group-balances': 'Balances de Grupos',
  'account-balances': 'Balances de Cuentas',
  'recent-transactions': 'Transacciones Recientes',
  'expenses-by-tag': 'Gastos por Etiqueta',
  'top-tags': 'Etiquetas Principales',
  'tag-trend': 'Tendencia de Etiquetas',
  'category-breakdown-list': 'Desglose de Categorías (Lista)',
}

// Internal component to use the context
const DashboardContent = () => {
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const { preferences, setPreferences, isLoading, setIsLoading } = useDashboardStore()
  const { month, year, setMonthYear } = useSelectedMonth() // Now accessing context correctly
  const { data: dashboardData, isLoading: isDataLoading } = useDashboardSummary({ month, year }) // Accessing backend with 0-based month (Backend handles Date constructor correctly)

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
        toast.error(t('loadingPreferences'))
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [setPreferences, setIsLoading, t])

  // Show loading state
  if (isLoading || !preferences || isDataLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Hero Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>

        {/* Fixed Account Balances Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>

        {/* Dashboard Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header with Month Selector */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('subtitle')}</p>
          </div>
          <DashboardMonthSelector
            currentDate={new Date(year, month)}
            onDateChange={(date) => setMonthYear(date.getMonth(), date.getFullYear())}
          />
        </div>

        {/* Hero Section (Command Center) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <HeroBalanceWidget
              totalBalance={dashboardData?.heroBalance?.totalBalance || 0}
              currency={((dashboardData?.heroBalance?.currency as any) || 'CLP')}
              changePercent={dashboardData?.heroBalance?.changePercent || 0}
              changeAmount={dashboardData?.heroBalance?.changeAmount || 0}
              period={dashboardData?.heroBalance?.period || 'vs. mes anterior'}
              monthlyIncome={dashboardData?.expenseSummary?.income || 0}
              monthlyExpenses={dashboardData?.expenseSummary?.totalExpenses || 0}
              monthlySavings={dashboardData?.expenseSummary?.savings || 0}
              personalExpenses={dashboardData?.expenseSummary?.personal || 0}
              sharedExpenses={dashboardData?.expenseSummary?.shared || 0}
            />
          </div>
          <div className="lg:col-span-1">
            <SmartInsightsWidget insights={dashboardData?.insights || []} />
          </div>
        </div>


        {/* Fixed Account Balances Widget - Always at top, full width */}
        <FixedAccountBalancesWidget />

        {/* Dashboard Grid with Widgets */}
        <DashboardGrid>
          {preferences.widgets.filter((widget) => widget.type !== 'account-balances').map((widget, index) => {
            const WidgetComponent = WIDGET_COMPONENTS[widget.type]
            let layoutItem = preferences.layout.find((l) => l.i === widget.id)

            // Skip unknown widgets
            if (!WidgetComponent) {
              console.warn(`Unknown widget type: ${widget.type}`)
              return null
            }

            // Create default layout if none exists
            if (!layoutItem) {
              console.warn(`No layout found for widget: ${widget.id}, using default`)
              layoutItem = {
                i: widget.id,
                x: (index * 2) % 4,
                y: Math.floor(index / 2) * 2,
                w: 2,
                h: 2,
                minW: 1,
                minH: 1,
              }
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
                  minW: layoutItem.minW || 1,
                  minH: layoutItem.minH || 1,
                  maxW: layoutItem.maxW,
                  maxH: layoutItem.maxH,
                }}
              >
                <WidgetWrapper
                  widgetId={widget.id}
                  widgetName={WIDGET_NAMES[widget.type] || widget.type}
                >
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
          <EmptyState
            type="widgets"
            title={tCommon('empty.widgets.title')}
            description={tCommon('empty.widgets.description')}
          >
            <AddWidgetButton />
          </EmptyState>
        )}
      </div>
    </PageTransition>
  )
}

export default function DashboardPage() {
  return (
    <SelectedMonthProvider>
      <DashboardContent />
    </SelectedMonthProvider>
  )
}
