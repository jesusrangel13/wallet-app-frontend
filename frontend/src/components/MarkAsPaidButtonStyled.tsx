'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, DollarSign, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export type ButtonDesignStyle = 'minimal' | 'pill' | 'icon-only';

interface MarkAsPaidButtonStyledProps {
  expenseId: string;
  participantUserId: string;
  currentUserId: string;
  paidByUserId: string;
  isPaid: boolean;
  onSuccess?: () => void;
  designStyle?: ButtonDesignStyle;
}

export const MarkAsPaidButtonStyled = ({
  expenseId,
  participantUserId,
  currentUserId,
  paidByUserId,
  isPaid,
  onSuccess,
  designStyle = 'minimal',
}: MarkAsPaidButtonStyledProps) => {
  const [loading, setLoading] = useState(false);

  const handleMarkAsPaid = async () => {
    setLoading(true);
    try {
      const action = isPaid ? 'mark-unpaid' : 'mark-paid';

      console.log(`🔄 Marking participant as ${action}:`, {
        expenseId,
        participantUserId,
        currentUserId,
        paidByUserId,
        isPaid
      });

      const response = await api.patch(
        `/shared-expenses/${expenseId}/participants/${participantUserId}/${action}`
      );

      console.log('✅ Response from backend:', response.data);
      console.log('✅ Full response structure:', JSON.stringify(response.data, null, 2));

      // Verify the backend response has isPaid updated
      if (response.data?.data?.participant) {
        console.log('✅ Participant isPaid status in response:', response.data.data.participant.isPaid);
      } else {
        console.log('⚠️ participant not found in response.data.data');
      }

      toast.success(isPaid ? 'Marcado como no pagado' : 'Marcado como pagado');

      // Longer delay to ensure backend transaction is fully committed
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('🔄 Calling onSuccess to reload data...');
      onSuccess?.();
    } catch (error: any) {
      console.error('❌ Error marking as paid:', error);
      toast.error(
        error.response?.data?.message || 'Error al actualizar el estado de pago'
      );
    } finally {
      setLoading(false);
    }
  };

  // Determine roles
  const isPayee = currentUserId === paidByUserId;
  const isDebtor = currentUserId === participantUserId;
  const participantIsPayer = participantUserId === paidByUserId;

  // ============================================
  // OPCIÓN 1: MINIMALISTA CON ICONOS
  // ============================================
  const renderMinimalStyle = (text: string, type: 'debtor' | 'payee' | 'badge' | 'paid') => {
    if (type === 'badge') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md">
          <Check className="h-3 w-3" />
          Pagaste
        </span>
      );
    }

    if (type === 'paid') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Pagado
        </span>
      );
    }

    const isDebtor = type === 'debtor';
    const colorClasses = isDebtor
      ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
      : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100';

    return (
      <button
        onClick={handleMarkAsPaid}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${colorClasses} ${
          loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Actualizando...</span>
          </>
        ) : (
          <>
            {isDebtor ? <DollarSign className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            <span>{isDebtor ? 'Pagué' : 'Confirmar'}</span>
          </>
        )}
      </button>
    );
  };

  // ============================================
  // OPCIÓN 2: PILL BUTTONS (MODERNO)
  // ============================================
  const renderPillStyle = (text: string, type: 'debtor' | 'payee' | 'badge' | 'paid') => {
    if (type === 'badge') {
      return (
        <span className="inline-flex items-center px-4 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
          Ya pagaste
        </span>
      );
    }

    if (type === 'paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-green-700 bg-gradient-to-r from-green-50 to-green-100 rounded-full">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Pagado
        </span>
      );
    }

    const isDebtor = type === 'debtor';
    const colorClasses = isDebtor
      ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 hover:from-green-100 hover:to-green-200'
      : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200';

    return (
      <button
        onClick={handleMarkAsPaid}
        disabled={loading}
        className={`inline-flex items-center px-4 py-1.5 text-xs font-medium rounded-full transition-all ${colorClasses} ${
          loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            <span>Actualizando...</span>
          </>
        ) : (
          <span>{isDebtor ? 'Marcar pagado' : 'Confirmar pago'}</span>
        )}
      </button>
    );
  };

  // ============================================
  // OPCIÓN 3: SOLO ICONOS CON TOOLTIP
  // ============================================
  const renderIconOnlyStyle = (text: string, type: 'debtor' | 'payee' | 'badge' | 'paid') => {
    if (type === 'badge') {
      return (
        <div className="group relative">
          <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center cursor-default">
            <Check className="h-4 w-4 text-gray-400" />
          </div>
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
            <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
              Ya pagaste
            </div>
          </div>
        </div>
      );
    }

    if (type === 'paid') {
      return (
        <div className="group relative">
          <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center cursor-default shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-white" />
          </div>
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10">
            <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
              ✓ Pagado
            </div>
          </div>
        </div>
      );
    }

    const isDebtor = type === 'debtor';
    const colorClasses = isDebtor
      ? 'bg-green-100 hover:bg-green-200 text-green-600'
      : 'bg-blue-100 hover:bg-blue-200 text-blue-600';
    const tooltipText = isDebtor ? 'Marcar que pagué' : 'Confirmar pago recibido';
    const Icon = isDebtor ? DollarSign : Check;

    return (
      <div className="group relative">
        <button
          onClick={handleMarkAsPaid}
          disabled={loading}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${colorClasses} ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:scale-110'
          }`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </button>
        {!loading && (
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10">
            <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
              {tooltipText}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Determine which render function to use
  const renderButton = designStyle === 'minimal'
    ? renderMinimalStyle
    : designStyle === 'pill'
    ? renderPillStyle
    : renderIconOnlyStyle;

  // CASO 1: Viewing your own row as the debtor (not paid yet)
  if (isDebtor && !participantIsPayer && !isPaid) {
    return renderButton('Marcar que pagué', 'debtor');
  }

  // CASO 2: You're the payee viewing another participant's row (not paid yet)
  if (isPayee && !isDebtor && !isPaid) {
    return renderButton('Confirmar pago recibido', 'payee');
  }

  // CASO 3: You're the payee viewing your own row
  if (participantIsPayer && isPayee && !isPaid) {
    return renderButton('Ya pagaste', 'badge');
  }

  // CASO 4: Already paid
  if (isPaid) {
    // Show "Pagado" status for everyone
    return renderIconOnlyStyle('Pagado', 'paid');
  }

  // CASO 5: No permission
  return null;
};
