'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Users, ChevronDown, ChevronUp, CheckCircle, Clock } from 'lucide-react';
import { userAPI, groupAPI } from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency, type Currency } from '@/types/currency';
import { MarkAsPaidButton } from './MarkAsPaidButton';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Expense {
  expenseId: string;
  description: string;
  amount: number;
  date: string;
  paidDate?: string;
}

interface PersonBalance {
  amount: number;
  totalHistorical: number;
  totalPaid: number;
  user: { id: string; name: string; avatarUrl?: string };
  unpaidExpenses: Expense[];
  paidExpenses: Expense[];
}

interface UserBalances {
  totalOthersOweMe: number;
  totalIOweOthers: number;
  netBalance: number;
  groupBalances: Array<{
    group: { id: string; name: string; coverImageUrl?: string };
    othersOweMe: number;
    iOweOthers: number;
    netBalance: number;
    peopleWhoOweMe: PersonBalance[];
    peopleIOweTo: PersonBalance[];
  }>;
}

export const BalancesWidget = () => {
  const [balances, setBalances] = useState<UserBalances | null>(null);
  const [loading, setLoading] = useState(true);
  const [settlingBalance, setSettlingBalance] = useState<string | null>(null);
  const [expandedPersons, setExpandedPersons] = useState<Set<string>>(new Set());

  const toggleExpanded = (groupId: string, userId: string) => {
    const key = `${groupId}-${userId}`;
    setExpandedPersons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  useEffect(() => {
    loadBalances();
  }, []);

  const loadBalances = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getMyBalances();
      setBalances(res.data.data);
    } catch (error: any) {
      toast.error('Error loading balances');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettleBalance = async (groupId: string, otherUserId: string, userName: string) => {
    setSettlingBalance(`${groupId}-${otherUserId}`);
    try {
      await groupAPI.settleAllBalance(groupId, otherUserId);
      toast.success(`Balance con ${userName} saldado exitosamente`);
      await loadBalances();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al saldar balance');
    } finally {
      setSettlingBalance(null);
    }
  };

  // Progress Bar Component
  const ProgressBar = ({ totalPaid, totalHistorical }: { totalPaid: number; totalHistorical: number }) => {
    const percentage = totalHistorical > 0 ? (totalPaid / totalHistorical) * 100 : 0;
    return (
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>{formatCurrency(totalPaid, 'CLP')} pagado</span>
          <span>{percentage.toFixed(0)}%</span>
          <span>{formatCurrency(totalHistorical, 'CLP')} total</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  // Expenses List Component
  const ExpensesList = ({ person, type }: { person: PersonBalance; type: 'owe-me' | 'i-owe' }) => {
    const allExpenses = [...person.unpaidExpenses, ...person.paidExpenses].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (allExpenses.length === 0) {
      return <p className="text-sm text-gray-500 py-2">No hay transacciones</p>;
    }

    return (
      <div className="mt-3 space-y-1">
        {allExpenses.map((expense, idx) => {
          const isPaid = person.paidExpenses.some(e => e.expenseId === expense.expenseId);
          return (
            <div
              key={`${expense.expenseId}-${idx}`}
              className={`flex items-center justify-between text-sm p-2 rounded ${
                isPaid ? 'bg-green-50' : 'bg-orange-50'
              }`}
            >
              <div className="flex items-center gap-2 flex-1">
                {isPaid ? (
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-orange-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isPaid ? 'text-green-900' : 'text-gray-900'}`}>
                    {expense.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(expense.date), { addSuffix: true, locale: es })}
                    {isPaid && expense.paidDate && (
                      <span className="ml-1">
                        • Pagado {formatDistanceToNow(new Date(expense.paidDate), { addSuffix: true, locale: es })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${isPaid ? 'text-green-700' : type === 'owe-me' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(expense.amount, 'CLP')}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isPaid ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'
                }`}>
                  {isPaid ? 'Pagado' : 'Pendiente'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (!balances) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Summary Cards */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
            <ArrowDownCircle className="h-4 w-4" />
            Me deben
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">
            {formatCurrency(balances.totalOthersOweMe, 'CLP')}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4" />
            Debo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900">
            {formatCurrency(balances.totalIOweOthers, 'CLP')}
          </div>
        </CardContent>
      </Card>

      <Card className={`bg-gradient-to-br ${balances.netBalance >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'}`}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-sm font-medium ${balances.netBalance >= 0 ? 'text-blue-800' : 'text-orange-800'} flex items-center gap-2`}>
            <DollarSign className="h-4 w-4" />
            Balance neto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${balances.netBalance >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
            {formatCurrency(balances.netBalance, 'CLP')}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Balances */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Detalles por grupo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balances.groupBalances.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No tienes gastos compartidos aún</p>
              <Link href="/dashboard/groups">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Crear grupo
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {balances.groupBalances.map((groupBalance) => {
                const hasPeopleWhoOweMe = groupBalance.peopleWhoOweMe.length > 0;
                const hasPeopleIOweTo = groupBalance.peopleIOweTo.length > 0;

                if (!hasPeopleWhoOweMe && !hasPeopleIOweTo) return null;

                return (
                  <div key={groupBalance.group.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                          {groupBalance.group.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{groupBalance.group.name}</h3>
                          <p className="text-sm text-gray-500">
                            Balance: <span className={groupBalance.netBalance >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {formatCurrency(groupBalance.netBalance, 'CLP')}
                            </span>
                          </p>
                        </div>
                      </div>
                      <Link href="/dashboard/groups">
                        <button className="text-sm text-blue-600 hover:text-blue-700">Ver grupo</button>
                      </Link>
                    </div>

                    {/* People who owe me */}
                    {hasPeopleWhoOweMe && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-green-700 mb-2">Te deben:</h4>
                        <div className="space-y-3">
                          {groupBalance.peopleWhoOweMe.map((person) => {
                            const personKey = `${groupBalance.group.id}-${person.user.id}`;
                            const isExpanded = expandedPersons.has(personKey);
                            const totalExpenses = person.unpaidExpenses.length + person.paidExpenses.length;

                            return (
                              <div key={person.user.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                      {person.user.name.split(' ').map((n) => n[0]).join('')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900">{person.user.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {person.unpaidExpenses.length} de {totalExpenses} gasto(s) pendiente(s)
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-green-600">{formatCurrency(person.amount, 'CLP')}</p>
                                    <button
                                      onClick={() => handleSettleBalance(groupBalance.group.id, person.user.id, person.user.name)}
                                      disabled={settlingBalance === personKey}
                                      className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded border border-green-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                                    >
                                      {settlingBalance === personKey ? 'Saldando...' : 'Marcar saldado'}
                                    </button>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                {person.totalHistorical > 0 && (
                                  <ProgressBar totalPaid={person.totalPaid} totalHistorical={person.totalHistorical} />
                                )}

                                {/* Expand/Collapse Button */}
                                <button
                                  onClick={() => toggleExpanded(groupBalance.group.id, person.user.id)}
                                  className="w-full mt-3 flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 py-2 border-t border-gray-100 transition-colors"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-4 w-4" />
                                      Ocultar {totalExpenses} gasto(s)
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4" />
                                      Ver {totalExpenses} gasto(s)
                                    </>
                                  )}
                                </button>

                                {/* Expenses List (Accordion) */}
                                {isExpanded && <ExpensesList person={person} type="owe-me" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* People I owe to */}
                    {hasPeopleIOweTo && (
                      <div>
                        <h4 className="text-sm font-medium text-red-700 mb-2">Debes a:</h4>
                        <div className="space-y-3">
                          {groupBalance.peopleIOweTo.map((person) => {
                            const personKey = `${groupBalance.group.id}-${person.user.id}`;
                            const isExpanded = expandedPersons.has(personKey);
                            const totalExpenses = person.unpaidExpenses.length + person.paidExpenses.length;

                            return (
                              <div key={person.user.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                      {person.user.name.split(' ').map((n) => n[0]).join('')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900">{person.user.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {person.unpaidExpenses.length} de {totalExpenses} gasto(s) pendiente(s)
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-red-600">{formatCurrency(person.amount, 'CLP')}</p>
                                    <button
                                      onClick={() => handleSettleBalance(groupBalance.group.id, person.user.id, person.user.name)}
                                      disabled={settlingBalance === personKey}
                                      className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                                    >
                                      {settlingBalance === personKey ? 'Saldando...' : 'Marcar que pagué'}
                                    </button>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                {person.totalHistorical > 0 && (
                                  <ProgressBar totalPaid={person.totalPaid} totalHistorical={person.totalHistorical} />
                                )}

                                {/* Expand/Collapse Button */}
                                <button
                                  onClick={() => toggleExpanded(groupBalance.group.id, person.user.id)}
                                  className="w-full mt-3 flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 py-2 border-t border-gray-100 transition-colors"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-4 w-4" />
                                      Ocultar {totalExpenses} gasto(s)
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4" />
                                      Ver {totalExpenses} gasto(s)
                                    </>
                                  )}
                                </button>

                                {/* Expenses List (Accordion) */}
                                {isExpanded && <ExpensesList person={person} type="i-owe" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
