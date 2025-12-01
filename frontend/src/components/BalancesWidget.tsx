'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronDown, ChevronUp, CheckCircle, Clock, Eye, Wallet } from 'lucide-react';
import { userAPI } from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency } from '@/types/currency';
import Link from 'next/link';
import { SettleBalanceModal } from './SettleBalanceModal';

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
    totalSharedExpenses?: number;
    peopleWhoOweMe: PersonBalance[];
    peopleIOweTo: PersonBalance[];
  }>;
}

export const BalancesWidget = () => {
  const [balances, setBalances] = useState<UserBalances | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPersons, setExpandedPersons] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [settleModalData, setSettleModalData] = useState<{
    isOpen: boolean;
    groupId: string;
    otherUserId: string;
    otherUserName: string;
    amount: number;
  } | null>(null);

  const togglePerson = (groupId: string, userId: string) => {
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

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
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

  const handleSettleBalance = (groupId: string, otherUserId: string, userName: string, amount: number) => {
    setSettleModalData({
      isOpen: true,
      groupId,
      otherUserId,
      otherUserName: userName,
      amount,
    });
  };

  const closeSettleModal = () => {
    setSettleModalData(null);
  };

  const handleSettleSuccess = async () => {
    await loadBalances();
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Mis Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Group details section */}
        <div>
          {balances.groupBalances.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-3">No tienes gastos compartidos aún</p>
              <Link href="/dashboard/groups" className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                Crear grupo
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {balances.groupBalances.map((groupBalance) => {
                const hasPeopleWhoOweMe = groupBalance.peopleWhoOweMe.length > 0;
                const hasPeopleIOweTo = groupBalance.peopleIOweTo.length > 0;
                if (!hasPeopleWhoOweMe && !hasPeopleIOweTo) return null;

                return (
                  <div key={groupBalance.group.id}>
                    {/* Group header - clickable accordion trigger */}
                    <button
                      onClick={() => toggleGroup(groupBalance.group.id)}
                      className="w-full mb-3 p-3 bg-gray-50/50 rounded-lg hover:bg-gray-100/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {groupBalance.group.name.charAt(0)}
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900">{groupBalance.group.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/groups/${groupBalance.group.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                          >
                            <Eye className="w-3 h-3" />
                            Ver
                          </Link>
                          {expandedGroups.has(groupBalance.group.id) ? (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs gap-4 flex-wrap">
                        {hasPeopleWhoOweMe && (
                          <span className="text-green-600 font-medium">
                            Te deben: {formatCurrency(groupBalance.othersOweMe, 'CLP')}
                          </span>
                        )}
                        {hasPeopleWhoOweMe && hasPeopleIOweTo && (
                          <span className="text-gray-400">|</span>
                        )}
                        {hasPeopleIOweTo && (
                          <span className="text-red-600 font-medium">
                            Debes: {formatCurrency(groupBalance.iOweOthers, 'CLP')}
                          </span>
                        )}
                        <span className="text-gray-400">|</span>
                        <span className="text-blue-600 font-medium">
                          Total gastos: {formatCurrency(groupBalance.totalSharedExpenses || 0, 'CLP')}
                        </span>
                      </div>
                    </button>

                    {/* Split content - only visible when expanded */}
                    {expandedGroups.has(groupBalance.group.id) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Te deben */}
                      {hasPeopleWhoOweMe && (
                        <div className="bg-green-50/30 rounded-lg p-3">
                          <p className="text-xs font-semibold text-green-700 mb-3">Te deben</p>
                          <div className="space-y-2.5">
                            {groupBalance.peopleWhoOweMe.map((person) => {
                              const personKey = `${groupBalance.group.id}-${person.user.id}`;
                              const isExpanded = expandedPersons.has(personKey);
                              const allExpenses = [...person.unpaidExpenses, ...person.paidExpenses];
                              const percentage = person.totalHistorical > 0 ? (person.totalPaid / person.totalHistorical) * 100 : 0;

                              return (
                                <div key={person.user.id} className="rounded-lg p-2.5 hover:bg-white/60 transition-colors">
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                      <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                                        {person.user.name.split(' ').map((n) => n[0]).join('')}
                                      </div>
                                      <span className="text-sm font-medium text-gray-900 truncate">{person.user.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-green-600">{formatCurrency(person.amount, 'CLP')}</span>
                                  </div>

                                  {/* Inline progress bar */}
                                  {person.totalHistorical > 0 && (
                                    <div className="w-full h-1 bg-green-200/50 rounded-full mb-2.5">
                                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                                    </div>
                                  )}

                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => handleSettleBalance(groupBalance.group.id, person.user.id, person.user.name, person.amount)}
                                      className="flex-1 text-xs py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
                                    >
                                      Saldado
                                    </button>
                                    {allExpenses.length > 0 && (
                                      <button
                                        onClick={() => togglePerson(groupBalance.group.id, person.user.id)}
                                        className="text-xs text-gray-600 hover:text-gray-900 px-2 hover:bg-white/60 rounded-md transition-colors"
                                      >
                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                      </button>
                                    )}
                                  </div>

                                  {/* Expenses - simple list */}
                                  {isExpanded && allExpenses.length > 0 && (
                                    <div className="mt-2.5 pt-2.5 space-y-1.5 border-t border-green-200/50">
                                      {allExpenses.map((expense, idx) => {
                                        const isPaid = person.paidExpenses.some(e => e.expenseId === expense.expenseId);
                                        return (
                                          <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                              {isPaid ? <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" /> : <Clock className="w-3 h-3 text-orange-500 flex-shrink-0" />}
                                              <span className="truncate text-gray-700">{expense.description}</span>
                                            </div>
                                            <span className="font-medium text-gray-900 ml-2">{formatCurrency(expense.amount, 'CLP')}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Right: Debes */}
                      {hasPeopleIOweTo && (
                        <div className="bg-red-50/30 rounded-lg p-3">
                          <p className="text-xs font-semibold text-red-700 mb-3">Debes</p>
                          <div className="space-y-2.5">
                            {groupBalance.peopleIOweTo.map((person) => {
                              const personKey = `${groupBalance.group.id}-${person.user.id}`;
                              const isExpanded = expandedPersons.has(personKey);
                              const allExpenses = [...person.unpaidExpenses, ...person.paidExpenses];
                              const percentage = person.totalHistorical > 0 ? (person.totalPaid / person.totalHistorical) * 100 : 0;

                              return (
                                <div key={person.user.id} className="rounded-lg p-2.5 hover:bg-white/60 transition-colors">
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                      <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                                        {person.user.name.split(' ').map((n) => n[0]).join('')}
                                      </div>
                                      <span className="text-sm font-medium text-gray-900 truncate">{person.user.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-red-600">{formatCurrency(person.amount, 'CLP')}</span>
                                  </div>

                                  {/* Inline progress bar */}
                                  {person.totalHistorical > 0 && (
                                    <div className="w-full h-1 bg-red-200/50 rounded-full mb-2.5">
                                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                                    </div>
                                  )}

                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => handleSettleBalance(groupBalance.group.id, person.user.id, person.user.name, person.amount)}
                                      className="flex-1 text-xs py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                                    >
                                      Pagué
                                    </button>
                                    {allExpenses.length > 0 && (
                                      <button
                                        onClick={() => togglePerson(groupBalance.group.id, person.user.id)}
                                        className="text-xs text-gray-600 hover:text-gray-900 px-2 hover:bg-white/60 rounded-md transition-colors"
                                      >
                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                      </button>
                                    )}
                                  </div>

                                  {/* Expenses - simple list */}
                                  {isExpanded && allExpenses.length > 0 && (
                                    <div className="mt-2.5 pt-2.5 space-y-1.5 border-t border-red-200/50">
                                      {allExpenses.map((expense, idx) => {
                                        const isPaid = person.paidExpenses.some(e => e.expenseId === expense.expenseId);
                                        return (
                                          <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                              {isPaid ? <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" /> : <Clock className="w-3 h-3 text-orange-500 flex-shrink-0" />}
                                              <span className="truncate text-gray-700">{expense.description}</span>
                                            </div>
                                            <span className="font-medium text-gray-900 ml-2">{formatCurrency(expense.amount, 'CLP')}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>

      {settleModalData && (
        <SettleBalanceModal
          isOpen={settleModalData.isOpen}
          onClose={closeSettleModal}
          groupId={settleModalData.groupId}
          otherUserId={settleModalData.otherUserId}
          otherUserName={settleModalData.otherUserName}
          amount={settleModalData.amount}
          onSuccess={handleSettleSuccess}
        />
      )}
    </Card>
  );
};
