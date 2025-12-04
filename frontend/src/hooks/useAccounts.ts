import { useQuery } from '@tanstack/react-query'
import { accountAPI } from '@/lib/api'

/**
 * Hook para obtener todas las cuentas con caching automático
 * @param params - Parámetros de paginación opcionales
 */
export function useAccounts(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['accounts', params],
    queryFn: async () => {
      const response = await accountAPI.getAll(params)
      // Transformar la respuesta para mantener compatibilidad con código existente
      // Si no se especifican params de paginación, obtener todas las cuentas
      if (!params?.page && !params?.limit) {
        // Sin paginación, devolver directamente el array de data
        return {
          ...response,
          data: response.data.data.data, // Extraer el array de cuentas
        }
      }
      // Con paginación, devolver la estructura completa
      return response
    },
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
