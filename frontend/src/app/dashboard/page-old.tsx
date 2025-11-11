'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { accountAPI, transactionAPI, userAPI, dashboardAPI } from '@/lib/api'
import { Wallet, TrendingUp, TrendingDown, Users, DollarSign, PieChart as PieChartIcon } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { formatCurrency, type Currency, CURRENCIES } from '@/types/currency'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { BalancesWidget } from '@/components/BalancesWidget'

interface Stats {
  totalBalance: Record<string, number>
  accounts: number
  transactions: number
  groups: number
  monthlyIncome: number
  monthlyExpense: number
}

interface CashFlowData {
  month: string
  income: number
  expense: number
}

interface CategoryData {
  category: string
  amount: number
  percentage: number
  color: string
}

interface BalanceData {
  date: string
  balance: number
}

interface GroupBalance {
  groupId: string
  groupName: string
  totalOwed: number
  members: Array<{
    userId: string
    name: string
    email: string
    balance: number
  }>
}

interface AccountBalance {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  creditLimit: number | null
  color: string
}

interface RecentTransaction {
  id: string
  description?: string
  amount: number
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
  date: string
  category?: {
    name: string
    icon?: string
    color?: string
  }
  account?: {
    name: string
    currency: string
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalBalance: {},
    accounts: 0,
    transactions: 0,
    groups: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
  })
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [balanceData, setBalanceData] = useState<BalanceData[]>([])
  const [groupBalances, setGroupBalances] = useState<GroupBalance[]>([])
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([])
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()

      // Load data in parallel
      const [balanceRes, userStatsRes, monthStatsRes, cashFlowRes, categoryRes, balanceHistoryRes, groupBalancesRes, accountBalancesRes, recentRes] = await Promise.all([
        accountAPI.getTotalBalance(),
        userAPI.getStats(),
        transactionAPI.getStats(month, year),
        dashboardAPI.getCashFlow(6),
        dashboardAPI.getExpensesByCategory(),
        dashboardAPI.getBalanceHistory(30),
        dashboardAPI.getGroupBalances(),
        dashboardAPI.getAccountBalances(),
        transactionAPI.getRecent(5),
      ])

      setStats({
        totalBalance: balanceRes.data.data,
        accounts: userStatsRes.data.data.accounts,
        transactions: userStatsRes.data.data.transactions,
        groups: userStatsRes.data.data.groups,
        monthlyIncome: monthStatsRes.data.data.totalIncome,
        monthlyExpense: monthStatsRes.data.data.totalExpense,
      })

      // Set widget data
      setCashFlowData(cashFlowRes.data.data)

      // Add colors to category data
      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6b7280', '#ef4444', '#14b8a6']
      const categoriesWithColors = categoryRes.data.data.map((cat, idx) => ({
        ...cat,
        color: colors[idx % colors.length]
      }))
      setCategoryData(categoriesWithColors)

      setBalanceData(balanceHistoryRes.data.data)
      setGroupBalances(groupBalancesRes.data.data)
      setAccountBalances(accountBalancesRes.data.data)
      setRecentTransactions(recentRes.data.data)
    } catch (error: any) {
      toast.error('Failed to load dashboard data')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here&apos;s your financial overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(stats.totalBalance).map(([currency, amount]) => {
                const currencyCode = currency as Currency
                return (
                  <div key={currency}>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(amount, currencyCode)}
                    </div>
                    <p className="text-xs text-gray-500">{CURRENCIES[currencyCode]?.name || currency}</p>
                  </div>
                )
              })}
              {Object.keys(stats.totalBalance).length === 0 && (
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(0, 'CLP')}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Income */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.monthlyIncome, 'CLP')}
            </div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>

        {/* Monthly Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.monthlyExpense, 'CLP')}
            </div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>

        {/* Groups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Groups</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.groups}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.accounts} accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/accounts">
              <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                <Wallet className="h-5 w-5" />
                Add Account
              </button>
            </Link>
            <Link href="/dashboard/transactions">
              <button className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                <TrendingUp className="h-5 w-5" />
                New Transaction
              </button>
            </Link>
            <Link href="/dashboard/groups">
              <button className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                <Users className="h-5 w-5" />
                Create Group
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* My Balances Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Mis Balances</h2>
        <BalancesWidget />
      </div>

      {/* New Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 1: Cash Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cash Flow
            </CardTitle>
            <p className="text-sm text-gray-500">Last 6 months</p>
          </CardHeader>
          <CardContent>
            {cashFlowData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value), 'CLP')} />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Widget 2: Expenses by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Expenses by Category
            </CardTitle>
            <p className="text-sm text-gray-500">This month</p>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category} ${percentage.toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value), 'CLP')} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No expenses this month
              </div>
            )}
          </CardContent>
        </Card>

        {/* Widget 3: Balance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Balance Trend
            </CardTitle>
            <p className="text-sm text-gray-500">Last 30 days</p>
          </CardHeader>
          <CardContent>
            {balanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={balanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value), 'CLP')} />
                  <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} name="Total Balance" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No balance history available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Widget 4: Group Balances (Who owes you) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Group Balances
            </CardTitle>
            <p className="text-sm text-gray-500">People who owe you</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groupBalances.length > 0 ? (
                groupBalances.flatMap(group =>
                  group.members
                    .filter(member => member.balance < 0)
                    .map((member, index) => (
                      <div key={`${group.groupId}-${member.userId}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">{group.groupName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {formatCurrency(Math.abs(member.balance), 'CLP')}
                          </p>
                          <p className="text-xs text-gray-500">owes you</p>
                        </div>
                      </div>
                    ))
                )
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No shared expenses yet. Create a group to start tracking!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Widget 5: Account Balances */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Account Balances
            </CardTitle>
            <p className="text-sm text-gray-500">Your accounts and cards</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accountBalances.length > 0 ? (
                accountBalances.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: account.color }}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{account.name}</p>
                        <p className="text-xs text-gray-500">{account.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(account.balance, account.currency as Currency)}
                      </p>
                      {account.creditLimit && (
                        <p className="text-xs text-gray-500">
                          Limit: {formatCurrency(account.creditLimit, account.currency as Currency)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No accounts yet. Add your first account to get started!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Category Icon Circle */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: transaction.category?.color || '#6b7280' }}
                    >
                      {transaction.category?.icon || '📊'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{transaction.description || transaction.category?.name || 'Transaction'}</p>
                      <p className="text-xs text-gray-500">{transaction.account?.name || 'Account'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'EXPENSE' ? 'text-red-600' :
                      transaction.type === 'INCOME' ? 'text-green-600' :
                      'text-blue-600'
                    }`}>
                      {transaction.type === 'EXPENSE' ? '-' : transaction.type === 'INCOME' ? '+' : ''}{formatCurrency(transaction.amount, transaction.account?.currency as Currency || 'CLP')}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No recent transactions. Add your first transaction to get started!
              </p>
            )}
          </div>
          {recentTransactions.length > 0 && (
            <Link href="/dashboard/transactions" className="block mt-4">
              <button className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all transactions →
              </button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
