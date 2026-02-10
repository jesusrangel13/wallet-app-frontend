'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Account } from '@/types'
import { accountAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingPage } from '@/components/ui/Loading'
import RecordLoanPaymentModal from '@/components/RecordLoanPaymentModal'
import { formatCurrency, type Currency } from '@/types/currency'
import { ArrowLeft, HandCoins, Calendar, DollarSign, User, FileText, CheckCircle, Clock, MoreVertical, CheckCircle2 } from 'lucide-react'
import { useLoan, useRecordLoanPayment, useCancelLoan, useDeleteLoan } from '@/hooks/useLoans'
import { PageTransition, AnimatedCurrency } from '@/components/ui/animations'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'

// ... imports remain the same

export default function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const t = useTranslations('loans')
  const tCommon = useTranslations('common')
  const { data: loan, isLoading } = useLoan(id)
  const recordPayment = useRecordLoanPayment()
  const cancelLoan = useCancelLoan()
  const deleteLoan = useDeleteLoan()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)


  useEffect(() => {
    // ... loadAccounts logic remains the same
    const loadAccounts = async () => {
      try {
        const accountsResponse = await accountAPI.getAll()
        const accountsData = accountsResponse.data as any
        setAccounts(Array.isArray(accountsData) ? accountsData : accountsData.data)
      } catch (error: any) {
        console.error('Error loading accounts:', error)
        toast.error(error.response?.data?.message || 'Failed to load accounts')
      }
    }
    loadAccounts()
  }, [])

  // ... handlers (handleRecordPayment, handleCancelLoan, handleDeleteLoan, handleWhatsAppReminder) remain the same
  const handleRecordPayment = (data: any) => {
    if (!loan) return
    recordPayment.mutate({ id: loan.id, data }, {
      onSuccess: () => { toast.success('Pago registrado exitosamente'); setIsPaymentModalOpen(false) },
      onError: (error: any) => { console.error(error); toast.error(error.response?.data?.message || 'Failed') }
    })
  }

  const handleCancelLoan = () => {
    if (!loan) return
    if (!confirm('¿Estás seguro de que deseas cancelar/perdonar este préstamo?')) return
    cancelLoan.mutate(loan.id, { onSuccess: () => toast.success('Préstamo cancelado'), onError: (e: any) => toast.error(e.response?.data?.message) })
  }

  const handleDeleteLoan = () => {
    if (!loan) return
    if (!confirm('¿Estás seguro?')) return
    deleteLoan.mutate(loan.id, { onSuccess: () => { toast.success('Préstamo eliminado'); router.push('/dashboard/loans') }, onError: (e: any) => toast.error(e.response?.data?.message) })
  }

  const handleWhatsAppReminder = () => {
    if (!loan) return
    const message = encodeURIComponent(`Hola ${loan.borrowerName}, te recuerdo del préstamo pendiente de ${formatCurrency(loan.originalAmount - loan.paidAmount, loan.currency as Currency)}.`)
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  if (isLoading) return <LoadingPage message="Cargando préstamo..." />
  if (!loan) return null

  const pendingAmount = loan.originalAmount - loan.paidAmount
  const progress = (loan.paidAmount / loan.originalAmount) * 100
  const currency = loan.currency as Currency

  // --- SUB-COMPONENTS FOR REUSABILITY ---

  const Timeline = () => (
    <Card className="h-full border-none shadow-lg bg-white dark:bg-gray-950">
      <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 rounded-t-xl pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Historial de Pagos</CardTitle>
          <span className="text-xs font-medium px-2 py-1 bg-white dark:bg-gray-800 rounded-full border shadow-sm">{loan.payments.length}</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loan.payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center text-muted-foreground">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-full mb-3"><Clock className="w-6 h-6 text-gray-400" /></div>
            <p className="text-sm">Aún no hay pagos registrados.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-8 top-6 bottom-6 w-px bg-gray-200 dark:bg-gray-800"></div>
            <div className="space-y-0">
              {loan.payments.map((payment: any, index: number) => (
                <div key={payment.id} className="relative pl-16 pr-6 py-6 group hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <div className="absolute left-[29px] top-8 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-950 shadow-sm z-10"></div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(payment.amount, currency)}</span>
                      <span className="text-xs text-gray-500">{new Date(payment.paymentDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Pago recibido {payment.notes ? `• ${payment.notes}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      {loan.payments.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 rounded-b-xl flex justify-between items-center text-sm">
          <span className="font-medium text-muted-foreground">Total Recaudado</span>
          <span className="font-bold text-income">{formatCurrency(loan.paidAmount, currency)}</span>
        </div>
      )}
    </Card>
  )

  const ContextCards = ({ className = "" }: { className?: string }) => (
    <div className={`grid gap-4 ${className}`}>
      {/* Borrower */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-card">
        <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 font-bold text-lg">
          {loan.borrowerName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Deudor</p>
          <p className="text-lg font-semibold">{loan.borrowerName}</p>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Desde {new Date(loan.loanDate).toLocaleDateString()}</p>
        </div>
      </div>
      {/* Context/Source */}
      {loan.loanTransaction ? (
        <div onClick={() => router.push('/dashboard/transactions')} className="group cursor-pointer flex items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-card hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
          <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600"><FileText className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wide group-hover:text-blue-600 transition-colors">Origen</p>
            <p className="text-sm font-medium">Ver Transacción</p>
            <p className="text-xs text-muted-foreground mt-1">Creado como gasto</p>
          </div>
        </div>
      ) : loan.notes && (
        <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-card">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wide mb-2">Notas</p>
          <p className="text-sm text-foreground/80 italic">&quot;{loan.notes}&quot;</p>
        </div>
      )}
    </div>
  )

  return (
    <PageTransition>
      <div className="space-y-6 pb-10">
        {/* TOP NAV & CONTROLS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <button onClick={() => router.push('/dashboard/loans')} className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <div className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-colors"><ArrowLeft className="h-4 w-4" /></div>
            <span className="font-medium text-sm">Volver</span>
          </button>



          {/* QUICK ACTIONS */}
          <div className="flex items-center gap-2">
            {loan.status === 'ACTIVE' && (
              <Button variant="outline" size="sm" className="gap-2 text-green-600 border-green-200 hover:bg-green-50 dark:border-green-900/30 dark:hover:bg-green-900/20" onClick={handleWhatsAppReminder}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg> Recordar
              </Button>
            )}
            {loan.status === 'ACTIVE' ? (
              <DropdownMenu items={[
                { label: tCommon('actions.cancel'), onClick: handleCancelLoan },
                { label: tCommon('actions.delete'), onClick: handleDeleteLoan, variant: 'danger' }
              ]}>
                <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5 text-gray-500" /></Button>
              </DropdownMenu>
            ) : (loan.payments.length === 0 && <Button variant="ghost" size="sm" onClick={handleDeleteLoan} className="text-red-500 hover:text-red-600 hover:bg-red-50">{tCommon('actions.delete')}</Button>)}
          </div>
        </div>

        {/* --- MOBILE VIEW (LAYOUT A - All-in-One) --- */}
        <div className="block lg:hidden space-y-6">
          {/* HERO STATS CARD */}
          <Card className="overflow-hidden border-none shadow-xl bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white relative transition-colors">
            <div className="absolute top-0 right-0 p-32 bg-blue-500/5 dark:bg-white/5 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>
            <CardContent className="p-6 relative z-10 flex flex-col gap-6">
              {/* TOP: Balance & Progress */}
              <div className="flex flex-col items-center text-center gap-2">
                <p className="text-muted-foreground dark:text-gray-400 text-xs font-medium uppercase tracking-wider">{loan.status === 'PAID' ? 'Préstamo Saldado' : 'Saldo Pendiente'}</p>
                <div className="text-balance-hero tracking-tight"><AnimatedCurrency amount={pendingAmount} currency={currency} /></div>
                <span className="bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-[10px] font-semibold mt-1">{loan.status === 'ACTIVE' ? 'ACTIVO' : loan.status === 'PAID' ? 'PAGADO' : 'CANCELADO'}</span>
              </div>

              {/* MIDDLE: Integrated Context (Borrower) - Simplified for Mobile Hero */}
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">{loan.borrowerName.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground dark:text-gray-400 uppercase">Deudor</p>
                  <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{loan.borrowerName}</p>
                </div>
              </div>

              {/* MIDDLE: Stats Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-transparent">
                  <p className="text-[10px] text-muted-foreground dark:text-gray-400 uppercase">Original</p>
                  <p className="text-base font-semibold">{formatCurrency(loan.originalAmount, currency)}</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-white/5 rounded-lg border border-green-100 dark:border-transparent">
                  <p className="text-[10px] text-green-600/70 dark:text-gray-400 uppercase">Pagado</p>
                  <p className="text-base font-semibold text-green-700 dark:text-green-400">{formatCurrency(loan.paidAmount, currency)}</p>
                </div>
              </div>

              {/* BOTTOM: Action */}
              {loan.status === 'ACTIVE' && pendingAmount > 0 && (
                <Button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20"
                >
                  <DollarSign className="w-4 h-4 mr-2" /> {t('recordPaymentBtn')}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Timeline below Hero on Mobile */}
          <Timeline />
        </div>

        {/* --- DESKTOP VIEW (LAYOUT B - 3 Columns) --- */}
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* COL 1: CONTEXT */}
          <div className="lg:col-span-1 space-y-4">
            <ContextCards className="grid-cols-1" />
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gray-50 border-none">
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Original</p>
                  <p className="text-sm font-bold truncate" title={formatCurrency(loan.originalAmount, currency)}>
                    {formatCurrency(loan.originalAmount, currency)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-none">
                <CardContent className="p-4">
                  <p className="text-[10px] text-green-600/70 uppercase font-bold tracking-wider mb-1">Pagado</p>
                  <p className="text-sm font-bold text-green-700 truncate" title={formatCurrency(loan.paidAmount, currency)}>
                    {formatCurrency(loan.paidAmount, currency)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* COL 2: FOCUS (HERO) */}
          <div className="lg:col-span-2">
            <Card className="h-full overflow-hidden border-none shadow-xl bg-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-gray-900 dark:text-white relative flex flex-col justify-between transition-colors group ring-1 dark:ring-white/5">
              {/* BACKGROUND GRAPH (Sparkline) */}
              <div className="absolute inset-x-0 bottom-0 h-32 opacity-5 dark:opacity-10 pointer-events-none group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: 'Start', balance: Number(loan.originalAmount) },
                    ...loan.payments.map((p: any, i: number) => ({
                      name: `Pay ${i + 1}`,
                      balance: Number(loan.originalAmount) - loan.payments.slice(0, i + 1).reduce((acc: number, curr: any) => acc + Number(curr.amount), 0)
                    })),
                    { name: 'Now', balance: pendingAmount }
                  ]}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="currentColor" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="balance" stroke="currentColor" fill="url(#colorBalance)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="absolute top-0 right-0 p-32 bg-teal-500/10 dark:bg-teal-400/5 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>

              <CardContent className="p-8 relative z-10 text-center flex flex-col h-full justify-center">
                {/* STATUS BADGE (Top Right) */}
                {loan.status === 'PAID' && (
                  <div className="absolute top-4 right-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Pagado
                  </div>
                )}

                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">
                    {loan.status === 'PAID' ? 'Préstamo Saldado' : 'Saldo Pendiente'}
                  </p>
                  <div className="text-balance-hero tracking-tight mb-6 text-slate-900 dark:text-white">
                    <AnimatedCurrency amount={pendingAmount} currency={currency} />
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="max-w-xs mx-auto mb-8 w-full">
                    <div className="flex justify-between text-xs text-muted-foreground dark:text-slate-400 mb-1">
                      <span>Progreso</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
                      <div className={`h-3 rounded-full transition-all duration-1000 ${loan.status === 'PAID' ? 'bg-green-500' : 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  {loan.status === 'ACTIVE' && pendingAmount > 0 && (
                    <div className="flex justify-center mb-8">
                      <Button
                        onClick={() => setIsPaymentModalOpen(true)}
                        size="lg"
                        className="w-full max-w-sm bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                      >
                        <DollarSign className="w-4 h-4 mr-2" /> {t('recordPaymentBtn')}
                      </Button>
                    </div>
                  )}
                </div>

                {/* BOTTOM METRICS */}
                <div className="grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800/50 pt-6 mt-2 relative z-20">
                  <div>
                    <p className="text-[10px] text-muted-foreground dark:text-slate-500 uppercase font-bold">Tiempo Activo</p>
                    <p className="text-sm font-semibold mt-1 text-slate-700 dark:text-slate-200">
                      {Math.ceil((new Date().getTime() - new Date(loan.loanDate).getTime()) / (1000 * 3600 * 24))} días
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground dark:text-slate-500 uppercase font-bold">Último Pago</p>
                    <p className="text-sm font-semibold mt-1 text-slate-700 dark:text-slate-200">
                      {loan.payments.length > 0
                        ? new Date(loan.payments[0].paymentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground dark:text-slate-500 uppercase font-bold">Frecuencia</p>
                    <p className="text-sm font-semibold mt-1 text-teal-600 dark:text-teal-400">
                      {loan.payments.length > 0 ? `${Math.ceil(loan.payments.length / (Math.ceil((new Date().getTime() - new Date(loan.loanDate).getTime()) / (1000 * 3600 * 24 * 30)) || 1))} / mes` : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* COL 3: TIMELINE */}
          <div className="lg:col-span-1">
            <Timeline />
          </div>
        </div>

        {/* Record Payment Modal */}
        {loan.status === 'ACTIVE' && pendingAmount > 0 && (
          <RecordLoanPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSubmit={handleRecordPayment} loan={loan} accounts={accounts} />
        )}
      </div>
    </PageTransition>
  )
}
