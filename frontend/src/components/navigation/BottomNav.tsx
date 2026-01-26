'use client'

import { Home, CreditCard, Plus, TrendingUp, MoreHorizontal } from 'lucide-react'
import { usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { QuickAddModal } from './QuickAddModal'
import { MoreMenuModal } from './MoreMenuModal'

interface NavItem {
    icon: React.ComponentType<{ className?: string }>
    labelKey: string
    path: string | null
    isAction?: boolean
    action?: 'quickAdd' | 'more'
}

const baseNavItems: NavItem[] = [
    { icon: Home, labelKey: 'home', path: 'dashboard' },
    { icon: TrendingUp, labelKey: 'transactions', path: 'dashboard/transactions' },
    { icon: Plus, labelKey: 'add', path: null, isAction: true, action: 'quickAdd' },
    { icon: CreditCard, labelKey: 'accounts', path: 'dashboard/accounts' },
    { icon: MoreHorizontal, labelKey: 'more', path: null, isAction: true, action: 'more' },
]

export function BottomNav() {
    const t = useTranslations('nav')
    const pathname = usePathname()
    const params = useParams()
    const locale = params.locale as string
    const [showQuickAdd, setShowQuickAdd] = useState(false)
    const [showMoreMenu, setShowMoreMenu] = useState(false)

    const isActive = (path: string | null) => {
        if (!path) return false
        const fullPath = `/${locale}/${path}`
        if (path === 'dashboard') return pathname === fullPath
        return pathname.startsWith(fullPath)
    }

    const handleAction = (action?: 'quickAdd' | 'more') => {
        if (action === 'quickAdd') {
            setShowQuickAdd(true)
        } else if (action === 'more') {
            setShowMoreMenu(true)
        }
    }

    return (
        <>
            {/* Bottom Navigation - Solo visible en mobile */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb"
                aria-label="Navegación principal"
            >
                <div className="flex items-center justify-around h-16 px-2">
                    {baseNavItems.map((item) => {
                        // Botón central de agregar (FAB style)
                        if (item.isAction && item.action === 'quickAdd') {
                            return (
                                <button
                                    key={item.labelKey}
                                    onClick={() => handleAction(item.action)}
                                    className="relative -top-4"
                                    aria-label={t('bottomNav.add')}
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30"
                                    >
                                        <Plus className="w-7 h-7" />
                                    </motion.div>
                                </button>
                            )
                        }

                        // Botón de "Más" (More menu)
                        if (item.isAction && item.action === 'more') {
                            return (
                                <button
                                    key={item.labelKey}
                                    onClick={() => handleAction(item.action)}
                                    className="flex flex-col items-center justify-center flex-1 py-2"
                                    aria-label={t('bottomNav.more')}
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex flex-col items-center"
                                    >
                                        <item.icon className="w-6 h-6 text-muted-foreground" />
                                        <span className="text-xs mt-1 text-muted-foreground">
                                            {t(`bottomNav.${item.labelKey}` as any)}
                                        </span>
                                    </motion.div>
                                </button>
                            )
                        }

                        const active = isActive(item.path)

                        return (
                            <Link
                                key={item.labelKey}
                                href={`/${locale}/${item.path}`}
                                className="flex flex-col items-center justify-center flex-1 py-2 relative"
                                aria-current={active ? 'page' : undefined}
                            >
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: active ? 1.1 : 1,
                                        color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
                                    }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <item.icon className="w-6 h-6" />
                                </motion.div>
                                <span className={`text-xs mt-1 ${active ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                    {t(`bottomNav.${item.labelKey}` as any)}
                                </span>

                                {/* Indicador activo */}
                                {active && (
                                    <motion.div
                                        layoutId="bottomNavIndicator"
                                        className="absolute -top-0.5 w-12 h-1 bg-primary rounded-full"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* Modals */}
            <QuickAddModal
                isOpen={showQuickAdd}
                onClose={() => setShowQuickAdd(false)}
            />
            <MoreMenuModal
                isOpen={showMoreMenu}
                onClose={() => setShowMoreMenu(false)}
            />
        </>
    )
}
