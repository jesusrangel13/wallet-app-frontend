import { useQuery } from '@tanstack/react-query'
import { transactionAPI } from '@/lib/api'

export const usePayees = (search?: string) => {
  return useQuery({
    queryKey: ['payees', search],
    queryFn: async () => {
      const response = await transactionAPI.getUniquePayees(search)
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    enabled: search !== undefined && search.trim().length > 0, // Solo ejecutar si hay búsqueda con contenido
  })
}
