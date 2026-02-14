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
            {/* Bottom Navigation - Mobile Only */}
            <nav
                className="md:hidden fixed bottom-6 left-4 right-4 z-50 
                           bg-white/60 dark:bg-black/40 backdrop-blur-3xl 
                           border border-white/40 dark:border-white/10
                           ring-1 ring-white/30 dark:ring-white/5
                           shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]
                           rounded-[2.5rem] safe-area-pb"
                aria-label="Navegación principal"
            >
                <div className="flex items-center justify-around h-20 px-2">
                    {baseNavItems.map((item) => {
                        // Central Button (Quick Add) - Floating Gradient
                        if (item.isAction && item.action === 'quickAdd') {
                            return (
                                <div key={item.labelKey} className="relative flex flex-col items-center -mt-8">
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
                                            if (isProcessing) {
                                                e.preventDefault(); e.stopPropagation(); return;
                                            }
                                            if (isVoiceActive) {
                                                e.preventDefault(); e.stopPropagation();
                                                window.dispatchEvent(new CustomEvent('trigger-voice-input', { detail: { forceStop: true } }));
                                                return;
                                            }
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
                                            if (isProcessing) {
                                                e.preventDefault(); e.stopPropagation(); return;
                                            }
                                            if (isVoiceActive) {
                                                e.preventDefault(); e.stopPropagation();
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
                                            if (isProcessing || isVoiceActive) {
                                                e.preventDefault();
                                                return;
                                            }
                                            handleAction(item.action);
                                        }}
                                        className="relative touch-none group"
                                        aria-label={isVoiceActive ? "Listening..." : isProcessing ? "Processing..." : t('bottomNav.add')}
                                        disabled={isProcessing}
                                    >
                                        <motion.div
                                            animate={{
                                                scale: (isVoiceActive || isProcessing) ? 1.1 : 1,
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`
                                                w-16 h-16 rounded-full flex items-center justify-center shadow-xl
                                                ${isVoiceActive
                                                    ? 'bg-gradient-to-tr from-red-500 to-orange-500 shadow-red-500/50'
                                                    : isProcessing
                                                        ? 'bg-slate-200 dark:bg-slate-700'
                                                        : 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-purple-500/40'}
                                            `}
                                        >
                                            <AnimatePresence mode="wait">
                                                {isProcessing ? (
                                                    <motion.div
                                                        key="loader"
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0, opacity: 0 }}
                                                    >
                                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                                    </motion.div>
                                                ) : isVoiceActive ? (
                                                    <motion.div
                                                        key="mic"
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0, opacity: 0 }}
                                                    >
                                                        <Mic className="w-8 h-8 text-white animate-pulse" />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="plus"
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0, opacity: 0 }}
                                                    >
                                                        <Plus className="w-8 h-8 text-white" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    </button>
                                </div>
                            )
                        }

                        // More Button
                        if (item.isAction && item.action === 'more') {
                            return (
                                <button
                                    key={item.labelKey}
                                    onClick={() => handleAction(item.action)}
                                    className="flex flex-col items-center justify-center w-16 h-full"
                                    aria-label={t('bottomNav.more')}
                                >
                                    <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        className="flex flex-col items-center gap-1"
                                    >
                                        <item.icon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
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
                                className="flex flex-col items-center justify-center w-16 h-full relative"
                                aria-current={active ? 'page' : undefined}
                            >
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className="flex flex-col items-center gap-1"
                                >
                                    <div className="relative">
                                        <item.icon
                                            className={`w-6 h-6 transition-colors duration-300 ${active ? 'text-indigo-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`}
                                        />
                                        {active && (
                                            <motion.div
                                                layoutId="activeGlow"
                                                className="absolute inset-0 bg-indigo-500/30 dark:bg-cyan-400/30 blur-lg rounded-full"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            />
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-medium transition-colors duration-300 ${active ? 'text-indigo-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {t(`bottomNav.${item.labelKey}` as any)}
                                    </span>
                                </motion.div>
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
