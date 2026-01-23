import { formatCurrency, type Currency } from '@/types/currency'
import { Loan, LoansSummary } from '@/types'
import { HandCoins, TrendingUp, AlertCircle, Plus, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { AnimatedCurrency, AnimatedCounter } from '@/components/ui/animations'

// View 1: Resumen Ejecutivo (Enhanced Summary)
export const SummaryView = ({ summary, fontSizes, t }: { summary: LoansSummary, fontSizes: any, t: any }) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <div className={`${fontSizes.value} font-bold text-orange-600 dark:text-orange-500`}>
                    <AnimatedCurrency amount={summary.totalPending} currency={summary.currency as Currency} />
                </div>
                <p className={`${fontSizes.label} text-muted-foreground`}>{t('pendingToCollect')}</p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full">
                <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-500" />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{t('activeLoans')}</p>
                <p className="font-semibold text-foreground">
                    <AnimatedCounter value={summary.activeLoans} decimals={0} />
                </p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{t('totalRecovered')}</p>
                <p className="font-semibold text-green-600 dark:text-green-500">
                    <AnimatedCurrency amount={summary.totalRecovered} currency={summary.currency as Currency} />
                </p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{t('totalLent')}</p>
                <p className="font-semibold text-foreground">
                    <AnimatedCurrency amount={summary.totalLent} currency={summary.currency as Currency} />
                </p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{t('totalLoans')}</p>
                <p className="font-semibold text-foreground">
                    <AnimatedCounter value={summary.totalLoans} decimals={0} />
                </p>
            </div>
        </div>
    </div>
)

// View 2: Lista Activa (Active List)
export const ActiveListView = ({ loans, currency, t }: { loans: Loan[], currency: string, t: any }) => {
    if (loans.length === 0) {
        return <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('noActiveLoans')}</p>
    }

    return (
        <div className="space-y-3">
            {loans.slice(0, 3).map((loan) => {
                const pending = Number(loan.originalAmount) - Number(loan.paidAmount)
                return (
                    <Link
                        key={loan.id}
                        href={`/dashboard/loans/${loan.id}`}
                        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors group"
                    >
                        <div>
                            <p className="font-medium text-foreground text-sm">{loan.borrowerName}</p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(loan.loanDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-orange-600 dark:text-orange-500 text-sm">
                                <AnimatedCurrency amount={pending} currency={currency as Currency} />
                            </p>
                            <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary">
                                Ver <ChevronRight className="h-3 w-3 ml-1" />
                            </div>
                        </div>
                    </Link>
                )
            })}
            {loans.length > 3 && (
                <Link
                    href="/dashboard/loans"
                    className="block text-center text-xs text-primary hover:underline pt-1"
                >
                    {t('viewAllLink')} ({loans.length})
                </Link>
            )}
        </div>
    )
}

// View 3: Progreso (Progress View)
export const ProgressView = ({ summary, t }: { summary: LoansSummary, t: any }) => {
    const total = Number(summary.totalLent)
    const recovered = Number(summary.totalRecovered)
    const percentage = total > 0 ? (recovered / total) * 100 : 0

    return (
        <div className="space-y-4">
            <div>
                <div className="flex justify-between items-end mb-2">
                    <p className="text-sm font-medium text-foreground">{t('recoveryProgress')}</p>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-500">
                        <AnimatedCounter value={percentage} decimals={0} suffix="%" />
                    </span>
                </div>
                <Progress value={percentage} className="h-3" indicatorClassName="bg-green-500" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-xs text-muted-foreground">{t('totalLent')}</p>
                    <p className="font-medium text-foreground">
                        <AnimatedCurrency amount={summary.totalLent} currency={summary.currency as Currency} />
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t('totalRecovered')}</p>
                    <p className="font-medium text-green-600 dark:text-green-500">
                        <AnimatedCurrency amount={summary.totalRecovered} currency={summary.currency as Currency} />
                    </p>
                </div>
            </div>
        </div>
    )
}

// View 4: Acción Rápida (Actions View)
export const ActionsView = ({ loans, t }: { loans: Loan[], t: any }) => (
    <div className="space-y-3">
        <Link href="/dashboard/loans" className="w-full">
            <Button className="w-full justify-start bg-primary hover:bg-primary-hover text-white" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t('createLoan')}
            </Button>
        </Link>

        {loans.length > 0 && (
            <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-semibold">{t('quickAccess')}</p>
                <Link
                    href={`/dashboard/loans/${loans[0].id}`}
                    className="flex items-center justify-between p-2 bg-muted/40 hover:bg-muted/60 rounded-md transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <HandCoins className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{loans[0].borrowerName}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
            </div>
        )}
    </div>
)
