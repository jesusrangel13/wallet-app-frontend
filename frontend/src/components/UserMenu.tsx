'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useTranslations } from 'next-intl'

export function UserMenu() {
    const t = useTranslations('common')
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string
    const { user, clearAuth } = useAuthStore()
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = () => {
        clearAuth()
        router.push(`/${locale}/login`)
        setIsOpen(false)
    }

    const handleSettings = () => {
        router.push(`/${locale}/dashboard/settings`)
        setIsOpen(false)
    }

    // Get user initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const initials = user?.name ? getInitials(user.name) : 'U'

    return (
        <div className="relative" ref={menuRef}>
            {/* Avatar Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
                aria-label="User menu"
                aria-expanded={isOpen}
            >
                {/* Avatar Circle */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                    {initials}
                </div>

                {/* Name and chevron - hidden on mobile */}
                <div className="hidden md:flex items-center gap-1">
                    <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                        {user?.name || 'User'}
                    </span>
                    <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-64 bg-popover rounded-lg shadow-lg border border-border z-50 overflow-hidden"
                    >
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-border bg-muted/30">
                            <p className="text-sm font-semibold text-foreground truncate">
                                {user?.name || 'User'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {user?.email || 'user@example.com'}
                            </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                            <button
                                onClick={handleSettings}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                            >
                                <Settings className="w-4 h-4 text-muted-foreground" />
                                <span>{t('settings')}</span>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>{t('logout')}</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
