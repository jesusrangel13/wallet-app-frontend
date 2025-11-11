'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface MarkAsPaidButtonProps {
  expenseId: string;
  participantUserId: string;
  currentUserId: string;
  paidByUserId: string;
  isPaid: boolean;
  onSuccess?: () => void;
  variant?: 'button' | 'icon';
}

export const MarkAsPaidButton = ({
  expenseId,
  participantUserId,
  currentUserId,
  paidByUserId,
  isPaid,
  onSuccess,
  variant = 'button',
}: MarkAsPaidButtonProps) => {
  const [loading, setLoading] = useState(false);

  // Determine if current user is the payee (who paid the expense) or the debtor (who owes)
  const isPayee = currentUserId === paidByUserId;
  const isDebtor = currentUserId === participantUserId;

  // If you're the payee trying to mark yourself as paid, don't show the button
  // (You already paid, others owe you - you can't owe yourself)
  const isPayeeMarkingSelf = isPayee && participantUserId === paidByUserId;

  // Can't mark as paid if you're neither the payee nor the debtor
  // OR if you're the payee trying to mark yourself
  if ((!isPayee && !isDebtor) || isPayeeMarkingSelf) {
    return null;
  }

  const handleMarkAsPaid = async () => {
    setLoading(true);
    try {
      const action = isPaid ? 'mark-unpaid' : 'mark-paid';

      await api.patch(
        `/shared-expenses/${expenseId}/participants/${participantUserId}/${action}`
      );

      toast.success(isPaid ? 'Marcado como no pagado' : 'Marcado como pagado');
      onSuccess?.();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Error al actualizar el estado de pago'
      );
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleMarkAsPaid}
        disabled={loading || (isPaid && !isPayee)}
        className={`p-2 rounded-lg transition-colors ${
          isPaid
            ? 'bg-green-50 text-green-600 hover:bg-green-100'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
        } ${loading || (isPaid && !isPayee) ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={
          isPaid
            ? isPayee
              ? 'Marcar como no pagado'
              : 'Pagado'
            : isDebtor
            ? 'Marcar que pagué'
            : 'Marcar como pagado'
        }
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
      </button>
    );
  }

  // Only payee can undo a payment
  if (isPaid && !isPayee) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        Pagado
      </span>
    );
  }

  return (
    <button
      onClick={handleMarkAsPaid}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        isPaid
          ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Actualizando...
        </>
      ) : isPaid ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          Deshacer pago
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4" />
          {isDebtor ? 'Marcar que pagué' : 'Confirmar pago recibido'}
        </>
      )}
    </button>
  );
};
