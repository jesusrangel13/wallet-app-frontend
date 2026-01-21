'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode, useEffect } from 'react'
import { queryClient } from '@/lib/queryClient'
import { runStorageMigrations, logStorageStatus } from '@/lib/storage'

export function QueryProvider({ children }: { children: ReactNode }) {
  // OPT-10: Initialize storage migrations on app startup
  useEffect(() => {
    runStorageMigrations()
    // Log storage status in development for monitoring
    if (process.env.NODE_ENV === 'development') {
      logStorageStatus()
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
