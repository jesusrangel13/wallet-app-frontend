'use client'

import { useState, useEffect, useMemo, useCallback, useRef, useId } from 'react'
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
  hideToggle?: boolean
  availableGroups?: Group[] // Optional pre-fetched groups
}

export interface SharedExpenseData {
  groupId: string
  paidByUserId: string
  splitType: SplitType
  participants: Participant[]
  categoryId?: string
}

// Helper to get initials
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Helper for avatar colors
const AVATAR_COLORS = [
  'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
]

export default function SharedExpenseForm({
  enabled,
  onToggle,
  totalAmount,
  currency,
  onChange,
  error,
  initialData,
  hideToggle = false,
  availableGroups,
}: SharedExpenseFormProps) {
  const t = useTranslations('sharedExpense')
  const { user } = useAuthStore()
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')

  // Accessibility IDs
  const groupSelectId = useId()
  const paidBySelectId = useId()
  const splitTypeGroupId = useId()

  const SPLIT_TYPE_OPTIONS: { value: SplitType; label: string; icon: string }[] = useMemo(() => [
    { value: 'EQUAL', label: t('splitTypes.equal'), icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { value: 'PERCENTAGE', label: t('splitTypes.percentage'), icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z' },
    { value: 'EXACT', label: t('splitTypes.exact'), icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { value: 'SHARES', label: t('splitTypes.shares'), icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ], [t])

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [paidByUserId, setPaidByUserId] = useState<string>('')
  const [splitType, setSplitType] = useState<SplitType>('EQUAL')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isFullyInitialized, setIsFullyInitialized] = useState(false)

  const participantsRef = useRef<Participant[]>([])

  // Keep ref in sync
  useEffect(() => {
    participantsRef.current = participants
  }, [participants])

  const loadGroups = useCallback(async () => {
    // Use pre-fetched groups if available
    if (availableGroups && availableGroups.length > 0) {
      setGroups(availableGroups)
      setIsLoadingGroups(false)
      return
    }

    try {
      setIsLoadingGroups(true)
      const response = await groupAPI.getAll()
      const groupsData = Array.isArray(response.data) ? response.data : (response.data as any).data
      setGroups(groupsData)
    } catch (error) {
      console.error('Failed to load groups:', error)
    } finally {
      setIsLoadingGroups(false)
    }
  }, [availableGroups])

  useEffect(() => {
    if (enabled) {
      loadGroups()
    }
  }, [enabled, loadGroups])

  // Auto-select single group
  useEffect(() => {
    if (enabled && !isLoadingGroups && groups.length === 1 && !selectedGroupId && !initialData) {
      setSelectedGroupId(groups[0].id)
    }
  }, [enabled, isLoadingGroups, groups, selectedGroupId, initialData])

  // Load initial data
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

  const participantsContentKey = useMemo(() => {
    return JSON.stringify(participants.map(p => ({
      userId: p.userId,
      amountOwed: p.amountOwed,
      percentage: p.percentage,
      shares: p.shares
    })))
  }, [participants])

  // Initial group selection effect
  useEffect(() => {
    if (selectedGroupId && !initialData && !isInitialized) {
      setIsFullyInitialized(false) // Reset when starting initialization
      const group = groups.find((g) => g.id === selectedGroupId)
      setSelectedGroup(group || null)

      if (group) {
        setSplitType((group.defaultSplitType || 'EQUAL') as SplitType)

        const initialParticipants = group.members.map((member) => {
          const defaultSplit = group.defaultSplitSettings?.find(s => s.userId === member.userId)
          return {
            userId: member.userId,
            userName: member.user.name,
            amountOwed: 0,
            percentage: splitType === 'PERCENTAGE' ? (defaultSplit?.percentage ? Number(defaultSplit.percentage) : 0) : undefined,
            shares: splitType === 'SHARES' ? (defaultSplit?.shares || 1) : undefined,
          }
        })
        setParticipants(initialParticipants)

        if (group.members.length > 0) {
          const currentPayerInGroup = group.members.find(m => m.userId === paidByUserId)
          if (!currentPayerInGroup) {
            const currentUserInGroup = group.members.find((member) => member.userId === user?.id)
            setPaidByUserId(currentUserInGroup ? currentUserInGroup.userId : group.members[0].userId)
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupId, groups, initialData, isInitialized]) // Removed paidByUserId/user?.id/splitType from deps

  // Trigger calculation
  const participantsKey = useMemo(() => {
    if (splitType === 'PERCENTAGE') return participants.map(p => `${p.userId}:${p.percentage || 0}`).join('|')
    if (splitType === 'SHARES') return participants.map(p => `${p.userId}:${p.shares || 1}`).join('|')
    return `${participants.length}`
  }, [participants, splitType])

  const calculateSplit = useCallback(() => {
    const currentParticipants = participantsRef.current
    if (!totalAmount || currentParticipants.length === 0) return

    let updatedParticipants = [...currentParticipants]
    let hasChanges = false

    switch (splitType) {
      case 'EQUAL':
        const equalAmount = totalAmount / currentParticipants.length
        updatedParticipants = currentParticipants.map((p) => {
          if (Math.abs(p.amountOwed - equalAmount) > 0.001) hasChanges = true
          return { ...p, amountOwed: equalAmount, percentage: undefined, shares: undefined }
        })
        break
      case 'PERCENTAGE':
        updatedParticipants = currentParticipants.map((p) => {
          const newAmount = (totalAmount * (p.percentage || 0)) / 100
          if (Math.abs(p.amountOwed - newAmount) > 0.001) hasChanges = true
          return { ...p, amountOwed: newAmount }
        })
        break
      case 'SHARES':
        const totalShares = currentParticipants.reduce((sum, p) => sum + (p.shares || 1), 0)
        updatedParticipants = currentParticipants.map((p) => {
          const newAmount = (totalAmount * (p.shares || 1)) / totalShares
          if (Math.abs(p.amountOwed - newAmount) > 0.001) hasChanges = true
          return { ...p, amountOwed: newAmount }
        })
        break
    }

    if (hasChanges) setParticipants(updatedParticipants)
  }, [totalAmount, splitType])

  useEffect(() => {
    if (participants.length > 0 && totalAmount > 0) {
      calculateSplit()
      // Mark as fully initialized after first calculation
      if (!isFullyInitialized && selectedGroup) {
        setTimeout(() => setIsFullyInitialized(true), 50)
      }
    }
  }, [splitType, totalAmount, participantsKey, calculateSplit, isFullyInitialized, selectedGroup])

  // Notify parent
  const prevNotifyData = useRef<string>('')
  useEffect(() => {
    if (enabled && selectedGroupId && paidByUserId && participants.length > 0) {
      const newData = { groupId: selectedGroupId, paidByUserId, splitType, participants }
      const newDataString = JSON.stringify(newData)
      if (newDataString !== prevNotifyData.current) {
        prevNotifyData.current = newDataString
        onChange(newData)
      }
    } else {
      if (prevNotifyData.current !== 'null') {
        prevNotifyData.current = 'null'
        onChange(null)
      }
    }
  }, [enabled, selectedGroupId, paidByUserId, splitType, participantsContentKey, onChange])

  const handleParticipantChange = (userId: string, field: string, value: number) => {
    setParticipants((prev) => {
      const updated = prev.map((p) => {
        if (p.userId === userId) {
          const newP = { ...p, [field]: value }
          if (field === 'percentage' && splitType === 'PERCENTAGE') newP.amountOwed = (totalAmount * value) / 100
          return newP
        }
        return p
      })

      // Recalc for shares whole group
      if (field === 'shares' && splitType === 'SHARES') {
        const totalShares = updated.reduce((sum, p) => sum + (p.shares || 1), 0)
        return updated.map((p) => ({ ...p, amountOwed: (totalAmount * (p.shares || 1)) / totalShares }))
      }
      return updated
    })
  }

  const getSummary = () => {
    if (!selectedGroup || !paidByUserId) return null
    const payer = participants.find(p => p.userId === paidByUserId)
    const currentUser = participants.find(p => p.userId === user?.id)

    // Case 1: You paid, everyone owes you
    if (paidByUserId === user?.id) {
      const userOwesSelf = currentUser?.amountOwed || 0
      const lendingTotal = totalAmount - userOwesSelf
      return {
        text: t('youLent', { amount: formatCurrency(lendingTotal, currency) }),
        type: 'positive'
      }
    }

    // Case 2: Someone else paid, you owe them
    if (currentUser) {
      return {
        text: t('youOwe', { name: payer?.userName || '?', amount: formatCurrency(currentUser.amountOwed, currency) }),
        type: 'negative'
      }
    }

    return null
  }

  if (!enabled) {
    if (hideToggle) return null;
    return (
      <div className="rounded-xl border border-dashed border-border p-4 hover:bg-muted/30 transition-colors">
        <button
          type="button"
          onClick={() => onToggle(true)}
          className="w-full flex items-center justify-center gap-2 text-primary font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          {t('addButton')}
        </button>
      </div>
    )
  }

  const summary = getSummary()

  return (
    <div className={`space-y-6 ${hideToggle ? '' : 'p-4 border rounded-xl bg-card shadow-sm'}`}>
      {!hideToggle && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            {t('title')}
          </h3>
          <button type="button" onClick={() => onToggle(false)} className="text-sm text-muted-foreground hover:text-destructive transition-colors">{t('remove')}</button>
        </div>
      )}

      {/* 1. Group Selection Cards */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('groupLabel')}</label>
        {isLoadingGroups ? (
          <div className="h-20 animate-pulse bg-muted rounded-xl" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroupId(group.id)}
                className={cn(
                  "p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden group",
                  selectedGroupId === group.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <div className="font-semibold text-sm truncate">{group.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{t('groupMembers', { count: group.members.length })}</div>
                {selectedGroupId === group.id && (
                  <div className="absolute top-2 right-2 text-primary">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedGroup && (
        <>
          {!isFullyInitialized ? (
            // Loading skeleton while initializing
            <div className="space-y-6 animate-pulse">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-muted rounded"></div>
                <div className="flex gap-3">
                  <div className="h-10 w-24 bg-muted rounded-full"></div>
                  <div className="h-10 w-24 bg-muted rounded-full"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-24 bg-muted rounded"></div>
                <div className="h-12 bg-muted rounded-lg"></div>
              </div>
              <div className="h-32 bg-muted/30 rounded-xl"></div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

              {/* 2. Paid By Avatars */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('paidBy')}</label>
                <div className="flex flex-wrap gap-3">
                  {selectedGroup.members.map((member, idx) => (
                    <button
                      key={member.userId}
                      type="button"
                      onClick={() => setPaidByUserId(member.userId)}
                      className={cn(
                        "flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all",
                        paidByUserId === member.userId
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "bg-background border-border hover:bg-muted"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        paidByUserId === member.userId ? "bg-white text-primary" : AVATAR_COLORS[idx % AVATAR_COLORS.length]
                      )}>
                        {getInitials(member.user.name)}
                      </div>
                      <span className="text-sm font-medium">{member.user.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Split Type Segmented Control */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('splitType')}</label>
                <div className="flex p-1 bg-muted rounded-lg overflow-x-auto">
                  {SPLIT_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSplitType(option.value)}
                      className={cn(
                        "flex-1 min-w-[80px] py-1.5 px-2 rounded-md text-xs font-medium transition-all flex flex-col items-center gap-1",
                        splitType === option.value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={option.icon} /></svg>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Participants List & Summary */}
              {participants.length > 0 && (
                <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                  {/* Summary Banner */}
                  {summary && (
                    <div className={cn(
                      "mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2",
                      summary.type === 'positive' ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    )}>
                      {summary.type === 'positive' ? (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                      ) : (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                      )}
                      {summary.text}
                    </div>
                  )}

                  <div className="space-y-3">
                    {participants.map((participant, index) => (
                      <div key={participant.userId} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                            AVATAR_COLORS[index % AVATAR_COLORS.length]
                          )}>
                            {getInitials(participant.userName)}
                          </div>
                          <span className="text-sm font-medium">{participant.userName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Detail Inputs (Percentage/Shares/Exact) */}
                          {splitType === 'PERCENTAGE' && (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={participant.percentage || 0}
                                onChange={(e) => handleParticipantChange(participant.userId, 'percentage', parseFloat(e.target.value) || 0)}
                                className="w-16 text-right rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              />
                              <span className="text-xs text-muted-foreground">%</span>
                            </div>
                          )}
                          {splitType === 'SHARES' && (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                value={participant.shares || 1}
                                onChange={(e) => handleParticipantChange(participant.userId, 'shares', parseInt(e.target.value) || 1)}
                                className="w-16 text-right rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              />
                              <span className="text-xs text-muted-foreground">parts</span>
                            </div>
                          )}
                          {splitType === 'EXACT' && (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={participant.amountOwed || 0}
                                onChange={(e) => handleParticipantChange(participant.userId, 'amountOwed', parseFloat(e.target.value) || 0)}
                                className="w-20 text-right rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              />
                            </div>
                          )}
                          {/* Amount Display */}
                          <span className={cn(
                            "text-sm font-mono font-medium",
                            participant.userId === paidByUserId ? "text-green-600 dark:text-green-400" : "text-foreground"
                          )}>
                            {formatCurrency(participant.amountOwed, currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Mismatch Warning */}
                  {Math.abs(participants.reduce((sum, p) => sum + p.amountOwed, 0) - totalAmount) > 0.05 && (
                    <div className="mt-3 pt-2 border-t border-border flex justify-between text-xs text-destructive">
                      <span>{t('totalSplit')}</span>
                      <span>{formatCurrency(participants.reduce((sum, p) => sum + p.amountOwed, 0), currency)} / {formatCurrency(totalAmount, currency)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {error && <p className="text-destructive text-sm" role="alert">{error}</p>}
    </div>
  )
}
