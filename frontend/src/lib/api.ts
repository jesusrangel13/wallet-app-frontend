import axios, { AxiosError } from 'axios'
import type {
  ApiResponse,
  AuthResponse,
  User,
  Account,
  Transaction,
  Budget,
  BudgetVsActual,
  Group,
  SharedExpense,
  Payment,
  Tag,
  MergedCategory,
  RegisterForm,
  LoginForm,
  CreateAccountForm,
  CreateTransactionForm,
  CreateBudgetForm,
  CreateGroupForm,
  CreateSharedExpenseForm,
  CreatePaymentForm,
  CreateTagForm,
  Loan,
  LoanPayment,
  LoansSummary,
  LoansByBorrower,
  LoanStatus,
  CreateLoanForm,
  RecordLoanPaymentForm,
} from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response) {
      // Handle 401 Unauthorized - redirect to login
      // Note: 429 and other errors are now handled by component-level error handlers
      // using the global error handler with translated messages
      if (error.response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data: RegisterForm) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (data: LoginForm) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),

  getProfile: () =>
    api.get<ApiResponse<User>>('/auth/profile'),
}

// User API
export const userAPI = {
  getProfile: () =>
    api.get<ApiResponse<User>>('/users/profile'),

  updateProfile: (data: Partial<User>) =>
    api.put<ApiResponse<User>>('/users/profile', data),

  deleteAccount: () =>
    api.delete<ApiResponse<{ message: string }>>('/users/account'),

  getStats: () =>
    api.get<ApiResponse<{ accounts: number; transactions: number; groups: number }>>('/users/stats'),

  getMyBalances: (params?: { month?: number; year?: number }) =>
    api.get<ApiResponse<{
      totalOthersOweMe: number;
      totalIOweOthers: number;
      netBalance: number;
      groupBalances: Array<{
        group: { id: string; name: string; coverImageUrl?: string };
        othersOweMe: number;
        iOweOthers: number;
        netBalance: number;
        peopleWhoOweMe: Array<{
          amount: number;
          totalHistorical: number;
          totalPaid: number;
          user: { id: string; name: string; avatarUrl?: string };
          unpaidExpenses: Array<{
            expenseId: string;
            description: string;
            amount: number;
            date: string;
          }>;
          paidExpenses: Array<{
            expenseId: string;
            description: string;
            amount: number;
            date: string;
            paidDate?: string;
          }>;
        }>;
        peopleIOweTo: Array<{
          amount: number;
          totalHistorical: number;
          totalPaid: number;
          user: { id: string; name: string; avatarUrl?: string };
          unpaidExpenses: Array<{
            expenseId: string;
            description: string;
            amount: number;
            date: string;
          }>;
          paidExpenses: Array<{
            expenseId: string;
            description: string;
            amount: number;
            date: string;
            paidDate?: string;
          }>;
        }>;
      }>;
    }>>('/users/my-balances', { params }),

  updateDefaultSharedExpenseAccount: (accountId: string | null) =>
    api.patch<ApiResponse<User>>('/users/me/default-shared-expense-account', { accountId }),
}

// Account API
export const accountAPI = {
  create: (data: CreateAccountForm) =>
    api.post<ApiResponse<Account>>('/accounts', data),

  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{
      data: Account[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
      };
    }>>('/accounts', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Account>>(`/accounts/${id}`),

  update: (id: string, data: Partial<CreateAccountForm>) =>
    api.put<ApiResponse<Account>>(`/accounts/${id}`, data),

  delete: (id: string, transferToAccountId?: string) =>
    api.delete<ApiResponse<{
      hasTransactions?: boolean
      transactionCount?: number
      transferred?: boolean
      message: string
    }>>(`/accounts/${id}`, { data: { transferToAccountId } }),

  getBalance: (id: string) =>
    api.get<ApiResponse<{ id: string; name: string; balance: number; currency: string }>>(`/accounts/${id}/balance`),

  getTotalBalance: () =>
    api.get<ApiResponse<Record<string, number>>>('/accounts/balance/total'),

  getBalanceHistory: (id: string, month?: number, year?: number) =>
    api.get<ApiResponse<{
      history: Array<{ date: string; balance: number }>;
      currentBalance: number;
      previousMonthBalance: number;
      percentageChange: number;
      month: number;
      year: number;
    }>>(`/accounts/${id}/balance-history`, { params: { month, year } }),
}

// Transaction API
export const transactionAPI = {
  create: (data: CreateTransactionForm) =>
    api.post<ApiResponse<Transaction>>('/transactions', data),

  getAll: (filters?: {
    accountId?: string
    type?: string
    categoryId?: string
    startDate?: string
    endDate?: string
    minAmount?: number
    maxAmount?: number
    tags?: string[]
    search?: string
    sortBy?: 'date' | 'amount' | 'payee'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) =>
    api.get<ApiResponse<{
      data: Transaction[]
      total: number
      page: number
      limit: number
      totalPages: number
      hasMore: boolean
    }>>('/transactions', { params: filters }),

  getById: (id: string) =>
    api.get<ApiResponse<Transaction>>(`/transactions/${id}`),

  update: (id: string, data: Partial<CreateTransactionForm>) =>
    api.put<ApiResponse<Transaction>>(`/transactions/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/transactions/${id}`),

  getByCategory: () =>
    api.get<ApiResponse<Record<string, { income: number; expense: number }>>>('/transactions/by-category'),

  getStats: (month: number, year: number) =>
    api.get<ApiResponse<{
      totalIncome: number
      totalExpense: number
      totalTransactions: number
      byCategory: Record<string, number>
    }>>('/transactions/stats', { params: { month, year } }),

  bulkDelete: (transactionIds: string[]) =>
    api.post<ApiResponse<{
      deletedCount: number
      message: string
    }>>('/transactions/bulk-delete', { transactionIds }),

  getRecent: (limit: number = 5) =>
    api.get<ApiResponse<Transaction[]>>('/transactions/recent', { params: { limit } }),

  getUniquePayees: (search?: string) =>
    api.get<ApiResponse<string[]>>('/transactions/payees', { params: search ? { search } : {} }),
}

// Budget API
export const budgetAPI = {
  create: (data: CreateBudgetForm) =>
    api.post<ApiResponse<Budget>>('/budgets', data),

  getAll: (params?: { year?: number; page?: number; limit?: number }) =>
    api.get<ApiResponse<{
      data: Budget[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
      };
    }>>('/budgets', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Budget>>(`/budgets/${id}`),

  update: (id: string, amount: number) =>
    api.put<ApiResponse<Budget>>(`/budgets/${id}`, { amount }),

  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/budgets/${id}`),

  getVsActual: (month: number, year: number) =>
    api.get<ApiResponse<BudgetVsActual>>('/budgets/vs-actual', { params: { month, year } }),

  getCurrent: () =>
    api.get<ApiResponse<BudgetVsActual>>('/budgets/current'),
}

// Group API
export const groupAPI = {
  create: (data: CreateGroupForm) =>
    api.post<ApiResponse<Group>>('/groups', data),

  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<Group[] | {
      data: Group[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
      };
    }>>('/groups', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Group>>(`/groups/${id}`),

  update: (id: string, data: Partial<CreateGroupForm>) =>
    api.put<ApiResponse<Group>>(`/groups/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/groups/${id}`),

  addMember: (id: string, email: string) =>
    api.post<ApiResponse<{ message: string; member: User }>>(`/groups/${id}/members`, { email }),

  removeMember: (id: string, memberId: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/groups/${id}/members/${memberId}`),

  leave: (id: string) =>
    api.post<ApiResponse<{ message: string }>>(`/groups/${id}/leave`, {}),

  getBalances: (id: string) =>
    api.get<ApiResponse<Array<{ user: User; balance: number }>>>(`/groups/${id}/balances`),

  updateDefaultSplit: (id: string, data: { defaultSplitType: string; memberSplits: Array<{ userId: string; percentage?: number; shares?: number; exactAmount?: number }> }) =>
    api.put<ApiResponse<Group>>(`/groups/${id}/default-split`, data),

  settleAllBalance: (groupId: string, otherUserId: string, accountId?: string) =>
    api.post<ApiResponse<{
      payment: Payment;
      settledExpenses: number;
      amount: number;
      transactionsCreated: boolean;
    }>>(`/groups/${groupId}/settle-balance`, { otherUserId, accountId }),
}

// Shared Expense API
export const sharedExpenseAPI = {
  create: (data: CreateSharedExpenseForm) =>
    api.post<ApiResponse<SharedExpense>>('/shared-expenses', data),

  getAll: (groupId?: string) =>
    api.get<ApiResponse<SharedExpense[]>>('/shared-expenses', { params: { groupId } }),

  getById: (id: string) =>
    api.get<ApiResponse<SharedExpense>>(`/shared-expenses/${id}`),

  update: (id: string, data: Partial<CreateSharedExpenseForm>) =>
    api.put<ApiResponse<SharedExpense>>(`/shared-expenses/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/shared-expenses/${id}`),

  settlePayment: (data: CreatePaymentForm) =>
    api.post<ApiResponse<Payment>>('/shared-expenses/payments', data),

  getPaymentHistory: (groupId?: string) =>
    api.get<ApiResponse<Payment[]>>('/shared-expenses/payments/history', { params: { groupId } }),

  getSimplifiedDebts: (groupId: string) =>
    api.get<ApiResponse<Array<{
      from: { id: string; name: string }
      to: { id: string; name: string }
      amount: number
    }>>>(`/shared-expenses/groups/${groupId}/simplified-debts`),

  markParticipantAsPaid: (expenseId: string, participantUserId: string, accountId?: string) =>
    api.patch<ApiResponse<any>>(`/shared-expenses/${expenseId}/participants/${participantUserId}/mark-paid`, { accountId }),

  markParticipantAsUnpaid: (expenseId: string, participantUserId: string) =>
    api.patch<ApiResponse<any>>(`/shared-expenses/${expenseId}/participants/${participantUserId}/mark-unpaid`),
}

// Category API (legacy - uses new template system internally)
export const categoryAPI = {
  // Returns merged categories from templates + overrides
  getAll: (type?: string) =>
    api.get<ApiResponse<MergedCategory[]>>('/categories', { params: { type } }),
}

// Category Template API (new system - USE_CATEGORY_TEMPLATES enabled)
export const categoryTemplateAPI = {
  // Get user's merged categories (templates + overrides + custom)
  getUserCategories: () =>
    api.get<ApiResponse<any[]>>('/categories/user/categories'),

  // Get all templates
  getAllTemplates: () =>
    api.get<ApiResponse<any[]>>('/categories/templates/all'),

  // Get templates in hierarchy
  getTemplatesHierarchy: () =>
    api.get<ApiResponse<any[]>>('/categories/templates/hierarchy'),

  // Override a template category
  createOverride: (data: { templateId: string; name?: string; icon?: string; color?: string }) =>
    api.post<ApiResponse<any>>('/categories/overrides', data),

  // Get a category override
  getOverride: (id: string) =>
    api.get<ApiResponse<any>>(`/categories/overrides/${id}`),

  // Update a category override
  updateOverride: (id: string, data: { name?: string; icon?: string; color?: string }) =>
    api.put<ApiResponse<any>>(`/categories/overrides/${id}`, data),

  // Delete/deactivate a category override
  deleteOverride: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/categories/overrides/${id}`),

  // Create a custom category (or subcategory if parentId is provided)
  createCustom: (data: { name: string; icon?: string; color?: string; type: 'EXPENSE' | 'INCOME' | 'TRANSFER'; parentId?: string }) =>
    api.post<ApiResponse<any>>('/categories/custom', data),

  // Get all custom categories
  getCustomCategories: () =>
    api.get<ApiResponse<any[]>>('/categories/custom/all'),
}

// Tag API
export const tagAPI = {
  create: (data: CreateTagForm) =>
    api.post<ApiResponse<Tag>>('/tags', data),

  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<Tag[]>>('/tags', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Tag>>(`/tags/${id}`),

  update: (id: string, data: Partial<CreateTagForm>) =>
    api.put<ApiResponse<Tag>>(`/tags/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/tags/${id}`),
}

// Import API
export const importAPI = {
  importTransactions: (data: {
    accountId: string
    fileName: string
    fileType: 'CSV' | 'EXCEL'
    transactions: Array<{
      row: number
      date: string
      type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
      amount: number
      description: string
      categoryId?: string
      tags?: string[]
      notes?: string
    }>
  }) =>
    api.post<ApiResponse<{
      importHistoryId: string
      successCount: number
      failedCount: number
      transactions: Array<{
        row: number
        transactionId?: string
        status: 'SUCCESS' | 'FAILED'
        errorMessage?: string
      }>
    }>>('/import', data),

  getHistory: () =>
    api.get<ApiResponse<any[]>>('/import/history'),

  getHistoryById: (id: string) =>
    api.get<ApiResponse<any>>(`/import/history/${id}`),
}

// Dashboard API
export const dashboardAPI = {
  getCashFlow: (months?: number, params?: { month?: number; year?: number }) =>
    api.get<ApiResponse<Array<{
      month: string
      income: number
      expense: number
    }>>>('/dashboard/cashflow', { params: { months, ...(params || {}) } }),

  getExpensesByCategory: (params?: { month?: number; year?: number }) =>
    api.get<ApiResponse<Array<{
      category: string
      amount: number
      percentage: number
    }>>>('/dashboard/expenses-by-category', { params }),

  getExpensesByParentCategory: (params?: { month?: number; year?: number }) =>
    api.get<ApiResponse<Array<{
      category: string
      amount: number
      percentage: number
      icon: string | null
      color: string | null
    }>>>('/dashboard/expenses-by-parent-category', { params }),

  getBalanceHistory: (days?: number, params?: { month?: number; year?: number }) =>
    api.get<ApiResponse<Array<{
      date: string
      balance: number
    }>>>('/dashboard/balance-history', { params: { days, ...(params || {}) } }),

  getGroupBalances: (params?: { month?: number; year?: number }) =>
    api.get<ApiResponse<Array<{
      groupId: string
      groupName: string
      totalOwed: number
      members: Array<{
        userId: string
        name: string
        email: string
        balance: number
      }>
    }>>>('/dashboard/group-balances', { params }),

  getAccountBalances: () =>
    api.get<ApiResponse<Array<{
      id: string
      name: string
      type: string
      balance: number
      currency: string
      creditLimit: number | null
      color: string
    }>>>('/dashboard/account-balances'),

  getPersonalExpenses: (params?: { month?: number; year?: number }) =>
    api.get<ApiResponse<{
      total: number
      month: string
    }>>('/dashboard/personal-expenses', { params }),

  getSharedExpensesTotal: (params?: { month?: number; year?: number }) =>
    api.get<ApiResponse<{
      total: number
      count: number
      month: string
    }>>('/dashboard/shared-expenses', { params }),

  getMonthlySavings: (params?: { month?: number; year?: number }) =>
    api.get<ApiResponse<{
      savings: number
      savingsRate: number
      income: number
      expenses: number
      breakdown: {
        personal: number
        shared: number
      }
      month: string
    }>>('/dashboard/savings', { params }),

  getExpensesByTag: (params?: { month?: number; year?: number }) =>
    api.get<ApiResponse<Array<{
      tagName: string
      tagColor: string | null
      totalAmount: number
      percentage: number
      transactionCount: number
    }>>>('/dashboard/expenses-by-tag', { params }),

  getTopTags: (params?: { month?: number; year?: number; limit?: number }) =>
    api.get<ApiResponse<Array<{
      tagId: string
      tagName: string
      tagColor: string | null
      transactionCount: number
      totalAmount: number
      averageAmount: number
    }>>>('/dashboard/top-tags', { params }),

  getTagTrend: (months?: number, tagIds?: string[]) =>
    api.get<ApiResponse<Array<{
      tagId: string
      tagName: string
      tagColor: string | null
      monthlyData: Array<{
        month: number
        year: number
        amount: number
      }>
    }>>>('/dashboard/tag-trend', {
      params: {
        months,
        ...(tagIds && tagIds.length > 0 ? { tagIds } : {})
      }
    }),
}

// Notification API
export const notificationAPI = {
  getAll: (limit?: number) =>
    api.get<ApiResponse<Array<{
      id: string;
      userId: string;
      type: 'PAYMENT_RECEIVED' | 'SHARED_EXPENSE_CREATED' | 'GROUP_MEMBER_ADDED' | 'BALANCE_SETTLED';
      title: string;
      message: string;
      data?: any;
      isRead: boolean;
      createdAt: string;
    }>>>('/notifications', { params: { limit } }),

  getUnread: () =>
    api.get<ApiResponse<Array<{
      id: string;
      userId: string;
      type: 'PAYMENT_RECEIVED' | 'SHARED_EXPENSE_CREATED' | 'GROUP_MEMBER_ADDED' | 'BALANCE_SETTLED';
      title: string;
      message: string;
      data?: any;
      isRead: boolean;
      createdAt: string;
    }>>>('/notifications/unread'),

  getCount: () =>
    api.get<ApiResponse<{ count: number }>>('/notifications/count'),

  markAsRead: (id: string) =>
    api.patch<ApiResponse<any>>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch<ApiResponse<any>>('/notifications/read-all'),

  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/notifications/${id}`),

  deleteAllRead: () =>
    api.delete<ApiResponse<any>>('/notifications/read/all'),
}

// Dashboard Preference API
export const dashboardPreferenceAPI = {
  getPreferences: () =>
    api.get<ApiResponse<{
      id: string
      userId: string
      widgets: Array<{
        id: string
        type: string
        settings?: Record<string, any>
      }>
      layout: Array<{
        i: string
        x: number
        y: number
        w: number
        h: number
        minW?: number
        minH?: number
        maxW?: number
        maxH?: number
      }>
      createdAt: string
      updatedAt: string
    }>>('/users/dashboard-preferences'),

  savePreferences: (widgets: any[], layout: any[]) =>
    api.put<ApiResponse<any>>('/users/dashboard-preferences', {
      widgets,
      layout,
    }),

  addWidget: (widget: any) =>
    api.post<ApiResponse<any>>('/users/dashboard-preferences/widgets', {
      widget,
    }),

  removeWidget: (widgetId: string) =>
    api.delete<ApiResponse<any>>(`/users/dashboard-preferences/widgets/${widgetId}`),

  updateWidgetSettings: (widgetId: string, settings: Record<string, any>) =>
    api.patch<ApiResponse<any>>(`/users/dashboard-preferences/widgets/${widgetId}/settings`, {
      settings,
    }),

  updateLayout: (layout: any[]) =>
    api.patch<ApiResponse<any>>('/users/dashboard-preferences/layout', {
      layout,
    }),

  resetToDefaults: () =>
    api.delete<ApiResponse<any>>('/users/dashboard-preferences/reset'),
}

// Loan API
export const loanAPI = {
  create: (data: CreateLoanForm) =>
    api.post<ApiResponse<Loan>>('/loans', data),

  getAll: (params?: { status?: LoanStatus; borrowerName?: string }) =>
    api.get<ApiResponse<Loan[]>>('/loans', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Loan>>(`/loans/${id}`),

  recordPayment: (id: string, data: RecordLoanPaymentForm) =>
    api.post<ApiResponse<LoanPayment>>(`/loans/${id}/payments`, data),

  cancel: (id: string) =>
    api.patch<ApiResponse<Loan>>(`/loans/${id}/cancel`),

  getSummary: () =>
    api.get<ApiResponse<LoansSummary>>('/loans/summary'),

  getByBorrower: () =>
    api.get<ApiResponse<LoansByBorrower[]>>('/loans/by-borrower'),

  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/loans/${id}`),
}

export default api
