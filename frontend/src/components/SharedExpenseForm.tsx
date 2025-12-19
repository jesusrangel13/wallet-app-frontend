'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Group, SplitType } from '@/types'
import { groupAPI } from '@/lib/api'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

interface Participant {
  userId: string
  userName: string
  amountOwed: number
  percentage?: number
  shares?: number
}

interface SharedExpenseFormProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  totalAmount: number
  currency: string
  onChange: (data: SharedExpenseData | null) => void
  error?: string
  initialData?: SharedExpenseData
}

export interface SharedExpenseData {
  groupId: string
  paidByUserId: string
  splitType: SplitType
  participants: Participant[]
}

export default function SharedExpenseForm({
  enabled,
  onToggle,
  totalAmount,
  currency,
  onChange,
  error,
  initialData,
}: SharedExpenseFormProps) {
  const t = useTranslations('sharedExpense')
  const tCommon = useTranslations('common.actions')
  const { user } = useAuthStore()
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')

  const SPLIT_TYPE_OPTIONS: { value: SplitType; label: string; description: string }[] = useMemo(() => [
    {
      value: 'EQUAL',
      label: t('splitTypes.equal'),
      description: t('splitTypes.equalDescription'),
    },
    {
      value: 'PERCENTAGE',
      label: t('splitTypes.percentage'),
      description: t('splitTypes.percentageDescription'),
    },
    {
      value: 'EXACT',
      label: t('splitTypes.exact'),
      description: t('splitTypes.exactDescription'),
    },
    {
      value: 'SHARES',
      label: t('splitTypes.shares'),
      description: t('splitTypes.sharesDescription'),
    },
  ], [t])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [paidByUserId, setPaidByUserId] = useState<string>('')
  const [splitType, setSplitType] = useState<SplitType>('EQUAL')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showCalculationFeedback, setShowCalculationFeedback] = useState(false)

  const loadGroups = useCallback(async () => {
    try {
      setIsLoadingGroups(true)
      const response = await groupAPI.getAll()
      // El backend devuelve array directo sin paginación params
      const groupsData = Array.isArray(response.data) ? response.data : (response.data as any).data
      setGroups(groupsData)
    } catch (error) {
      console.error('Failed to load groups:', error)
    } finally {
      setIsLoadingGroups(false)
    }
  }, [])

  const calculateSplit = useCallback(() => {
    if (!totalAmount || participants.length === 0) return

    let updatedParticipants = [...participants]

    switch (splitType) {
      case 'EQUAL':
        const equalAmount = totalAmount / participants.length
        updatedParticipants = participants.map((p) => ({
          ...p,
          amountOwed: equalAmount,
          percentage: undefined,
          shares: undefined,
        }))
        break

      case 'PERCENTAGE':
        updatedParticipants = participants.map((p) => ({
          ...p,
          amountOwed: (totalAmount * (p.percentage || 0)) / 100,
        }))
        break

      case 'EXACT':
        // Keep manual amounts
        break

      case 'SHARES':
        const totalShares = participants.reduce((sum, p) => sum + (p.shares || 1), 0)
        updatedParticipants = participants.map((p) => ({
          ...p,
          amountOwed: (totalAmount * (p.shares || 1)) / totalShares,
        }))
        break
    }

    setParticipants(updatedParticipants)
  }, [totalAmount, participants, splitType])

  useEffect(() => {
    if (enabled) {
      loadGroups()
    }
  }, [enabled, loadGroups])

  // Reset initialization when initialData changes (to support editing different expenses)
  useEffect(() => {
    if (initialData) {
      setIsInitialized(false)
    }
  }, [initialData])

  // Load initial data when editing a shared expense
  useEffect(() => {
    if (enabled && initialData && groups.length > 0 && !isInitialized) {
      const group = groups.find((g) => g.id === initialData.groupId)

      setSelectedGroupId(initialData.groupId)
      setSelectedGroup(group || null)
      setPaidByUserId(initialData.paidByUserId)
      setSplitType(initialData.splitType)
      setParticipants(initialData.participants)
      setIsInitialized(true)
    }
  }, [enabled, initialData, groups, isInitialized])

  useEffect(() => {
    // Only handle new group selection (not from initial data)
    // If editing (initialData exists), skip this - the first useEffect handles it
    if (selectedGroupId && !initialData && !isInitialized) {
      const group = groups.find((g) => g.id === selectedGroupId)
      setSelectedGroup(group || null)
      if (group) {
        // Load default split type from group settings
        const defaultSplitType = group.defaultSplitType || 'EQUAL'
        setSplitType(defaultSplitType)

        // Initialize participants from group members with default values
        const initialParticipants = group.members.map((member) => {
          // Find default split setting for this member
          const defaultSplit = group.defaultSplitSettings?.find(
            (setting) => setting.userId === member.userId
          )

          return {
            userId: member.userId,
            userName: member.user.name,
            amountOwed: 0,
            percentage: defaultSplitType === 'PERCENTAGE' ? (defaultSplit?.percentage ? Number(defaultSplit.percentage) : 0) : undefined,
            shares: defaultSplitType === 'SHARES' ? (defaultSplit?.shares || 1) : undefined,
          }
        })
        setParticipants(initialParticipants)

        // Preselect logged-in user if they are in the group, otherwise select first member
        if (group.members.length > 0 && !paidByUserId) {
          const currentUserInGroup = group.members.find((member) => member.userId === user?.id)
          if (currentUserInGroup) {
            setPaidByUserId(currentUserInGroup.userId)
          } else {
            setPaidByUserId(group.members[0].userId)
          }
        }
      }
    }
  }, [selectedGroupId, groups, initialData, isInitialized, paidByUserId, user?.id])

  // Create a memoized key that tracks only the input values (percentage/shares)
  // This prevents infinite loops while still recalculating when needed
  const participantsKey = useMemo(() => {
    if (splitType === 'PERCENTAGE') {
      return participants.map(p => `${p.userId}:${p.percentage || 0}:${p.amountOwed}`).join('|')
    } else if (splitType === 'SHARES') {
      return participants.map(p => `${p.userId}:${p.shares || 1}:${p.amountOwed}`).join('|')
    } else if (splitType === 'EXACT') {
      return participants.map(p => `${p.userId}:${p.amountOwed}`).join('|')
    } else {
      return `${participants.length}:${participants.map(p => p.amountOwed).join(',')}`
    }
  }, [participants, splitType])

  useEffect(() => {
    // Recalculate amounts when split type or total changes
    if (participants.length > 0 && totalAmount > 0) {
      // Always recalculate when we have a valid total amount
      calculateSplit()

      // Show feedback when calculation happens automatically (not editing)
      if (!initialData && selectedGroupId) {
        setShowCalculationFeedback(true)
        const timer = setTimeout(() => setShowCalculationFeedback(false), 2000)
        return () => clearTimeout(timer)
      }
    } else if (participants.length > 0 && splitType && totalAmount === 0) {
      // Check if defaults are loaded (percentage/shares) but total amount is 0
      // When totalAmount becomes available later, this will recalculate
      const hasDefaults = participants.some(p => p.percentage !== undefined || p.shares !== undefined)
      if (hasDefaults) {
        // Defaults are loaded, just waiting for totalAmount to be set
        // The first condition above will trigger when totalAmount > 0
      }
    }
  }, [splitType, totalAmount, participantsKey, calculateSplit, initialData, selectedGroupId, participants.length])

  useEffect(() => {
    // Notify parent of changes
    if (enabled && selectedGroupId && paidByUserId && participants.length > 0) {
      onChange({
        groupId: selectedGroupId,
        paidByUserId,
        splitType,
        participants,
      })
    } else {
      onChange(null)
    }
  }, [enabled, selectedGroupId, paidByUserId, splitType, participantsKey, onChange, participants])

  const handleParticipantChange = (userId: string, field: string, value: number) => {
    setParticipants((prevParticipants) => {
      const updated = prevParticipants.map((p) => {
        if (p.userId === userId) {
          const updatedParticipant = { ...p, [field]: value }

          // Recalculate amountOwed based on the field being changed
          if (field === 'percentage' && splitType === 'PERCENTAGE') {
            updatedParticipant.amountOwed = (totalAmount * value) / 100
          } else if (field === 'shares' && splitType === 'SHARES') {
            // Calculate total shares to recalculate amount
            const totalShares = prevParticipants.reduce((sum, participant) => {
              if (participant.userId === userId) {
                return sum + value
              }
              return sum + (participant.shares || 1)
            }, 0)
            updatedParticipant.amountOwed = (totalAmount * value) / totalShares
          }

          return updatedParticipant
        }
        return p
      })

      // Recalculate all amounts for SHARES to redistribute correctly
      if (field === 'shares' && splitType === 'SHARES') {
        const totalShares = updated.reduce((sum, p) => sum + (p.shares || 1), 0)
        return updated.map((p) => ({
          ...p,
          amountOwed: (totalAmount * (p.shares || 1)) / totalShares,
        }))
      }

      return updated
    })
  }

  const getTotalPercentage = () => {
    return participants.reduce((sum, p) => sum + (p.percentage || 0), 0)
  }

  const getTotalAmount = () => {
    return participants.reduce((sum, p) => sum + p.amountOwed, 0)
  }

  if (!enabled) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-4">
        <button
          type="button"
          onClick={() => onToggle(true)}
          className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {t('addButton')}
        </button>
      </div>
    )
  }

  return (
    <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {t('title')}
        </h3>
        <button
          type="button"
          onClick={() => onToggle(false)}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {t('remove')}
        </button>
      </div>

      {/* Helpful hint */}
      <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 flex items-start gap-2">
        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <p className="text-xs text-blue-800" dangerouslySetInnerHTML={{ __html: t('hint') }} />
      </div>

      {/* Select Group */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('groupLabel')} <span className="text-red-500">*</span>
        </label>
        {isLoadingGroups ? (
          <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
        ) : (
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{t('selectGroup')}</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({t('groupMembers', { count: group.members.length })})
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedGroup && (
        <>
          {/* Feedback when group is selected but no amount yet */}
          {totalAmount === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-amber-800" dangerouslySetInnerHTML={{ __html: t('noAmountYet') }} />
            </div>
          )}

          {/* Feedback when calculation completes */}
          {showCalculationFeedback && totalAmount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 animate-pulse">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-green-800 font-medium">
                {t('calculationComplete', { amount: formatCurrency(totalAmount, currency) })}
              </p>
            </div>
          )}

          {/* Paid By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('paidBy')} <span className="text-red-500">*</span>
            </label>
            <select
              value={paidByUserId}
              onChange={(e) => setPaidByUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t('selectWhoPaid')}</option>
              {selectedGroup.members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Split Type */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('splitType')} <span className="text-red-500">*</span>
              </label>
              {selectedGroup?.defaultSplitType && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {t('usingGroupDefaults')}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SPLIT_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSplitType(option.value)}
                  className={cn(
                    'p-3 border-2 rounded-lg text-left transition-all',
                    splitType === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Participants */}
          {participants.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('splitBetween', { count: participants.length })}
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {participants.map((participant) => (
                  <div
                    key={participant.userId}
                    className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{participant.userName}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {splitType === 'PERCENTAGE' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={participant.percentage || 0}
                            onChange={(e) =>
                              handleParticipantChange(
                                participant.userId,
                                'percentage',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      )}

                      {splitType === 'EXACT' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={participant.amountOwed || 0}
                            onChange={(e) =>
                              handleParticipantChange(
                                participant.userId,
                                'amountOwed',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      )}

                      {splitType === 'SHARES' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={participant.shares || 1}
                            onChange={(e) =>
                              handleParticipantChange(
                                participant.userId,
                                'shares',
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-600">{t('shares')}</span>
                        </div>
                      )}

                      <div className="text-right min-w-[80px]">
                        <p className="text-sm font-semibold">
                          {formatCurrency(participant.amountOwed, currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                {splitType === 'PERCENTAGE' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('totalPercentage')}</span>
                    <span
                      className={cn(
                        'font-medium',
                        Math.abs(getTotalPercentage() - 100) > 0.01 ? 'text-red-600' : 'text-green-600'
                      )}
                    >
                      {getTotalPercentage().toFixed(2)}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('totalSplit')}</span>
                  <span
                    className={cn(
                      'font-medium',
                      Math.abs(getTotalAmount() - totalAmount) > 0.01 ? 'text-red-600' : 'text-green-600'
                    )}
                  >
                    {formatCurrency(getTotalAmount(), currency)}
                  </span>
                </div>
                {Math.abs(getTotalAmount() - totalAmount) > 0.01 && (
                  <p className="text-xs text-red-600">
                    {t('splitMismatch')}
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}
