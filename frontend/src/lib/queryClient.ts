import { QueryClient } from '@tanstack/react-query'

/**
 * Configure React Query with optimal settings for the Finance App
 * - staleTime: 5 minutes - data considered fresh for 5 minutes
 * - gcTime (cacheTime): 10 minutes - keep unused queries in cache for 10 minutes
 * - retry: 1 - retry failed requests once automatically
 * - refetchOnWindowFocus: true - refetch stale data when window regains focus
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: true, // Enable smart refetch on window focus
    },
  },
})
