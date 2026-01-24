'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface PaymentStatusBadgeProps {
  isPaid: boolean;
  variant?: 'default' | 'compact';
}

export const PaymentStatusBadge = memo(function PaymentStatusBadge({
  isPaid,
  variant = 'default'
}: PaymentStatusBadgeProps) {
  const t = useTranslations('groups');

  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center text-sm ${isPaid ? 'text-income' : 'text-yellow-600 dark:text-yellow-400'}`}>
        {isPaid ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${isPaid
        ? 'bg-income-light text-income border-income/20'
        : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
        }`}
    >
      {isPaid ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t('payment.status.paid')}
        </>
      ) : (
        <>
          <Clock className="h-3.5 w-3.5" />
          {t('payment.status.pending')}
        </>
      )}
    </span>
  );
});
