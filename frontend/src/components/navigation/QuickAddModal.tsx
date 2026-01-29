import { motion, AnimatePresence } from 'framer-motion'
import { SuccessAnimation } from '@/components/ui/animations'
import { X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Users, Mic } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { LazyTransactionFormModal } from '@/lib/lazyModals'
import { useAccounts } from '@/hooks/useAccounts'
import { transactionAPI } from '@/lib/api'
import { TransactionFormData } from '@/components/TransactionFormModal'
import { SharedExpenseData } from '@/components/SharedExpenseForm'
import { toast } from 'sonner'

interface QuickAddModalProps {
    isOpen: boolean
    onClose: () => void
}

interface QuickAction {
    icon: React.ComponentType<{ className?: string }>
    labelKey: string
    color: string
    type: 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'SHARED'
}

const quickActions: QuickAction[] = [
    { icon: ArrowDownLeft, labelKey: 'expense', color: 'bg-red-500', type: 'EXPENSE' },
    { icon: ArrowUpRight, labelKey: 'income', color: 'bg-green-500', type: 'INCOME' },
    { icon: ArrowLeftRight, labelKey: 'transfer', color: 'bg-blue-500', type: 'TRANSFER' },
    { icon: Users, labelKey: 'shared', color: 'bg-purple-500', type: 'SHARED' },
]

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
    const t = useTranslations('nav')
    const { data: accountsData } = useAccounts()
    const [showTransactionModal, setShowTransactionModal] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [selectedType, setSelectedType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE')

    // Extract accounts array from the query result
    const accounts = (accountsData as any)?.data?.data || []

    const handleQuickAction = (type: QuickAction['type']) => {
        // Close QuickAddModal first
        onClose()

        // Small delay to ensure smooth transition between modals
        setTimeout(() => {
            if (type === 'SHARED') {
                // For shared expenses, open TransactionFormModal with EXPENSE type
                // The user can then enable shared expense in the form
                setSelectedType('EXPENSE')
            } else {
                setSelectedType(type)
            }
            setShowTransactionModal(true)
        }, 150)
    }

    const handleTransactionSubmit = async (
        data: TransactionFormData,
        sharedExpenseData?: SharedExpenseData | null
    ) => {
        try {
            // Type assertion needed because TransactionFormData has optional fields
            // but the API expects required fields - the form validates this
            await transactionAPI.create(data as any)
            setShowTransactionModal(false)
            setShowSuccess(true)
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create transaction')
            throw error
        }
    }

    const handleVoiceClick = () => {
        onClose()
        // Trigger voice recognition on the main FAB
        // We use a small timeout to let the modal close animation start/finish cleanly
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('trigger-voice-input'))
        }, 300)
    }

    return (
        <>
            <SuccessAnimation
                show={showSuccess}
                message={t('quickAdd.transactionCreated') || 'Transaction Created!'}
                onComplete={() => setShowSuccess(false)}
            />
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
                                <h2 className="text-xl font-bold text-foreground">{t('quickAdd.title')}</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-muted rounded-full transition-colors"
                                    aria-label="Cerrar"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            {/* Voice Option - Prominent */}
                            <motion.button
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleVoiceClick}
                                className="w-full flex items-center justify-between p-4 mb-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-full">
                                        <Mic className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="font-bold text-lg">Asistente de Voz</span>
                                        <span className="text-xs text-blue-100">Habla para registrar transacciones</span>
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                                    IA Powered
                                </div>
                            </motion.button>

                            {/* Quick Actions Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {quickActions.map((action, index) => (
                                    <motion.button
                                        key={action.type}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleQuickAction(action.type)}
                                        className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className={`p-4 rounded-full ${action.color} text-white`}>
                                            <action.icon className="w-6 h-6" />
                                        </div>
                                        <span className="font-medium text-foreground">{t(`quickAdd.${action.labelKey}` as any)}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Transaction Form Modal - Lazy loaded */}
            {showTransactionModal && (
                <LazyTransactionFormModal
                    isOpen={showTransactionModal}
                    onClose={() => setShowTransactionModal(false)}
                    onSubmit={handleTransactionSubmit}
                    accounts={accounts}
                    initialData={{ type: selectedType }}
                />
            )}
        </>
    )
}
