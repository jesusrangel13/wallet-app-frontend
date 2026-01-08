'use client'

import { usePathname } from 'next/navigation'
import { useSidebarStore } from '@/store/sidebarStore'
import { useAuthStore } from '@/store/authStore'
import { Wallet, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { NotificationBell } from '@/components/NotificationBell'
import { AddWidgetButton } from '@/components/AddWidgetButton'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface DashboardLayoutContentProps {
  children: React.ReactNode
  isCollapsed?: boolean
}

export function DashboardLayoutContent({ children, isCollapsed }: DashboardLayoutContentProps) {
  const t = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  const sidebarState = useSidebarStore()
  const collapsed = isCollapsed ?? sidebarState.isCollapsed
  const { user, clearAuth } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if we're on the main dashboard page
  // Support both root /dashboard and localized /en/dashboard, /es/dashboard etc.
  const isMainDashboard = pathname === '/dashboard' || /^\/[a-z]{2}\/dashboard$/.test(pathname || '')

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  return (
    <div className={`flex flex-col flex-1 w-full transition-all duration-300 ${collapsed ? 'md:ml-16' : 'md:ml-64'}`}>{/* Content takes remaining width */}
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 md:hidden">
              <Wallet className="h-8 w-8 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">{t('app.name')}</span>
            </div>
            <div className="hidden md:flex items-center">
              <span className="text-sm text-gray-600">
                {t('welcome')}<span className="font-semibold">{user?.name}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <NotificationBell />
              {/* Add Widget button - only show on main dashboard */}
              {isMainDashboard && (
                <div className="hidden sm:block border-l border-gray-200 pl-2 md:pl-4">
                  <AddWidgetButton />
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto">{children}</div>
      </main>
    </div>
  )
}
