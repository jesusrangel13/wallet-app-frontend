/**
 * Widget Registry Configuration
 * Defines all available dashboard widgets with their metadata
 */

export type WidgetType =
  | 'total-balance'
  | 'monthly-income'
  | 'monthly-expenses'
  | 'groups'
  | 'quick-actions'
  | 'balances'
  | 'cash-flow'
  | 'expenses-by-category'
  | 'balance-trend'
  | 'group-balances'
  | 'account-balances'
  | 'recent-transactions'

export interface WidgetDefinition {
  id: WidgetType
  name: string
  description: string
  category: 'summary' | 'insights' | 'actions' | 'details'
  icon: string // lucide-react icon name
  defaultWidth: number
  defaultHeight: number
  minWidth: number
  minHeight: number
  maxWidth?: number
  maxHeight?: number
  resizable: boolean
  draggable: boolean
}

export const WIDGET_REGISTRY: Record<WidgetType, WidgetDefinition> = {
  'total-balance': {
    id: 'total-balance',
    name: 'Total Balance',
    description: 'Your total balance across all currencies',
    category: 'summary',
    icon: 'Wallet',
    defaultWidth: 1,
    defaultHeight: 2,
    minWidth: 1,
    minHeight: 1,
    resizable: true,
    draggable: true,
  },
  'monthly-income': {
    id: 'monthly-income',
    name: 'Monthly Income',
    description: 'Your income for this month',
    category: 'summary',
    icon: 'TrendingUp',
    defaultWidth: 1,
    defaultHeight: 2,
    minWidth: 1,
    minHeight: 1,
    resizable: true,
    draggable: true,
  },
  'monthly-expenses': {
    id: 'monthly-expenses',
    name: 'Monthly Expenses',
    description: 'Your expenses for this month',
    category: 'summary',
    icon: 'TrendingDown',
    defaultWidth: 1,
    defaultHeight: 2,
    minWidth: 1,
    minHeight: 1,
    resizable: true,
    draggable: true,
  },
  'groups': {
    id: 'groups',
    name: 'Groups',
    description: 'Number of groups and accounts',
    category: 'summary',
    icon: 'Users',
    defaultWidth: 1,
    defaultHeight: 2,
    minWidth: 1,
    minHeight: 1,
    resizable: true,
    draggable: true,
  },
  'quick-actions': {
    id: 'quick-actions',
    name: 'Quick Actions',
    description: 'Quick access to main features',
    category: 'actions',
    icon: 'Zap',
    defaultWidth: 4,
    defaultHeight: 2,
    minWidth: 2,
    minHeight: 1,
    resizable: true,
    draggable: true,
  },
  'balances': {
    id: 'balances',
    name: 'My Balances',
    description: 'Group balances with payment tracking',
    category: 'insights',
    icon: 'BarChart3',
    defaultWidth: 4,
    defaultHeight: 2,
    minWidth: 2,
    minHeight: 1,
    resizable: true,
    draggable: true,
  },
  'cash-flow': {
    id: 'cash-flow',
    name: 'Cash Flow',
    description: 'Income vs expenses trend (last 6 months)',
    category: 'insights',
    icon: 'BarChart2',
    defaultWidth: 2,
    defaultHeight: 2,
    minWidth: 2,
    minHeight: 1,
    resizable: true,
    draggable: true,
  },
  'expenses-by-category': {
    id: 'expenses-by-category',
    name: 'Expenses by Category',
    description: 'Expense distribution by category',
    category: 'insights',
    icon: 'PieChart',
    defaultWidth: 2,
    defaultHeight: 2,
    minWidth: 2,
    minHeight: 1,
    resizable: true,
    draggable: true,
  },
  'balance-trend': {
    id: 'balance-trend',
    name: 'Balance Trend',
    description: 'Your balance over the last 30 days',
    category: 'insights',
    icon: 'LineChart',
    defaultWidth: 2,
    defaultHeight: 2,
    minWidth: 2,
    minHeight: 1,
    resizable: true,
    draggable: true,
  },
  'group-balances': {
    id: 'group-balances',
    name: 'Group Balances',
    description: 'People who owe you money',
    category: 'details',
    icon: 'DollarSign',
    defaultWidth: 2,
    defaultHeight: 2,
    minWidth: 2,
    minHeight: 1,
    resizable: true,
    draggable: true,
  },
  'account-balances': {
    id: 'account-balances',
    name: 'Account Balances',
    description: 'Your accounts and cards',
    category: 'details',
    icon: 'CreditCard',
    defaultWidth: 2,
    defaultHeight: 2,
    minWidth: 2,
    minHeight: 1,
    resizable: true,
    draggable: true,
  },
  'recent-transactions': {
    id: 'recent-transactions',
    name: 'Recent Transactions',
    description: 'Your most recent transactions',
    category: 'details',
    icon: 'Activity',
    defaultWidth: 4,
    defaultHeight: 2,
    minWidth: 2,
    minHeight: 1,
    resizable: true,
    draggable: true,
  },
}

/**
 * Get all available widgets
 */
export const getAllWidgets = (): WidgetDefinition[] => {
  return Object.values(WIDGET_REGISTRY)
}

/**
 * Get widgets by category
 */
export const getWidgetsByCategory = (
  category: WidgetDefinition['category']
): WidgetDefinition[] => {
  return Object.values(WIDGET_REGISTRY).filter((w) => w.category === category)
}

/**
 * Get widget definition by type
 */
export const getWidgetDefinition = (type: WidgetType): WidgetDefinition | undefined => {
  return WIDGET_REGISTRY[type]
}
