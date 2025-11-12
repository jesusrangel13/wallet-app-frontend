import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

/**
 * Skeleton loader for lazy-loaded widgets
 */
const WidgetSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </CardContent>
  </Card>
)

/**
 * Lazy load chart widgets to reduce initial bundle size
 * These components use recharts which is ~200KB
 * Load them on-demand instead of on initial page load
 */
export const LazyChartWidgets = {
  // Cash flow chart (uses recharts)
  CashFlowWidget: dynamic(
    () => import('@/components/widgets/CashFlowWidget').then(mod => ({ default: mod.CashFlowWidget })),
    {
      loading: () => <WidgetSkeleton />,
      ssr: false,
    }
  ),

  // Expenses by category chart (uses recharts)
  ExpensesByCategoryWidget: dynamic(
    () => import('@/components/widgets/ExpensesByCategoryWidget').then(mod => ({ default: mod.ExpensesByCategoryWidget })),
    {
      loading: () => <WidgetSkeleton />,
      ssr: false,
    }
  ),

  // Balance trend chart (uses recharts)
  BalanceTrendWidget: dynamic(
    () => import('@/components/widgets/BalanceTrendWidget').then(mod => ({ default: mod.BalanceTrendWidget })),
    {
      loading: () => <WidgetSkeleton />,
      ssr: false,
    }
  ),
}

/**
 * Helper function to wrap lazy widget with Suspense
 */
export function LazyWidget({ component: Component, ...props }: { component: React.ComponentType<any>; [key: string]: any }) {
  return (
    <Suspense fallback={<WidgetSkeleton />}>
      <Component {...props} />
    </Suspense>
  )
}
