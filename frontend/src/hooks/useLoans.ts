import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { loanAPI } from '@/lib/api'
import type { Loan, LoanPayment, LoansSummary, LoansByBorrower, LoanStatus, CreateLoanForm, RecordLoanPaymentForm } from '@/types'

/**
 * Hook para obtener todos los loans con caching automático
 * @param params - Parámetros opcionales (status, borrowerName, paginación)
 */
export function useLoans(params?: { status?: LoanStatus; borrowerName?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['loans', params],
    queryFn: async () => {
      const response = await loanAPI.getAll(params)
      return response.data.data as Loan[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook para obtener un loan específico
 */
export function useLoan(id: string | undefined) {
  return useQuery({
    queryKey: ['loan', id],
    queryFn: async () => {
      if (!id) return null
      const response = await loanAPI.getById(id)
      return response.data.data as Loan
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook para obtener resumen de loans
 */
export function useLoansSummary() {
  return useQuery({
    queryKey: ['loans-summary'],
    queryFn: async () => {
      const response = await loanAPI.getSummary()
      return response.data.data as LoansSummary
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook para obtener loans agrupados por borrower
 */
export function useLoansByBorrower() {
  return useQuery({
    queryKey: ['loans-by-borrower'],
    queryFn: async () => {
      const response = await loanAPI.getByBorrower()
      return response.data.data as LoansByBorrower[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook para crear un nuevo loan con optimistic update
 */
export function useCreateLoan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateLoanForm) => {
      const response = await loanAPI.create(data)
      return response.data.data as Loan
    },
    onMutate: async (newLoan) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['loans'] })

      // Snapshot the previous value
      const previousLoans = queryClient.getQueryData(['loans'])

      // Optimistically update to the new value
      queryClient.setQueryData(['loans'], (old: any) => {
        if (!old) return old

        // Create optimistic loan with temporary ID
        const optimisticLoan: Loan = {
          ...newLoan,
          id: `temp-${Date.now()}`,
          userId: 'current-user',
          borrowerName: newLoan.borrowerName,
          originalAmount: newLoan.amount,
          paidAmount: 0,
          currency: 'USD',
          loanDate: newLoan.loanDate || new Date().toISOString().split('T')[0],
          status: 'ACTIVE',
          payments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        // Add to the beginning of the list
        if (Array.isArray(old)) {
          return [optimisticLoan, ...old]
        }
        return old
      })

      return { previousLoans }
    },
    onError: (err, newLoan, context) => {
      // Rollback on error
      if (context?.previousLoans) {
        queryClient.setQueryData(['loans'], context.previousLoans)
      }
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['loans-summary'] })
      queryClient.invalidateQueries({ queryKey: ['loans-by-borrower'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}

/**
 * Hook para registrar un pago de loan con optimistic update
 */
export function useRecordLoanPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RecordLoanPaymentForm }) => {
      const response = await loanAPI.recordPayment(id, data)
      return { loanId: id, payment: response.data.data as LoanPayment }
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['loans'] })
      await queryClient.cancelQueries({ queryKey: ['loan', id] })

      // Snapshot the previous values
      const previousLoans = queryClient.getQueryData(['loans'])
      const previousLoan = queryClient.getQueryData(['loan', id])

      // Optimistically update the loan
      const optimisticPayment: LoanPayment = {
        id: `temp-payment-${Date.now()}`,
        loanId: id,
        amount: data.amount,
        paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
        notes: data.notes,
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData(['loans'], (old: any) => {
        if (!old || !Array.isArray(old)) return old
        return old.map((loan: Loan) => {
          if (loan.id === id) {
            const newPaidAmount = loan.paidAmount + data.amount
            const remainingAmount = loan.originalAmount - newPaidAmount
            return {
              ...loan,
              paidAmount: newPaidAmount,
              status: remainingAmount <= 0 ? 'PAID' : loan.status,
              payments: [...(loan.payments || []), optimisticPayment],
            }
          }
          return loan
        })
      })

      // Optimistically update the single loan cache
      queryClient.setQueryData(['loan', id], (old: any) => {
        if (!old) return old
        const newPaidAmount = old.paidAmount + data.amount
        const remainingAmount = old.originalAmount - newPaidAmount
        return {
          ...old,
          paidAmount: newPaidAmount,
          status: remainingAmount <= 0 ? 'PAID' : old.status,
          payments: [...(old.payments || []), optimisticPayment],
        }
      })

      return { previousLoans, previousLoan }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousLoans) {
        queryClient.setQueryData(['loans'], context.previousLoans)
      }
      if (context?.previousLoan) {
        queryClient.setQueryData(['loan', id], context.previousLoan)
      }
    },
    onSuccess: ({ loanId }) => {
      // Invalidate related queries to get fresh data
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['loan', loanId] })
      queryClient.invalidateQueries({ queryKey: ['loans-summary'] })
      queryClient.invalidateQueries({ queryKey: ['loans-by-borrower'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      // Invalidate transactions if the payment created a transaction
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

/**
 * Hook para cancelar un loan con optimistic update
 */
export function useCancelLoan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await loanAPI.cancel(id)
      return response.data.data as Loan
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['loans'] })
      await queryClient.cancelQueries({ queryKey: ['loan', id] })

      // Snapshot the previous values
      const previousLoans = queryClient.getQueryData(['loans'])
      const previousLoan = queryClient.getQueryData(['loan', id])

      // Optimistically update the loan status to CANCELLED
      queryClient.setQueryData(['loans'], (old: any) => {
        if (!old || !Array.isArray(old)) return old
        return old.map((loan: Loan) =>
          loan.id === id ? { ...loan, status: 'CANCELLED' as LoanStatus } : loan
        )
      })

      // Optimistically update the single loan cache
      queryClient.setQueryData(['loan', id], (old: any) => {
        if (!old) return old
        return { ...old, status: 'CANCELLED' as LoanStatus }
      })

      return { previousLoans, previousLoan }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousLoans) {
        queryClient.setQueryData(['loans'], context.previousLoans)
      }
      if (context?.previousLoan) {
        queryClient.setQueryData(['loan', id], context.previousLoan)
      }
    },
    onSuccess: (updatedLoan) => {
      // Update the loan in the cache
      queryClient.setQueryData(['loan', updatedLoan.id], updatedLoan)
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['loans-summary'] })
      queryClient.invalidateQueries({ queryKey: ['loans-by-borrower'] })
    },
  })
}

/**
 * Hook para eliminar un loan con optimistic update
 */
export function useDeleteLoan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await loanAPI.delete(id)
      return id
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['loans'] })

      // Snapshot the previous value
      const previousLoans = queryClient.getQueryData(['loans'])

      // Optimistically remove the loan
      queryClient.setQueryData(['loans'], (old: any) => {
        if (!old || !Array.isArray(old)) return old
        return old.filter((loan: Loan) => loan.id !== id)
      })

      return { previousLoans }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousLoans) {
        queryClient.setQueryData(['loans'], context.previousLoans)
      }
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['loans-summary'] })
      queryClient.invalidateQueries({ queryKey: ['loans-by-borrower'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}
