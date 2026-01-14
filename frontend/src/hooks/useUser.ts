import { useQuery } from '@tanstack/react-query'
import { userAPI } from '@/lib/api'

/**
 * Hook para obtener estadísticas del usuario
 */
export function useUserStats() {
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await userAPI.getStats()
      return response.data.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
