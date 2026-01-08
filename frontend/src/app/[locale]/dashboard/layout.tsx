'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useSidebarStore } from '@/store/sidebarStore'
import { Sidebar } from '@/components/Sidebar'
import { DashboardLayoutContent } from '@/components/DashboardLayoutContent'

import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { VoiceButton } from '@/components/voice/VoiceButton'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { isCollapsed } = useSidebarStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Wait for zustand persist to rehydrate
    const token = localStorage.getItem('token')
    if (!token && !isAuthenticated) {
      router.push('/login')
    }
    setIsLoading(false)
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
      }
    }
  }, [isAuthenticated, isLoading, router])

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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
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
