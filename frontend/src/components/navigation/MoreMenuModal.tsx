'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, HandCoins, Users, Upload, Calendar } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'

interface MoreMenuModalProps {
    isOpen: boolean
    onClose: () => void
}

interface MenuItem {
    icon: React.ComponentType<{ className?: string }>
    labelKey: string
    color: string
    path: string
}

const moreMenuItems: MenuItem[] = [
    { icon: HandCoins, labelKey: 'loans', color: 'bg-amber-500', path: 'dashboard/loans' },
    { icon: Users, labelKey: 'groups', color: 'bg-violet-500', path: 'dashboard/groups' },
    { icon: Upload, labelKey: 'import', color: 'bg-blue-500', path: 'dashboard/import' },
    { icon: Calendar, labelKey: 'annualView', color: 'bg-green-500', path: 'dashboard/annual' },
]

export function MoreMenuModal({ isOpen, onClose }: MoreMenuModalProps) {
    const t = useTranslations('nav')
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string

    const handleMenuItemClick = (path: string) => {
        // Close modal first
        onClose()

        // Navigate after a small delay for smooth transition
        setTimeout(() => {
            router.push(`/${locale}/${path}`)
        }, 150)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 md:hidden"
                        onClick={onClose}
                    />

                    {/* Modal desde abajo */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6 pb-safe md:hidden"
                    >
                        {/* Handle */}
                        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-foreground">{t('moreMenu.title')}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                                aria-label="Cerrar"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Menu Items Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {moreMenuItems.map((item, index) => (
                                <motion.button
                                    key={item.path}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleMenuItemClick(item.path)}
                                    className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-muted/50 hover:bg-muted transition-colors"
                                >
                                    <div className={`p-4 rounded-full ${item.color} text-white`}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <span className="font-medium text-foreground">{t(`moreMenu.${item.labelKey}` as any)}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
