'use client'

import { Star, Banknote, CreditCard, Landmark, TrendingUp } from 'lucide-react'
import type { Account, AccountType } from '@/types'
import { formatCurrency, CURRENCIES, type Currency } from '@/types/currency'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AccountsViewVariantsProps {
    accounts: Account[]
    onNavigate: (accountId: string) => void
}

const accountTypeIcons: Record<AccountType, any> = {
    CASH: Banknote,
    DEBIT: CreditCard,
    CREDIT: CreditCard,
    SAVINGS: Landmark,
    INVESTMENT: TrendingUp,
}

export function AccountsViewVariants({
    accounts,
    onNavigate,
}: AccountsViewVariantsProps) {

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account, index) => {
                const Icon = accountTypeIcons[account.type]
                const isCredit = account.type === 'CREDIT'
                const currencyInfo = CURRENCIES[account.currency as Currency]

                // Shared Gradient generator
                // On dark mode (slate-900 base), this adds a color tint.
                // On light mode (white base), this adds a pastel tint.
                const getGradient = (color: string) => {
                    // Increased opacity for more vividness (40 = ~25%)
                    return `linear-gradient(135deg, ${color}40 0%, ${color}10 100%)`
                }

                return (
                    <motion.div
                        key={account.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onNavigate(account.id)}
                        className="relative overflow-hidden rounded-2xl cursor-pointer group shadow-md transition-all duration-300 h-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_var(--glow-color)]"
                        style={{
                            backgroundImage: getGradient(account.color),
                            '--glow-color': `${account.color}60`
                        } as React.CSSProperties}
                    >
                        {/* Decorative Circles (Adaptive & Vivid) */}
                        <div
                            className="absolute -right-12 -top-12 w-40 h-40 opacity-20 dark:opacity-10 rounded-full blur-3xl"
                            style={{ backgroundColor: account.color }}
                        />
                        <div
                            className="absolute -left-12 -bottom-12 w-40 h-40 opacity-20 dark:opacity-10 rounded-full blur-3xl"
                            style={{ backgroundColor: account.color }}
                        />

                        <div className="relative h-full p-6 flex flex-col justify-between">
                            {/* Header */}
                            <div className="flex justify-between items-start text-slate-900 dark:text-white">
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium opacity-70 uppercase tracking-wider">
                                        {account.type}
                                    </span>
                                    <h3 className="font-bold text-lg leading-tight mt-1">
                                        {account.name}
                                    </h3>
                                </div>
                                {account.isDefault && (
                                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                )}
                                {!account.isDefault && (
                                    <Icon className="h-6 w-6 opacity-60" /> // Dark icon in light mode via inheritance
                                )}
                            </div>

                            {/* Middle: Chip */}
                            <div className="flex items-center gap-2 opacity-70">
                                <div className="w-10 h-7 rounded border border-slate-300 dark:border-white/30 bg-slate-100 dark:bg-white/10 backdrop-blur-sm" />
                                <span className="text-sm font-mono tracking-widest text-slate-700 dark:text-gray-300">•••• {account.id.slice(-4)}</span>
                            </div>

                            {/* Bottom: Balance */}
                            <div className="text-slate-900 dark:text-white">
                                <span className="text-xs opacity-70 block mb-1">
                                    {isCredit ? 'Saldo Actual' : 'Saldo Disponible'}
                                </span>
                                <div className="flex justify-between items-end">
                                    <span className="text-2xl font-bold tracking-tight">
                                        {formatCurrency(Number(account.balance), account.currency as Currency)}
                                    </span>
                                    <span className="text-xs font-medium bg-slate-100 dark:bg-white/20 px-2 py-1 rounded backdrop-blur-md">
                                        {currencyInfo?.code}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
