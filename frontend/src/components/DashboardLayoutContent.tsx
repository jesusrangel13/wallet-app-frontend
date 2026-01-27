'use client'

import { usePathname } from 'next/navigation'
import { useSidebarStore } from '@/store/sidebarStore'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface DashboardLayoutContentProps {
  children: React.ReactNode
  isCollapsed?: boolean
}

import { HeaderGlass } from './header/HeaderGlass'

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
  const isMainDashboard = pathname === '/dashboard' || /^\/[a-z]{2}\/dashboard$/.test(pathname || '')

  // Fixed Floating Layout margins
  // Sidebar has ml-4 (1rem) + width
  // Collapsed: w-20 (5rem) -> Total 6rem (ml-24)
  // Expanded: w-72 (18rem) -> Total 19rem (ml-[19rem])
  // Adding a bit more spacing for content: ml-28 (7rem) and ml-[20rem]
  const marginClass = collapsed ? 'md:ml-28' : 'md:ml-[20rem]'

  return (
    <div className={`flex flex-col flex-1 w-full transition-all duration-300 ${marginClass}`}>{/* Content takes remaining width */}
      {/* Dynamic Header */}
      {mounted && <HeaderGlass />}

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        <div className="mx-auto max-w-full">{children}</div>
      </main>
    </div>
  )
}
