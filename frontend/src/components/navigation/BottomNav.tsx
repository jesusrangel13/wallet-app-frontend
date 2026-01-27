'use client'

import { Home, CreditCard, Plus, TrendingUp, MoreHorizontal, Mic, Loader2 } from 'lucide-react'
import { usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
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

    // Voice State
    const [isVoiceActive, setIsVoiceActive] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [transcription, setTranscription] = useState('')

    useEffect(() => {
        const handleVoiceStatus = (e: CustomEvent) => {
            setIsVoiceActive(e.detail.isListening);
            if (!e.detail.isListening) setTranscription('');
        }

        const handleProcessingStatus = (e: CustomEvent) => {
            setIsProcessing(e.detail.isProcessing);
        }

        const handleTranscript = (e: CustomEvent) => {
            setTranscription(e.detail.text || '');
        }

        window.addEventListener('voice-status-change', handleVoiceStatus as EventListener);
        window.addEventListener('voice-processing-change', handleProcessingStatus as EventListener);
        window.addEventListener('voice-input-transcript', handleTranscript as EventListener);

        return () => {
            window.removeEventListener('voice-status-change', handleVoiceStatus as EventListener);
            window.removeEventListener('voice-processing-change', handleProcessingStatus as EventListener);
            window.removeEventListener('voice-input-transcript', handleTranscript as EventListener);
        }
    }, [])

    const isActive = (path: string | null) => {
        if (!path) return false
        const fullPath = `/${locale}/${path}`
        if (path === 'dashboard') return pathname === fullPath
        return pathname.startsWith(fullPath)
    }

    const handleAction = (action?: 'quickAdd' | 'more') => {
        if (action === 'quickAdd') {
            // If processing, ignore everything
            if (isProcessing) return;

            // If voice is active, clicking just stops it (don't open menu)
            if (isVoiceActive) {
                window.dispatchEvent(new CustomEvent('trigger-voice-input')); // Toggle off
                return;
            }
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
                                <div key={item.labelKey} className="relative flex flex-col items-center">
                                    {/* Transcription Floating Bubble */}
                                    <AnimatePresence>
                                        {isVoiceActive && transcription && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                                className="absolute -top-32 w-64 p-3 bg-foreground/90 text-background rounded-2xl shadow-xl backdrop-blur-md text-center z-50 pointer-events-none"
                                            >
                                                <p className="text-sm font-medium">{transcription}</p>
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 border-8 border-transparent border-t-foreground/90" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        onMouseDown={(e) => {
                                            // PRIORITY: If processing, BLOCK EVERYTHING
                                            if (isProcessing) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                return;
                                            }

                                            // PRIORITY: If voice is active, any interaction STOPS it immediately
                                            if (isVoiceActive) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                window.dispatchEvent(new CustomEvent('trigger-voice-input', { detail: { forceStop: true } }));
                                                return;
                                            }

                                            // Start timer for long press
                                            const timer = setTimeout(() => {
                                                window.dispatchEvent(new CustomEvent('trigger-voice-input'));
                                                if (navigator.vibrate) navigator.vibrate(50);
                                            }, 500);
                                            (e.target as any).dataset.longPressTimer = timer;
                                        }}
                                        onMouseUp={(e) => {
                                            if (isProcessing || isVoiceActive) return;
                                            const timer = (e.target as any).dataset.longPressTimer;
                                            if (timer) clearTimeout(Number(timer));
                                        }}
                                        onTouchStart={(e) => {
                                            // PRIORITY: If processing, BLOCK EVERYTHING
                                            if (isProcessing) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                return;
                                            }

                                            // PRIORITY: Touch also stops immediately
                                            if (isVoiceActive) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                window.dispatchEvent(new CustomEvent('trigger-voice-input', { detail: { forceStop: true } }));
                                                return;
                                            }

                                            const timer = setTimeout(() => {
                                                window.dispatchEvent(new CustomEvent('trigger-voice-input'));
                                                if (navigator.vibrate) navigator.vibrate(50);
                                            }, 500);
                                            (e.target as any).dataset.longPressTimer = timer;
                                        }}
                                        onTouchEnd={(e) => {
                                            if (isProcessing || isVoiceActive) return;
                                            const timer = (e.target as any).dataset.longPressTimer;
                                            if (timer) clearTimeout(Number(timer));
                                        }}
                                        onClick={(e) => {
                                            // Logic handled in MouseDown/TouchStart for stopping
                                            if (isProcessing || isVoiceActive) {
                                                e.preventDefault();
                                                return;
                                            }
                                            handleAction(item.action);
                                        }}
                                        className="relative -top-4 touch-none"
                                        aria-label={isVoiceActive ? "Listening..." : isProcessing ? "Processing..." : t('bottomNav.add')}
                                        disabled={isProcessing}
                                    >
                                        <motion.div
                                            animate={{
                                                scale: (isVoiceActive || isProcessing) ? 1.2 : 1,
                                                backgroundColor: isVoiceActive
                                                    ? 'hsl(var(--destructive))'
                                                    : isProcessing
                                                        ? 'hsl(var(--muted-foreground))'
                                                        : 'hsl(var(--primary))',
                                                boxShadow: isVoiceActive ? '0 0 20px hsl(var(--destructive))' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                            }}
                                            className="w-14 h-14 rounded-full text-primary-foreground flex items-center justify-center shadow-lg"
                                        >
                                            <AnimatePresence mode="wait">
                                                {isProcessing ? (
                                                    <motion.div
                                                        key="loader"
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0, opacity: 0 }}
                                                    >
                                                        <Loader2 className="w-7 h-7 animate-spin" />
                                                    </motion.div>
                                                ) : isVoiceActive ? (
                                                    <motion.div
                                                        key="mic"
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0, opacity: 0 }}
                                                    >
                                                        <Mic className="w-7 h-7 animate-pulse" />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="plus"
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0, opacity: 0 }}
                                                    >
                                                        <Plus className="w-7 h-7" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    </button>
                                </div>
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
