import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sharedExpenseAPI } from '@/lib/api'
import type { SharedExpense, Payment, CreateSharedExpenseForm, CreatePaymentForm } from '@/types'

/**
 * Hook para obtener shared expenses con caching automático
 * @param groupId - ID del grupo (opcional)
 */
export function useSharedExpenses(groupId?: string) {
  return useQuery({
    queryKey: ['shared-expenses', groupId],
    queryFn: async () => {
      const response = await sharedExpenseAPI.getAll(groupId)
      return response.data.data as SharedExpense[]
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - shared expenses should be relatively fresh
  })
}

/**
 * Hook para obtener un shared expense específico
 */
export function useSharedExpense(id: string | undefined) {
  return useQuery({
    queryKey: ['shared-expense', id],
    queryFn: async () => {
      if (!id) return null
      const response = await sharedExpenseAPI.getById(id)
      return response.data.data as SharedExpense
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook para obtener historial de pagos
 */
export function usePaymentHistory(groupId?: string) {
  return useQuery({
    queryKey: ['payment-history', groupId],
    queryFn: async () => {
      const response = await sharedExpenseAPI.getPaymentHistory(groupId)
      return response.data.data as Payment[]
    },
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook para obtener deudas simplificadas de un grupo
 */
export function useSimplifiedDebts(groupId: string | undefined) {
  return useQuery({
    queryKey: ['simplified-debts', groupId],
    queryFn: async () => {
      if (!groupId) return []
      const response = await sharedExpenseAPI.getSimplifiedDebts(groupId)
      return response.data.data as Array<{
        from: { id: string; name: string }
        to: { id: string; name: string }
        amount: number
      }>
    },
    enabled: !!groupId,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook para crear un shared expense con optimistic update
 */
export function useCreateSharedExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSharedExpenseForm) => {
      const response = await sharedExpenseAPI.create(data)
      return response.data.data as SharedExpense
    },
    onMutate: async (newExpense) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shared-expenses'] })

      // Snapshot the previous value
      const previousExpenses = queryClient.getQueryData(['shared-expenses'])

      // Optimistically update to the new value
      queryClient.setQueryData(['shared-expenses', newExpense.groupId], (old: any) => {
        if (!old || !Array.isArray(old)) return old

        // Create optimistic expense with temporary ID
        const optimisticExpense: SharedExpense = {
          ...newExpense,
          id: `temp-${Date.now()}`,
          participants: newExpense.participants || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any

        return [optimisticExpense, ...old]
      })

      return { previousExpenses }
    },
    onError: (err, newExpense, context) => {
      // Rollback on error
      if (context?.previousExpenses) {
        queryClient.setQueryData(['shared-expenses'], context.previousExpenses)
      }
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['shared-expenses'] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['group-balances'] })
      queryClient.invalidateQueries({ queryKey: ['simplified-debts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}

/**
 * Hook para actualizar un shared expense con optimistic update
 */
export function useUpdateSharedExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateSharedExpenseForm> }) => {
      const response = await sharedExpenseAPI.update(id, data)
      return response.data.data as SharedExpense
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shared-expenses'] })
      await queryClient.cancelQueries({ queryKey: ['shared-expense', id] })

      // Snapshot the previous values
      const previousExpenses = queryClient.getQueryData(['shared-expenses'])
      const previousExpense = queryClient.getQueryData(['shared-expense', id])

      // Optimistically update the expense in the list
      queryClient.setQueryData(['shared-expenses'], (old: any) => {
        if (!old || !Array.isArray(old)) return old
        return old.map((expense: SharedExpense) =>
          expense.id === id ? { ...expense, ...data } : expense
        )
      })

      // Optimistically update the single expense cache
      queryClient.setQueryData(['shared-expense', id], (old: any) => {
        if (!old) return old
        return { ...old, ...data }
      })

      return { previousExpenses, previousExpense }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousExpenses) {
        queryClient.setQueryData(['shared-expenses'], context.previousExpenses)
      }
      if (context?.previousExpense) {
        queryClient.setQueryData(['shared-expense', id], context.previousExpense)
      }
    },
    onSuccess: (updatedExpense) => {
      // Update the expense in the cache
      queryClient.setQueryData(['shared-expense', updatedExpense.id], updatedExpense)
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['shared-expenses'] })
      queryClient.invalidateQueries({ queryKey: ['group-balances'] })
      queryClient.invalidateQueries({ queryKey: ['simplified-debts'] })
    },
  })
}

/**
 * Hook para eliminar un shared expense con optimistic update
 */
export function useDeleteSharedExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await sharedExpenseAPI.delete(id)
      return id
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shared-expenses'] })

      // Snapshot the previous value
      const previousExpenses = queryClient.getQueryData(['shared-expenses'])

      // Optimistically remove the expense
      queryClient.setQueryData(['shared-expenses'], (old: any) => {
        if (!old || !Array.isArray(old)) return old
        return old.filter((expense: SharedExpense) => expense.id !== id)
      })

      return { previousExpenses }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousExpenses) {
        queryClient.setQueryData(['shared-expenses'], context.previousExpenses)
      }
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['shared-expenses'] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['group-balances'] })
      queryClient.invalidateQueries({ queryKey: ['simplified-debts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}

/**
 * Hook para marcar participante como pagado con optimistic update
 */
export function useMarkParticipantAsPaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ expenseId, participantUserId, accountId }: { expenseId: string; participantUserId: string; accountId?: string }) => {
      const response = await sharedExpenseAPI.markParticipantAsPaid(expenseId, participantUserId, accountId)
      return response.data
    },
    onMutate: async ({ expenseId, participantUserId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shared-expenses'] })
      await queryClient.cancelQueries({ queryKey: ['shared-expense', expenseId] })

      // Snapshot the previous values
      const previousExpenses = queryClient.getQueryData(['shared-expenses'])
      const previousExpense = queryClient.getQueryData(['shared-expense', expenseId])

      // Optimistically mark participant as paid
      const updateParticipants = (expense: SharedExpense) => ({
        ...expense,
        participants: expense.participants?.map((p: any) =>
          p.userId === participantUserId
            ? { ...p, isPaid: true, paidDate: new Date().toISOString() }
            : p
        ),
      })

      queryClient.setQueryData(['shared-expenses'], (old: any) => {
        if (!old || !Array.isArray(old)) return old
        return old.map((expense: SharedExpense) =>
          expense.id === expenseId ? updateParticipants(expense) : expense
        )
      })

      queryClient.setQueryData(['shared-expense', expenseId], (old: any) => {
        if (!old) return old
        return updateParticipants(old)
      })

      return { previousExpenses, previousExpense }
    },
    onError: (err, { expenseId }, context) => {
      // Rollback on error
      if (context?.previousExpenses) {
        queryClient.setQueryData(['shared-expenses'], context.previousExpenses)
      }
      if (context?.previousExpense) {
        queryClient.setQueryData(['shared-expense', expenseId], context.previousExpense)
      }
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['shared-expenses'] })
      queryClient.invalidateQueries({ queryKey: ['group-balances'] })
      queryClient.invalidateQueries({ queryKey: ['simplified-debts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

/**
 * Hook para marcar participante como no pagado con optimistic update
 */
export function useMarkParticipantAsUnpaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ expenseId, participantUserId }: { expenseId: string; participantUserId: string }) => {
      const response = await sharedExpenseAPI.markParticipantAsUnpaid(expenseId, participantUserId)
      return response.data
    },
    onMutate: async ({ expenseId, participantUserId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shared-expenses'] })
      await queryClient.cancelQueries({ queryKey: ['shared-expense', expenseId] })

      // Snapshot the previous values
      const previousExpenses = queryClient.getQueryData(['shared-expenses'])
      const previousExpense = queryClient.getQueryData(['shared-expense', expenseId])

      // Optimistically mark participant as unpaid
      const updateParticipants = (expense: SharedExpense) => ({
        ...expense,
        participants: expense.participants?.map((p: any) =>
          p.userId === participantUserId
            ? { ...p, isPaid: false, paidDate: null }
            : p
        ),
      })

      queryClient.setQueryData(['shared-expenses'], (old: any) => {
        if (!old || !Array.isArray(old)) return old
        return old.map((expense: SharedExpense) =>
          expense.id === expenseId ? updateParticipants(expense) : expense
        )
      })

      queryClient.setQueryData(['shared-expense', expenseId], (old: any) => {
        if (!old) return old
        return updateParticipants(old)
      })

      return { previousExpenses, previousExpense }
    },
    onError: (err, { expenseId }, context) => {
      // Rollback on error
      if (context?.previousExpenses) {
        queryClient.setQueryData(['shared-expenses'], context.previousExpenses)
      }
      if (context?.previousExpense) {
        queryClient.setQueryData(['shared-expense', expenseId], context.previousExpense)
      }
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['shared-expenses'] })
      queryClient.invalidateQueries({ queryKey: ['group-balances'] })
      queryClient.invalidateQueries({ queryKey: ['simplified-debts'] })
    },
  })
}

/**
 * Hook para liquidar un pago con optimistic update
 */
export function useSettlePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePaymentForm) => {
      const response = await sharedExpenseAPI.settlePayment(data)
      return response.data.data as Payment
    },
    onMutate: async (newPayment) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['payment-history'] })

      // Snapshot the previous value
      const previousPayments = queryClient.getQueryData(['payment-history'])

      // Optimistically add the payment
      queryClient.setQueryData(['payment-history', newPayment.groupId], (old: any) => {
        if (!old || !Array.isArray(old)) return old

        const optimisticPayment: Payment = {
          ...newPayment,
          id: `temp-${Date.now()}`,
          createdAt: new Date().toISOString(),
        } as any

        return [optimisticPayment, ...old]
      })

      return { previousPayments }
    },
    onError: (err, newPayment, context) => {
      // Rollback on error
      if (context?.previousPayments) {
        queryClient.setQueryData(['payment-history'], context.previousPayments)
      }
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['payment-history'] })
      queryClient.invalidateQueries({ queryKey: ['shared-expenses'] })
      queryClient.invalidateQueries({ queryKey: ['group-balances'] })
      queryClient.invalidateQueries({ queryKey: ['simplified-debts'] })
    },
  })
}
