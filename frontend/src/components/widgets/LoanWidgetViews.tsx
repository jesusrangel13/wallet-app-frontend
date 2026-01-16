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
                <div className={`${fontSizes.value} font-bold text-orange-600`}>
                    <AnimatedCurrency amount={summary.totalPending} currency={summary.currency as Currency} />
                </div>
                <p className={`${fontSizes.label} text-gray-500`}>{t('pendingToCollect')}</p>
            </div>
            <div className="bg-orange-100 p-2 rounded-full">
                <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">{t('activeLoans')}</p>
                <p className="font-semibold text-gray-900">
                    <AnimatedCounter value={summary.activeLoans} decimals={0} />
                </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">{t('totalRecovered')}</p>
                <p className="font-semibold text-green-600">
                    <AnimatedCurrency amount={summary.totalRecovered} currency={summary.currency as Currency} />
                </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">{t('totalLent')}</p>
                <p className="font-semibold text-gray-900">
                    <AnimatedCurrency amount={summary.totalLent} currency={summary.currency as Currency} />
                </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">{t('totalLoans')}</p>
                <p className="font-semibold text-gray-900">
                    <AnimatedCounter value={summary.totalLoans} decimals={0} />
                </p>
            </div>
        </div>
    </div>
)

// View 2: Lista Activa (Active List)
export const ActiveListView = ({ loans, currency, t }: { loans: Loan[], currency: string, t: any }) => {
    if (loans.length === 0) {
        return <p className="text-sm text-gray-500 text-center py-4">{t('noActiveLoans')}</p>
    }

    return (
        <div className="space-y-3">
            {loans.slice(0, 3).map((loan) => {
                const pending = Number(loan.originalAmount) - Number(loan.paidAmount)
                return (
                    <Link
                        key={loan.id}
                        href={`/dashboard/loans/${loan.id}`}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                    >
                        <div>
                            <p className="font-medium text-gray-900 text-sm">{loan.borrowerName}</p>
                            <p className="text-xs text-gray-500">
                                {new Date(loan.loanDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-orange-600 text-sm">
                                <AnimatedCurrency amount={pending} currency={currency as Currency} />
                            </p>
                            <div className="flex items-center text-xs text-gray-400 group-hover:text-blue-600">
                                Ver <ChevronRight className="h-3 w-3 ml-1" />
                            </div>
                        </div>
                    </Link>
                )
            })}
            {loans.length > 3 && (
                <Link
                    href="/dashboard/loans"
                    className="block text-center text-xs text-blue-600 hover:underline pt-1"
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
                    <p className="text-sm font-medium text-gray-700">{t('recoveryProgress')}</p>
                    <span className="text-2xl font-bold text-green-600">
                        <AnimatedCounter value={percentage} decimals={0} suffix="%" />
                    </span>
                </div>
                <Progress value={percentage} className="h-3" indicatorClassName="bg-green-500" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-xs text-gray-500">{t('totalLent')}</p>
                    <p className="font-medium">
                        <AnimatedCurrency amount={summary.totalLent} currency={summary.currency as Currency} />
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500">{t('totalRecovered')}</p>
                    <p className="font-medium text-green-600">
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
            <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t('createLoan')}
            </Button>
        </Link>

        {loans.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-semibold">{t('quickAccess')}</p>
                <Link
                    href={`/dashboard/loans/${loans[0].id}`}
                    className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <HandCoins className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">{loans[0].borrowerName}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
            </div>
        )}
    </div>
)
