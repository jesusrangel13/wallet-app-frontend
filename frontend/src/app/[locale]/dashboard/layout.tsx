'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useSidebarStore } from '@/store/sidebarStore'
import { Sidebar } from '@/components/Sidebar'
import { DashboardLayoutContent } from '@/components/DashboardLayoutContent'

import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { VoiceButton } from '@/components/voice/VoiceButton'
import { safeGetItem } from '@/lib/storage'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, isHydrated } = useAuthStore()
  const { isCollapsed } = useSidebarStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Wait for zustand persist to rehydrate
    if (isHydrated) {
      const token = safeGetItem('token')
      if (!token && !isAuthenticated) {
        router.push('/login')
      }
      setIsLoading(false)
    }
  }, [isAuthenticated, isHydrated, router])

  useEffect(() => {
    if (isHydrated && !isLoading && !isAuthenticated) {
      const token = safeGetItem('token')
      if (!token) {
        router.push('/login')
      }
    }
  }, [isAuthenticated, isLoading, isHydrated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <Sidebar />

      {/* Layout Content with navbar and main content */}
      <ErrorBoundary>
        <DashboardLayoutContent isCollapsed={isCollapsed}>{children}</DashboardLayoutContent>
        <VoiceButton />
      </ErrorBoundary>
    </div>
  )
}
