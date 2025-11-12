import { useQuery } from '@tanstack/react-query'
import { accountAPI } from '@/lib/api'

/**
 * Hook para obtener todas las cuentas con caching automático
 */
export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountAPI.getAll(),
    staleTime: 10 * 60 * 1000, // 10 minutes - accounts don't change often
  })
}

/**
 * Hook para obtener una cuenta específica
 */
export function useAccount(id: string) {
  return useQuery({
    queryKey: ['account', id],
    queryFn: () => accountAPI.getById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook para obtener el balance total
 */
export function useTotalBalance() {
  return useQuery({
    queryKey: ['total-balance'],
    queryFn: () => accountAPI.getTotalBalance(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
