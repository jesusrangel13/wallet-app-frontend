'use client';

import { memo } from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface PaymentStatusBadgeProps {
  isPaid: boolean;
  variant?: 'default' | 'compact';
}

export const PaymentStatusBadge = memo(function PaymentStatusBadge({
  isPaid,
  variant = 'default'
}: PaymentStatusBadgeProps) {
  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center text-sm ${isPaid ? 'text-green-600' : 'text-amber-600'}`}>
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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${isPaid
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}
    >
      {isPaid ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Pagado
        </>
      ) : (
        <>
          <Clock className="h-3.5 w-3.5" />
          Pendiente
        </>
      )}
    </span>
  );
});
