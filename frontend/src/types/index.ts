// User types
export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  currency: string
  country?: string
  isVerified: boolean
  defaultSharedExpenseAccountId?: string | null
  defaultSharedExpenseAccount?: {
    id: string
    name: string
    type: AccountType
    balance: number
    currency: string
  } | null
  createdAt: string
  updatedAt: string
}

// Account types
export type AccountType = 'CASH' | 'DEBIT' | 'CREDIT' | 'SAVINGS' | 'INVESTMENT'

export interface Account {
  id: string
  userId: string
  name: string
  type: AccountType
  balance: number
  currency: string
  isDefault: boolean
  isArchived: boolean
  includeInTotalBalance: boolean
  accountNumber?: string // Optional account number
  color: string // Hex color code (always present from backend)
  creditLimit?: number // Only for CREDIT type
  billingDay?: number // Day of month (1-31) for statement generation
  createdAt: string
  updatedAt: string
}

// Category info returned from API (resolved from template or override)
export interface CategoryInfo {
  id: string
  name: string
  icon?: string | null
  color?: string | null
  type?: string
  parent?: CategoryInfo | null
}

// Category Templates System (New)
export interface CategoryTemplate {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  type: TransactionType
  parentId?: string | null
  createdAt: string
  updatedAt: string
  parent?: CategoryTemplate
  subcategories?: CategoryTemplate[]
}

export interface UserCategoryOverride {
  id: string
  userId: string
  templateId: string
  name?: string
  icon?: string
  color?: string
  createdAt: string
  updatedAt: string
  template?: CategoryTemplate
}

export interface CustomCategory {
  id: string
  userId: string
  name: string
  icon?: string
  color?: string
  type: TransactionType
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MergedCategory {
  id: string
  name: string
  icon?: string
  color?: string
  type: TransactionType
  source: 'TEMPLATE' | 'OVERRIDE' | 'CUSTOM'
  templateId?: string
  overrideId?: string
  customId?: string
  hasOverride: boolean
  isCustom: boolean
  isEditable: boolean
  parentId?: string
  subcategories?: MergedCategory[]
}

// Tag types
export interface Tag {
  id: string
  userId: string
  name: string
  color?: string
  createdAt: string
}

export interface TransactionTag {
  id: string
  transactionId: string
  tagId: string
  tag: Tag
}

// Transaction types
export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER'

export interface Transaction {
  id: string
  userId: string
  accountId: string
  type: TransactionType
  amount: number
  categoryId?: string
  description?: string
  date: string
  receiptUrl?: string
  payee?: string
  payer?: string
  toAccountId?: string
  sharedExpenseId?: string
  createdAt: string
  updatedAt: string
  account?: {
    name: string
    currency: string
    type: AccountType
  }
  category?: CategoryInfo | null
  toAccount?: {
    name: string
    currency: string
  }
  tags?: TransactionTag[]
  sharedExpense?: {
    id: string
    description: string
    groupId: string
    participants?: Array<{
      id: string
      userId: string
      amountOwed: number
      isPaid?: boolean
      paidDate?: string
      paidAmount?: number
      user: {
        id: string
        name: string
        avatarUrl?: string
      }
    }>
  }
}

// Budget types
export interface Budget {
  id: string
  userId: string
  amount: number
  month: number
  year: number
  createdAt: string
  updatedAt: string
}

export interface BudgetVsActual {
  budget: number
  actual: number
  remaining: number
  percentageUsed: number
  byCategory: Record<string, number>
}

// Group types
export interface GroupMember {
  id: string
  userId: string
  groupId: string
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    avatarUrl?: string
  }
}

export interface GroupMemberSplitDefault {
  id: string
  groupId: string
  userId: string
  percentage?: number
  shares?: number
  exactAmount?: number
  createdAt: string
  updatedAt: string
}

export interface Group {
  id: string
  name: string
  description?: string
  coverImageUrl?: string
  createdBy: string
  defaultSplitType?: SplitType
  createdAt: string
  updatedAt: string
  members: GroupMember[]
  defaultSplitSettings?: GroupMemberSplitDefault[]
  _count?: {
    expenses: number
  }
}

// Shared Expense types
export type SplitType = 'EQUAL' | 'PERCENTAGE' | 'EXACT' | 'SHARES'

export interface ExpenseParticipant {
  id: string
  expenseId: string
  userId: string
  amountOwed: number
  percentage?: number
  shares?: number
  user: {
    id: string
    name: string
    avatarUrl?: string
  }
}

export interface SharedExpense {
  id: string
  groupId: string
  paidByUserId: string
  amount: number
  description: string
  categoryId?: string
  receiptUrl?: string
  splitType: SplitType
  date: string
  createdAt: string
  updatedAt: string
  group?: {
    id: string
    name: string
  }
  paidBy: {
    id: string
    name: string
    avatarUrl?: string
  }
  category?: CategoryInfo | null
  participants: ExpenseParticipant[]
}

// Payment types
export interface Payment {
  id: string
  fromUserId: string
  toUserId: string
  amount: number
  groupId?: string
  createdAt: string
  from: {
    id: string
    name: string
    avatarUrl?: string
  }
  to: {
    id: string
    name: string
    avatarUrl?: string
  }
  group?: {
    id: string
    name: string
  }
}

// Import History types
export type ImportHistoryStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface ImportHistory {
  id: string
  userId: string
  accountId: string
  fileName: string
  fileType: string
  totalRows: number
  successCount: number
  failedCount: number
  status: ImportHistoryStatus
  importedAt: string
  completedAt?: string
  account: {
    id: string
    name: string
    currency: string
  }
  importedTransactions?: ImportedTransaction[]
}

export interface ImportedTransaction {
  id: string
  importHistoryId: string
  transactionId?: string
  rowNumber: number
  status: 'SUCCESS' | 'FAILED'
  errorMessage?: string
  originalDate: string
  type: string
  amount: string
  description: string
  category?: string
  tags?: string
  notes?: string
  transaction?: Transaction
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface AuthResponse {
  user: User
  token: string
}

// Form types
export interface RegisterForm {
  email: string
  password: string
  name: string
  currency?: string
  country?: string
}

export interface LoginForm {
  email: string
  password: string
}

export interface CreateAccountForm {
  name: string
  type: AccountType
  balance?: number
  currency?: string
  isDefault?: boolean
  includeInTotalBalance?: boolean
  accountNumber?: string // Optional account number
  color?: string // Optional hex color (backend generates if not provided)
  creditLimit?: number
  billingDay?: number
}

export interface CreateTransactionForm {
  accountId: string
  type: TransactionType
  amount: number
  categoryId?: string
  description?: string
  date?: string
  receiptUrl?: string
  payee?: string
  payer?: string
  toAccountId?: string
  sharedExpenseId?: string
  tags?: string[]
}

export interface CreateBudgetForm {
  amount: number
  month: number
  year: number
}

export interface CreateGroupForm {
  name: string
  description?: string
  coverImageUrl?: string
  memberEmails?: string[]
  defaultSplitType?: SplitType
  memberSplitSettings?: Array<{
    email: string
    percentage?: number
    shares?: number
    exactAmount?: number
  }>
}

export interface CreateCategoryForm {
  name: string
  icon?: string
  color?: string
  type: TransactionType
  parentId?: string
}

export interface CreateTagForm {
  name: string
  color?: string
}

export interface CreateSharedExpenseForm {
  groupId: string
  amount: number
  description: string
  categoryId?: string
  receiptUrl?: string
  splitType: SplitType
  date?: string
  participants: Array<{
    userId: string
    amountOwed?: number
    percentage?: number
    shares?: number
  }>
}

export interface CreatePaymentForm {
  toUserId: string
  amount: number
  groupId?: string
}

// Loan types
export type LoanStatus = 'ACTIVE' | 'PAID' | 'CANCELLED'

export interface LoanPayment {
  id: string
  loanId: string
  amount: number
  paymentDate: string
  transactionId?: string
  transaction?: Transaction
  notes?: string
  createdAt: string
}

export interface Loan {
  id: string
  userId: string
  borrowerName: string
  borrowerUserId?: string
  originalAmount: number
  paidAmount: number
  currency: string
  loanDate: string
  notes?: string
  status: LoanStatus
  createdAt: string
  updatedAt: string
  user?: {
    name: string
    email: string
  }
  borrowerUser?: {
    name: string
    email: string
  }
  loanTransaction?: Transaction
  payments: LoanPayment[]
}

export interface LoansSummary {
  totalLoans: number
  activeLoans: number
  totalLent: number
  totalRecovered: number
  totalPending: number
  currency: string
}

export interface LoansByBorrower {
  borrowerName: string
  borrowerUserId?: string
  borrowerUser?: {
    id: string
    name: string
    email: string
  }
  totalLoans: number
  totalLent: number
  totalPaid: number
  totalPending: number
  loans: Loan[]
}

export interface CreateLoanForm {
  borrowerName: string
  borrowerUserId?: string
  amount: number
  accountId: string
  loanDate?: string
  notes?: string
}

export interface RecordLoanPaymentForm {
  amount: number
  accountId: string
  paymentDate?: string
  notes?: string
}
