'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Wallet, LogOut } from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'
import { Sidebar } from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, user, clearAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Wait for zustand persist to rehydrate
    const token = localStorage.getItem('token')
    if (!token && !isAuthenticated) {
      router.push('/login')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
      }
    }
  }, [isAuthenticated, isLoading, router])

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex flex-col md:pl-64">
        {/* Top Navigation */}
        <nav className="bg-white shadow-sm border-b sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2 md:hidden">
                <Wallet className="h-8 w-8 text-blue-600" />
                <span className="text-lg font-bold text-gray-900">FinanceApp</span>
              </div>
              <div className="hidden md:flex items-center">
                <span className="text-sm text-gray-600">
                  Welcome, <span className="font-semibold">{user?.name}</span>
                </span>
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          <div className="mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
