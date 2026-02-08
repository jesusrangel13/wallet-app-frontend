import { Account } from '@/types'
import { formatCurrency, type Currency } from '@/types/currency'
import { CreditCard, Wallet, TrendingUp, TrendingDown, Calendar, AlertCircle } from 'lucide-react'
import { getAccountIcon } from '@/utils/accountIcons'

interface AccountHeroCardProps {
    account: Account
    monthlyMetrics?: {
        income: number
        expense: number
    }
}

export function AccountHeroCard({ account, monthlyMetrics }: AccountHeroCardProps) {
    const Icon = getAccountIcon(account.type)
    const isCredit = account.type === 'CREDIT'

    // Use account color or fallback to a professional blue
    const mainColor = account.color || '#3b82f6'

    // Calculate credit utilization
    const limit = Number(account.creditLimit) || 0
    const balance = Number(account.balance)

    // Logic adjustment: For Credit Accounts, 'balance' often represents 'Available Credit' in this system
    // (based on user feedback where Used + Balance = Limit).
    // For other accounts, balance is just the current funds.
    let available = balance
    let used = 0

    if (isCredit) {
        // If balance is Available, then Used = Limit - Available
        used = limit - balance
        // If the result is negative (e.g. balance > limit), clamp used to 0 or handle widely
        used = Math.max(0, used)
    } else {
        // Debit/Cash: Available is just the balance
        available = balance
    }

    const utilization = (limit > 0 && isCredit) ? (used / limit) * 100 : 0

    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* 1. Account Identity Card (The "Physical" Card) */}
            <div className="md:col-span-2 relative overflow-hidden rounded-2xl transition-all duration-300 transform hover:scale-[1.005] group min-h-[220px] flex flex-col justify-between
                shadow-sm border border-slate-200 dark:border-none dark:shadow-xl
                bg-white dark:bg-slate-900 
            ">
                {/* -- BACKGROUND LAYERS -- */}

                {/* Dark Mode Background (Premium Gradient) - Always the same */}
                <div className="absolute inset-0 hidden dark:block bg-gradient-to-br from-slate-900 to-slate-800" />
                <div className="hidden dark:block absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="hidden dark:block absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                {/* Light Mode Gradient Wash (Option 1 - Selected) */}
                <div
                    className="absolute inset-0 block dark:hidden"
                    style={{
                        background: `linear-gradient(135deg, white 0%, ${mainColor}15 100%)`
                    }}
                />

                {/* -- CONTENT -- */}
                <div className="relative z-10 p-6 flex flex-col h-full justify-between">

                    {/* Card Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            {/* Icon Wrapper */}
                            <div className="p-2 rounded-xl backdrop-blur-md transition-colors bg-slate-100 dark:bg-white/10">
                                <Icon className="w-6 h-6 text-slate-700 dark:text-white transition-colors" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{account.name}</h1>
                                <p className="text-sm font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400">{account.type} Account</p>
                            </div>
                        </div>
                        {/* Chip Icon */}
                        <div className="w-12 h-9 rounded bg-gradient-to-br from-yellow-200 to-yellow-400 opacity-80 flex items-center justify-center shadow-sm">
                            <div className="w-8 h-[1px] bg-yellow-600/30 mb-2"></div>
                        </div>
                    </div>

                    {/* Card Middle: Number */}
                    <div className="mt-6">
                        <p className="font-mono text-lg md:text-xl tracking-widest text-slate-600 dark:text-slate-300">
                            •••• •••• •••• {account.accountNumber ? account.accountNumber.slice(-4) : '0000'}
                        </p>
                    </div>

                    {/* Card Footer: Metrics */}
                    <div className="flex justify-between items-end mt-auto pt-6">
                        <div>
                            <p className="text-xs uppercase tracking-wider mb-1 text-slate-500 dark:text-slate-400">
                                {isCredit ? 'Credit Limit' : 'Current Balance'}
                            </p>
                            <p className="font-semibold text-lg text-slate-900 dark:text-white">
                                {isCredit ? formatCurrency(limit, account.currency as Currency) : formatCurrency(balance, account.currency as Currency)}
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="text-xs uppercase tracking-wider mb-1 text-slate-500 dark:text-slate-400">Status</p>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Context / Metrics Card */}
            <div className="md:col-span-1 rounded-2xl bg-white dark:bg-card border border-border shadow-sm p-6 flex flex-col justify-center space-y-6">
                {isCredit ? (
                    <>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-muted-foreground">Available Credit</span>
                                <span className="text-sm font-bold text-foreground">{formatCurrency(available, account.currency as Currency)}</span>
                            </div>
                            {/* Progress Bar with Glow */}
                            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${utilization > 80 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}
                                    style={{ width: `${Math.min(utilization, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground pt-1">
                                <span>0%</span>
                                <span>{utilization.toFixed(1)}% used</span>
                                <span>100%</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-dashed border-gray-200 dark:border-gray-800">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Billing Cycle</p>
                                    <p className="text-xs text-muted-foreground">Resets on day {account.billingDay || 1}</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex flex-col h-full justify-center">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Net Cash Flow (Monthly)</p>

                            {monthlyMetrics ? (
                                <>
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className={`text-3xl font-bold ${(monthlyMetrics.income - monthlyMetrics.expense) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {formatCurrency(Math.abs(monthlyMetrics.income - monthlyMetrics.expense), account.currency as Currency)}
                                        </span>
                                        <div className={`p-1 rounded-full ${(monthlyMetrics.income - monthlyMetrics.expense) >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                                            }`}>
                                            {(monthlyMetrics.income - monthlyMetrics.expense) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {(monthlyMetrics.income - monthlyMetrics.expense) >= 0
                                            ? 'Saved this month'
                                            : 'Overspent this month'
                                        }
                                    </p>

                                    {/* Mini Breakdown */}
                                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-dashed border-slate-200 dark:border-slate-800">
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Income</p>
                                            <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(monthlyMetrics.income, account.currency as Currency)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Expenses</p>
                                            <p className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(monthlyMetrics.expense, account.currency as Currency)}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-muted-foreground">No data for this month</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
