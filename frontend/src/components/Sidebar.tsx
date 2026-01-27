'use client'

import { useSidebarStore } from '@/store/sidebarStore'
import { useEffect, useState } from 'react'
import { SidebarClassic } from './sidebar/SidebarClassic'
import { SidebarFloating } from './sidebar/SidebarFloating'
import { Menu, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'

export function Sidebar() {
  const t = useTranslations('nav')
  const { isMobileOpen, setMobileOpen } = useSidebarStore()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname, setMobileOpen])

  if (!mounted) return null

  return (
    <>
      {/* Mobile Menu Button - Hidden since we now have bottom nav on mobile */}

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar (Classic Style) - Only visible if isMobileOpen is true */}
      <div className={`md:hidden fixed inset-y-0 left-0 z-40 bg-card w-64 transform transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarClassic />
      </div>

      {/* Desktop Sidebar - Always Floating Glass */}
      <div className="hidden md:block">
        <SidebarFloating />
      </div>
    </>
  )
}
