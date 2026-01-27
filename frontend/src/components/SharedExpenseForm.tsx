'use client'

import { useState, useEffect, useMemo, useCallback, useRef, useId } from 'react'
import { useTranslations } from 'next-intl'
import { Group, SplitType } from '@/types'
import { groupAPI } from '@/lib/api'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { Select } from '@/components/ui/Select'

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

  // Accessibility IDs
  const groupSelectId = useId()
  const paidBySelectId = useId()
  const splitTypeGroupId = useId()

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
  const participantsRef = useRef<Participant[]>([])

  // Keep ref in sync with participants state
  useEffect(() => {
    participantsRef.current = participants
  }, [participants])

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
    const currentParticipants = participantsRef.current
    if (!totalAmount || currentParticipants.length === 0) return

    let updatedParticipants = [...currentParticipants]

    switch (splitType) {
      case 'EQUAL':
        const equalAmount = totalAmount / currentParticipants.length
        updatedParticipants = currentParticipants.map((p) => ({
          ...p,
          amountOwed: equalAmount,
          percentage: undefined,
          shares: undefined,
        }))
        break

      case 'PERCENTAGE':
        updatedParticipants = currentParticipants.map((p) => ({
          ...p,
          amountOwed: (totalAmount * (p.percentage || 0)) / 100,
        }))
        break

      case 'EXACT':
        // Keep manual amounts
        break

      case 'SHARES':
        const totalShares = currentParticipants.reduce((sum, p) => sum + (p.shares || 1), 0)
        updatedParticipants = currentParticipants.map((p) => ({
          ...p,
          amountOwed: (totalAmount * (p.shares || 1)) / totalShares,
        }))
        break
    }

    setParticipants(updatedParticipants)
  }, [totalAmount, splitType])

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
  // CRITICAL: Do NOT include amountOwed (the OUTPUT) in the key
  const participantsKey = useMemo(() => {
    if (splitType === 'PERCENTAGE') {
      return participants.map(p => `${p.userId}:${p.percentage || 0}`).join('|')
    } else if (splitType === 'SHARES') {
      return participants.map(p => `${p.userId}:${p.shares || 1}`).join('|')
    } else {
      return `${participants.length}`
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitType, totalAmount, participantsKey, calculateSplit, initialData, selectedGroupId])

  // Notify parent when data changes
  useEffect(() => {
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
  }, [enabled, selectedGroupId, paidByUserId, splitType, participants, onChange])

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
      <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4">
        <button
          type="button"
          onClick={() => onToggle(true)}
          aria-label={t('addButton')}
          className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
    <div className="border border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-500/10 rounded-lg p-4 space-y-4" role="region" aria-label={t('title')}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
          aria-label={t('remove')}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t('remove')}
        </button>
      </div>

      {/* Helpful hint */}
      <div className="bg-blue-100 dark:bg-blue-500/20 border border-blue-300 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2" role="note">
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <p className="text-xs text-blue-800 dark:text-blue-100">{t('hint')}</p>
      </div>

      {/* Select Group */}
      <div>
        <label htmlFor={groupSelectId} className="block text-sm font-medium text-foreground mb-1">
          {t('groupLabel')} <span className="text-red-500" aria-hidden="true">*</span>
          <span className="sr-only">({t('required')})</span>
        </label>
        {isLoadingGroups ? (
          <div className="animate-pulse bg-gray-200 h-10 rounded-lg" role="status" aria-label="Loading groups"></div>
        ) : (
          <Select
            id={groupSelectId}
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            aria-required="true"
          >
            <option value="">{t('selectGroup')}</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({t('groupMembers', { count: group.members.length })})
              </option>
            ))}
          </Select>
        )}
      </div>

      {
        selectedGroup && (
          <>
            {/* Feedback when group is selected but no amount yet */}
            {totalAmount === 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2" role="alert">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-amber-800 dark:text-amber-200">{t('noAmountYet')}</p>
              </div>
            )}

            {/* Feedback when calculation completes */}
            {showCalculationFeedback && totalAmount > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2 animate-pulse" role="status" aria-live="polite">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-green-800 dark:text-green-200 font-medium">
                  {t('calculationComplete', { amount: formatCurrency(totalAmount, currency) })}
                </p>
              </div>
            )}

            {/* Paid By */}
            <div>
              <label htmlFor={paidBySelectId} className="block text-sm font-medium text-foreground mb-1">
                {t('paidBy')} <span className="text-red-500" aria-hidden="true">*</span>
                <span className="sr-only">({t('required')})</span>
              </label>
              <Select
                id={paidBySelectId}
                value={paidByUserId}
                onChange={(e) => setPaidByUserId(e.target.value)}
                aria-required="true"
              >
                <option value="">{t('selectWhoPaid')}</option>
                {selectedGroup.members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.user.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Split Type */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span id={splitTypeGroupId} className="block text-sm font-medium text-foreground">
                  {t('splitType')} <span className="text-red-500" aria-hidden="true">*</span>
                  <span className="sr-only">({t('required')})</span>
                </span>
                {selectedGroup?.defaultSplitType && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                    {t('usingGroupDefaults')}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby={splitTypeGroupId}>
                {SPLIT_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={splitType === option.value}
                    onClick={() => setSplitType(option.value)}
                    className={cn(
                      'p-3 border-2 rounded-lg text-left transition-all',
                      splitType === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-card'
                    )}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Participants */}
            {participants.length > 0 && (
              <div>
                <p className="block text-sm font-medium text-foreground mb-2" id="participants-label">
                  {t('splitBetween', { count: participants.length })}
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto" role="list" aria-labelledby="participants-label">
                  {participants.map((participant) => (
                    <div
                      key={participant.userId}
                      role="listitem"
                      className="bg-card border border-border rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{participant.userName}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {splitType === 'PERCENTAGE' && (
                          <div className="flex items-center gap-1">
                            <label className="sr-only" htmlFor={`percentage-${participant.userId}`}>
                              {t('percentageFor', { name: participant.userName })}
                            </label>
                            <input
                              id={`percentage-${participant.userId}`}
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
                              className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-background rounded"
                            />
                            <span className="text-sm text-muted-foreground" aria-hidden="true">%</span>
                          </div>
                        )}

                        {splitType === 'EXACT' && (
                          <div className="flex items-center gap-1">
                            <label className="sr-only" htmlFor={`exact-${participant.userId}`}>
                              {t('amountFor', { name: participant.userName })}
                            </label>
                            <input
                              id={`exact-${participant.userId}`}
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
                              className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-background rounded"
                            />
                          </div>
                        )}

                        {splitType === 'SHARES' && (
                          <div className="flex items-center gap-1">
                            <label className="sr-only" htmlFor={`shares-${participant.userId}`}>
                              {t('sharesFor', { name: participant.userName })}
                            </label>
                            <input
                              id={`shares-${participant.userId}`}
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
                              className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-background rounded"
                            />
                            <span className="text-sm text-muted-foreground" aria-hidden="true">{t('shares')}</span>
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
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
                  {splitType === 'PERCENTAGE' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('totalPercentage')}</span>
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
                    <span className="text-muted-foreground">{t('totalSplit')}</span>
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
                    <p className="text-xs text-red-600" role="alert">
                      {t('splitMismatch')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )
      }

      {error && <p className="text-red-500 text-sm" role="alert">{error}</p>}
    </div >
  )
}
