import dynamic from 'next/dynamic'

/**
 * Loading skeleton for modals
 * Shows a centered spinner while the modal is loading
 */
const ModalSkeleton = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white rounded-lg p-8 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  </div>
)

/**
 * Lazy-loaded modal components
 * These modals are only loaded when the user triggers them (on click)
 * This reduces the initial bundle size since modals aren't needed on page load
 */

// Transaction form modal - uses default export
export const LazyTransactionFormModal = dynamic(
  () => import('@/components/TransactionFormModal'),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
)

// Create loan modal - uses default export
export const LazyCreateLoanModal = dynamic(
  () => import('@/components/CreateLoanModal'),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
)

// Delete account modal - uses default export
export const LazyDeleteAccountModal = dynamic(
  () => import('@/components/DeleteAccountModal'),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
)

// Record loan payment modal - uses default export
export const LazyRecordLoanPaymentModal = dynamic(
  () => import('@/components/RecordLoanPaymentModal'),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
)

// Mark expense paid modal - uses named export
export const LazyMarkExpensePaidModal = dynamic(
  () => import('@/components/MarkExpensePaidModal').then(mod => ({ default: mod.MarkExpensePaidModal })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
)

// Settle balance modal - uses named export
export const LazySettleBalanceModal = dynamic(
  () => import('@/components/SettleBalanceModal').then(mod => ({ default: mod.SettleBalanceModal })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
)

/**
 * Export all lazy modals as a single object for easier importing
 */
export const LazyModals = {
  TransactionFormModal: LazyTransactionFormModal,
  CreateLoanModal: LazyCreateLoanModal,
  DeleteAccountModal: LazyDeleteAccountModal,
  RecordLoanPaymentModal: LazyRecordLoanPaymentModal,
  MarkExpensePaidModal: LazyMarkExpensePaidModal,
  SettleBalanceModal: LazySettleBalanceModal,
}
