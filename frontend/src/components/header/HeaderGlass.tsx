'use client'

import { NotificationBell } from '@/components/NotificationBell'
import { ThemeToggle } from '@/components/ThemeToggle'
import { UserMenu } from '@/components/UserMenu'
import { AddWidgetButton } from '@/components/AddWidgetButton'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

export function HeaderGlass() {
    const pathname = usePathname()
    const isMainDashboard = pathname === '/dashboard' || /^\/[a-z]{2}\/dashboard$/.test(pathname || '')

    // Format breadcrumbs from pathname for demo
    const segments = pathname.split('/').filter(Boolean).slice(1) // remove locale

    return (
        <header className="sticky top-0 z-30 w-full bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
            <div className="px-6 h-16 flex items-center justify-between">
                {/* Breadcrumbs / Title Context */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Home className="w-4 h-4" />
                    {segments.map((segment, index) => (
                        <div key={segment} className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 opacity-50" />
                            <span className={`capitalize ${index === segments.length - 1 ? 'text-foreground font-medium' : ''}`}>
                                {segment}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    {isMainDashboard && (
                        <div className="hidden sm:block">
                            <AddWidgetButton />
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <ThemeToggle size="sm" />
                        <UserMenu />
                    </div>
                </div>
            </div>
        </header>
    )
}
