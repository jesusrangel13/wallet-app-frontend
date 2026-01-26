'use client'

import { usePathname } from 'next/navigation'
import { useSidebarStore } from '@/store/sidebarStore'
import { Wallet } from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'
import { ThemeToggle } from '@/components/ThemeToggle'
import { UserMenu } from '@/components/UserMenu'
import { AddWidgetButton } from '@/components/AddWidgetButton'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface DashboardLayoutContentProps {
  children: React.ReactNode
  isCollapsed?: boolean
}

export function DashboardLayoutContent({ children, isCollapsed }: DashboardLayoutContentProps) {
  const t = useTranslations('common')
  const pathname = usePathname()
  const sidebarState = useSidebarStore()
  const collapsed = isCollapsed ?? sidebarState.isCollapsed
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if we're on the main dashboard page
  // Support both root /dashboard and localized /en/dashboard, /es/dashboard etc.
  const isMainDashboard = pathname === '/dashboard' || /^\/[a-z]{2}\/dashboard$/.test(pathname || '')

  return (
    <div className={`flex flex-col flex-1 w-full transition-all duration-300 ${collapsed ? 'md:ml-16' : 'md:ml-64'}`}>{/* Content takes remaining width */}
      {/* Top Navigation */}
      <nav className="bg-card shadow-sm border-b border-border sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 md:hidden">
              <Wallet className="h-8 w-8 text-primary" />
              <span className="text-lg font-bold text-foreground">{t('app.name')}</span>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2 md:gap-3">
              {/* Add Widget button - only show on main dashboard */}
              {isMainDashboard && (
                <div className="hidden sm:block">
                  <AddWidgetButton />
                </div>
              )}
              <NotificationBell />
              <ThemeToggle size="md" />
              <div className="border-l border-border h-6 hidden md:block" />
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        <div className="mx-auto max-w-full">{children}</div>
      </main>
    </div>
  )
}
