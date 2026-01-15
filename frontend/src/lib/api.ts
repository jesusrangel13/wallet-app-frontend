/**
 * API Module - Re-exports from modular services
 *
 * This file maintains backward compatibility by re-exporting all API services
 * from their respective modular service files in /services directory.
 *
 * All API implementations have been moved to:
 * - /services/api-client.ts (shared axios instance)
 * - /services/auth.service.ts
 * - /services/user.service.ts
 * - /services/account.service.ts
 * - /services/transaction.service.ts
 * - /services/budget.service.ts
 * - /services/group.service.ts
 * - /services/shared-expense.service.ts
 * - /services/category.service.ts
 * - /services/tag.service.ts
 * - /services/import.service.ts
 * - /services/dashboard.service.ts
 * - /services/notification.service.ts
 * - /services/dashboard-preference.service.ts
 * - /services/loan.service.ts
 */

// Export the shared API client as default for backward compatibility
export { apiClient as default } from '@/services/api-client'

// Re-export all API services
export { authAPI } from '@/services/auth.service'
export { userAPI } from '@/services/user.service'
export { accountAPI } from '@/services/account.service'
export { transactionAPI } from '@/services/transaction.service'
export { budgetAPI } from '@/services/budget.service'
export { groupAPI } from '@/services/group.service'
export { sharedExpenseAPI } from '@/services/shared-expense.service'
export { categoryAPI, categoryTemplateAPI } from '@/services/category.service'
export { tagAPI } from '@/services/tag.service'
export { importAPI } from '@/services/import.service'
export { dashboardAPI } from '@/services/dashboard.service'
export { notificationAPI } from '@/services/notification.service'
export { dashboardPreferenceAPI } from '@/services/dashboard-preference.service'
export { loanAPI } from '@/services/loan.service'
