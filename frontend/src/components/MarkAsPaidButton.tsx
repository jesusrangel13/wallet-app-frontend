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

  // Determine roles
  const isPayee = currentUserId === paidByUserId; // Current user paid the full expense
  const isDebtor = currentUserId === participantUserId; // Current user is viewing their own row
  const participantIsPayer = participantUserId === paidByUserId; // This row is for who paid

  // Helper function to render buttons consistently
  const renderButton = (text: string) => {
    if (variant === 'icon') {
      return (
        <button
          onClick={handleMarkAsPaid}
          disabled={loading}
          className={`p-2 rounded-lg transition-colors ${
            isPaid
              ? 'bg-green-50 text-green-600 hover:bg-green-100'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={text}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
        </button>
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
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" />
            {text}
          </>
        )}
      </button>
    );
  };

  // CASO 1: Viewing your own row as the debtor (not paid yet)
  // → Show button "Marcar que pagué"
  if (isDebtor && !participantIsPayer && !isPaid) {
    // You owe money, you're viewing your own row
    return renderButton('Marcar que pagué');
  }

  // CASO 2: You're the payee viewing another participant's row (not paid yet)
  // → Show button "Confirmar pago recibido"
  if (isPayee && !isDebtor && !isPaid) {
    // You paid, you're viewing someone else's row who owes you
    return renderButton('Confirmar pago recibido');
  }

  // CASO 3: You're the payee viewing your own row (you paid and you're also a participant)
  // → Show informative badge
  if (participantIsPayer && isPayee && !isPaid) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg border border-blue-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Ya pagaste (esperando pago de otros)
      </span>
    );
  }

  // CASO 4: Already paid
  if (isPaid) {
    if (isPayee) {
      // Payee can undo the payment
      return renderButton('Deshacer pago');
    } else {
      // Others just see the status
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          Pagado
        </span>
      );
    }
  }

  // CASO 5: No permission to interact with this payment
  return null;
};
