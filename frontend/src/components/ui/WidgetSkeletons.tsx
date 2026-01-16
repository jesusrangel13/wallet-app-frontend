import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Users,
  DollarSign,
  BarChart3,
  PieChart,
  TrendingUpDown,
  ShoppingCart,
  Tag
} from 'lucide-react'

/**
 * OPT-5: True-to-Life Skeletons (Anti-Layout Shift)
 *
 * These skeleton components mimic the EXACT height and layout of their final content
 * to prevent Cumulative Layout Shift (CLS) and provide a professional loading experience.
 */

// Skeleton for simple metric widgets (Total Balance, Monthly Income/Expenses, Groups, etc.)
interface MetricWidgetSkeletonProps {
  icon: React.ElementType
  title: string
  showSecondaryText?: boolean
  iconColor?: string
}

export const MetricWidgetSkeleton = ({
  icon: Icon,
  title,
  showSecondaryText = true,
  iconColor = 'text-gray-600'
}: MetricWidgetSkeletonProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className={`text-sm font-medium text-gray-600 flex items-center gap-2`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-2" />
        {showSecondaryText && <Skeleton className="h-4 w-24 mt-1" />}
      </CardContent>
    </Card>
  )
}

// Skeleton for Account Balances Widget (horizontal carousel)
export const AccountBalancesWidgetSkeleton = () => {
  return (
    <Card className="h-[140px]">
      <CardContent className="h-full flex items-center !p-0">
        <div className="relative w-full h-full flex items-center px-4">
          <div className="flex gap-2 w-full">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="min-w-[230px] flex-shrink-0 px-3 py-4 bg-gray-50 rounded-lg relative overflow-hidden"
              >
                {/* Color bar */}
                <Skeleton className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" />

                <div className="flex flex-col gap-1 pl-2">
                  {/* Icon + Name */}
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>

                  {/* Balance label */}
                  <Skeleton className="h-2 w-12 mt-1" />

                  {/* Balance amount */}
                  <Skeleton className="h-5 w-24 mt-0.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton for Chart Widgets (Bar Chart, Pie Chart, Line Chart)
interface ChartWidgetSkeletonProps {
  icon: React.ElementType
  title: string
  chartType: 'bar' | 'pie' | 'line'
  height?: number
}

export const ChartWidgetSkeleton = ({
  icon: Icon,
  title,
  chartType,
  height = 264
}: ChartWidgetSkeletonProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartType === 'pie' ? (
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <Skeleton className="rounded-full" style={{ width: `${height * 0.6}px`, height: `${height * 0.6}px` }} />
          </div>
        ) : chartType === 'bar' ? (
          <div className="flex items-end gap-2 justify-between" style={{ height: `${height}px` }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton
                key={i}
                className="flex-1"
                style={{ height: `${Math.random() * 60 + 40}%` }}
              />
            ))}
          </div>
        ) : (
          <Skeleton className="w-full" style={{ height: `${height}px` }} />
        )}
      </CardContent>
    </Card>
  )
}

// Skeleton for List Widgets (Shared Expenses, Recent Transactions, Top Tags)
interface ListWidgetSkeletonProps {
  icon: React.ElementType
  title: string
  itemCount?: number
  showAvatar?: boolean
}

export const ListWidgetSkeleton = ({
  icon: Icon,
  title,
  itemCount = 3,
  showAvatar = false
}: ListWidgetSkeletonProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: itemCount }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              {showAvatar && <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-3/4 mb-1.5" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-20 flex-shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton for Quick Actions Widget
export const QuickActionsWidgetSkeleton = () => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton for Loans/Budgets Widget (progress bars)
interface ProgressListWidgetSkeletonProps {
  icon: React.ElementType
  title: string
  itemCount?: number
}

export const ProgressListWidgetSkeleton = ({
  icon: Icon,
  title,
  itemCount = 3
}: ProgressListWidgetSkeletonProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: itemCount }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Pre-configured skeleton exports for each widget type
export const TotalBalanceWidgetSkeleton = () => (
  <MetricWidgetSkeleton icon={Wallet} title="Total Balance" showSecondaryText />
)

export const MonthlyIncomeWidgetSkeleton = () => (
  <MetricWidgetSkeleton icon={TrendingUp} title="Monthly Income" iconColor="text-green-600" />
)

export const MonthlyExpensesWidgetSkeleton = () => (
  <MetricWidgetSkeleton icon={TrendingDown} title="Monthly Expenses" iconColor="text-red-600" />
)

export const SavingsWidgetSkeleton = () => (
  <MetricWidgetSkeleton icon={PiggyBank} title="Savings" />
)

export const GroupsWidgetSkeleton = () => (
  <MetricWidgetSkeleton icon={Users} title="Groups" />
)

export const ExpensesByParentCategoryWidgetSkeleton = () => (
  <ChartWidgetSkeleton icon={BarChart3} title="Expenses by Category" chartType="bar" height={264} />
)

export const ExpenseDetailsPieWidgetSkeleton = () => (
  <ChartWidgetSkeleton icon={PieChart} title="Expense Details" chartType="pie" height={240} />
)

export const BalanceTrendWidgetSkeleton = () => (
  <ChartWidgetSkeleton icon={TrendingUpDown} title="Balance Trend" chartType="line" height={240} />
)

export const TagTrendWidgetSkeleton = () => (
  <ChartWidgetSkeleton icon={BarChart3} title="Tag Trend" chartType="bar" height={264} />
)

export const SharedExpensesWidgetSkeleton = () => (
  <ListWidgetSkeleton icon={Users} title="Shared Expenses" itemCount={3} showAvatar={false} />
)

export const TopTagsWidgetSkeleton = () => (
  <ListWidgetSkeleton icon={DollarSign} title="Top Tags" itemCount={5} showAvatar={false} />
)

export const LoansWidgetSkeleton = () => (
  <ProgressListWidgetSkeleton icon={DollarSign} title="Loans" itemCount={2} />
)

export const CashFlowWidgetSkeleton = () => (
  <ChartWidgetSkeleton icon={TrendingUp} title="Cash Flow" chartType="bar" height={264} />
)

export const ExpensesByCategoryWidgetSkeleton = () => (
  <ChartWidgetSkeleton icon={PieChart} title="Expenses by Category" chartType="pie" height={240} />
)

export const ExpensesByTagWidgetSkeleton = () => (
  <ChartWidgetSkeleton icon={Tag} title="Expenses by Tag" chartType="pie" height={240} />
)

export const GroupBalancesWidgetSkeleton = () => (
  <ListWidgetSkeleton icon={DollarSign} title="Group Balances" itemCount={3} showAvatar={false} />
)

export const PersonalExpensesWidgetSkeleton = () => (
  <MetricWidgetSkeleton icon={ShoppingCart} title="Personal Expenses" iconColor="text-amber-600" />
)

export const RecentTransactionsWidgetSkeleton = () => (
  <ListWidgetSkeleton icon={TrendingUp} title="Recent Transactions" itemCount={5} showAvatar={false} />
)
