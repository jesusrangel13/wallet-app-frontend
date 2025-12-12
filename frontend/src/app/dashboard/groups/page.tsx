'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Group, CreateGroupForm, SplitType, GroupMemberSplitDefault } from '@/types'
import { groupAPI, sharedExpenseAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { MarkAsPaidButtonStyled } from '@/components/MarkAsPaidButtonStyled'
import { formatCurrency } from '@/types/currency'
import { LoadingPage, LoadingSpinner, LoadingMessages } from '@/components/ui/Loading'
import { Tooltip } from '@/components/ui/Tooltip'

const GROUP_COVER_IMAGES = [
  '🏠', '👨‍👩‍👧‍👦', '🎉', '✈️', '🏖️', '🎓', '💼', '🎮', '🍕', '🎬',
  '⚽', '🎸', '📚', '💪', '🎨', '🌍', '🚗', '🏃', '🎯', '🌟'
]

export default function GroupsPage() {
  const { user } = useAuthStore()
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [viewingGroup, setViewingGroup] = useState<Group | null>(null)
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [activeTab, setActiveTab] = useState<'members' | 'split' | 'balances'>('members')
  const [groupExpenses, setGroupExpenses] = useState<any[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(false)

  // Split configuration state
  const [isEditingSplit, setIsEditingSplit] = useState(false)
  const [splitType, setSplitType] = useState<SplitType>('EQUAL')
  const [memberSplits, setMemberSplits] = useState<Record<string, { percentage?: number; shares?: number; exactAmount?: number }>>({})

  // Form state
  const [formData, setFormData] = useState<{
    name: string
    description: string
    coverImageUrl: string
    memberEmails: string[]
    defaultSplitType: SplitType
  }>({
    name: '',
    description: '',
    coverImageUrl: '👨‍👩‍👧‍👦',
    memberEmails: [],
    defaultSplitType: 'EQUAL',
  })
  const [newEmailInput, setNewEmailInput] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Split configuration for new group creation
  const [splitConfig, setSplitConfig] = useState<Record<string, { percentage?: number; shares?: number; exactAmount?: number }>>({})

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      setIsLoading(true)
      const response = await groupAPI.getAll()
      // El backend devuelve array directo sin paginación params
      const groupsData = Array.isArray(response.data) ? response.data : (response.data as any).data
      setGroups(groupsData)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load groups')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingGroup(null)
    setFormData({
      name: '',
      description: '',
      coverImageUrl: '👨‍👩‍👧‍👦',
      memberEmails: [],
      defaultSplitType: 'EQUAL',
    })
    setNewEmailInput('')
    setEmailError('')
    setSplitConfig({})
    setIsModalOpen(true)
  }

  const handleEdit = (group: Group) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description || '',
      coverImageUrl: group.coverImageUrl || '👨‍👩‍👧‍👦',
      memberEmails: [],
      defaultSplitType: group.defaultSplitType || 'EQUAL',
    })
    setNewEmailInput('')
    setEmailError('')
    setIsModalOpen(true)
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleAddEmail = () => {
    const email = newEmailInput.trim().toLowerCase()

    if (!email) {
      setEmailError('Please enter an email')
      return
    }

    if (!validateEmail(email)) {
      setEmailError('Invalid email format')
      return
    }

    if (formData.memberEmails.includes(email)) {
      setEmailError('Email already added')
      return
    }

    if (user?.email && email === user.email.toLowerCase()) {
      setEmailError('You will be added automatically as creator')
      return
    }

    setFormData({
      ...formData,
      memberEmails: [...formData.memberEmails, email],
    })
    setNewEmailInput('')
    setEmailError('')
  }

  const handleRemoveEmail = (emailToRemove: string) => {
    setFormData({
      ...formData,
      memberEmails: formData.memberEmails.filter(email => email !== emailToRemove),
    })
    // Also remove from split config
    const newSplitConfig = { ...splitConfig }
    delete newSplitConfig[emailToRemove]
    setSplitConfig(newSplitConfig)
  }

  const getAllMembersForSplit = () => {
    // Include creator (current user) + all added member emails
    const members: string[] = []
    if (user?.email) {
      members.push(user.email)
    }
    members.push(...formData.memberEmails)
    return members
  }

  const getSplitConfigTotal = () => {
    if (formData.defaultSplitType === 'PERCENTAGE') {
      return Object.values(splitConfig).reduce((sum, config) => sum + (config.percentage || 0), 0)
    }
    return 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Group name is required')
      return
    }

    // Validate split configuration if not EQUAL
    if (formData.defaultSplitType === 'PERCENTAGE') {
      const total = getSplitConfigTotal()
      if (total !== 100 && Object.keys(splitConfig).length > 0) {
        toast.error('Percentages must add up to 100%')
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Build member split settings array
      const memberSplitSettings =
        formData.defaultSplitType !== 'EQUAL' && Object.keys(splitConfig).length > 0
          ? Object.entries(splitConfig).map(([email, config]) => ({
            email,
            percentage: formData.defaultSplitType === 'PERCENTAGE' ? config.percentage : undefined,
            shares: formData.defaultSplitType === 'SHARES' ? config.shares : undefined,
            exactAmount: formData.defaultSplitType === 'EXACT' ? config.exactAmount : undefined,
          }))
          : undefined

      const payload: CreateGroupForm = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        coverImageUrl: formData.coverImageUrl,
        memberEmails: formData.memberEmails.length > 0 ? formData.memberEmails : undefined,
        defaultSplitType: formData.defaultSplitType,
        memberSplitSettings,
      }

      if (editingGroup) {
        await groupAPI.update(editingGroup.id, {
          name: payload.name,
          description: payload.description,
          coverImageUrl: payload.coverImageUrl,
        })
        toast.success('Group updated successfully')
      } else {
        const response = await groupAPI.create(payload)
        const data = response.data.data as any

        // Check for member add results
        if (data.memberAddResults) {
          const failed = data.memberAddResults.filter((r: any) => !r.success)
          const succeeded = data.memberAddResults.filter((r: any) => r.success)

          if (succeeded.length > 0) {
            toast.success(`Group created! ${succeeded.length} member(s) added successfully`)
          } else {
            toast.success('Group created successfully')
          }

          if (failed.length > 0) {
            failed.forEach((f: any) => {
              toast.error(`Could not add ${f.email}: ${f.error}`)
            })
          }
        } else {
          toast.success('Group created successfully')
        }
      }

      loadGroups()
      setIsModalOpen(false)
      setFormData({
        name: '',
        description: '',
        coverImageUrl: '👨‍👩‍👧‍👦',
        memberEmails: [],
        defaultSplitType: 'EQUAL',
      })
      setNewEmailInput('')
      setEmailError('')
      setSplitConfig({})
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save group')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? All shared expenses in this group will also be deleted. This action cannot be undone.`
      )
    ) {
      return
    }

    try {
      await groupAPI.delete(id)
      toast.success('Group deleted successfully')
      loadGroups()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete group')
    }
  }

  const handleLeaveGroup = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to leave "${name}"?`)) {
      return
    }

    try {
      await groupAPI.leave(id)
      toast.success('Left group successfully')
      loadGroups()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to leave group')
    }
  }

  const handleViewGroup = (group: Group) => {
    setViewingGroup(group)
    // Load split configuration
    setSplitType(group.defaultSplitType || 'EQUAL')

    // Initialize member splits from defaultSplitSettings
    const splits: Record<string, { percentage?: number; shares?: number; exactAmount?: number }> = {}
    group.defaultSplitSettings?.forEach(setting => {
      splits[setting.userId] = {
        percentage: setting.percentage ? Number(setting.percentage) : undefined,
        shares: setting.shares || undefined,
        exactAmount: setting.exactAmount ? Number(setting.exactAmount) : undefined,
      }
    })
    setMemberSplits(splits)
    setIsEditingSplit(false)
  }

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !viewingGroup) {
      toast.error('Email is required')
      return
    }

    try {
      setIsAddingMember(true)
      await groupAPI.addMember(viewingGroup.id, newMemberEmail.trim())
      toast.success('Member added successfully')
      setNewMemberEmail('')
      setIsAddMemberModalOpen(false)
      // Reload groups to get updated member list
      await loadGroups()
      // Update viewing group with fresh data
      const updatedGroup = groups.find(g => g.id === viewingGroup.id)
      if (updatedGroup) {
        setViewingGroup(updatedGroup)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add member')
    } finally {
      setIsAddingMember(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!viewingGroup) return

    if (!confirm(`Remove ${memberName} from the group?`)) {
      return
    }

    try {
      await groupAPI.removeMember(viewingGroup.id, memberId)
      toast.success('Member removed successfully')
      // Reload groups to get updated member list
      await loadGroups()
      // Update viewing group with fresh data
      const updatedGroup = groups.find(g => g.id === viewingGroup.id)
      if (updatedGroup) {
        setViewingGroup(updatedGroup)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove member')
    }
  }

  const handleSaveSplitConfig = async () => {
    if (!viewingGroup) return

    try {
      // Validate percentages add up to 100 if using PERCENTAGE
      if (splitType === 'PERCENTAGE') {
        const total = Object.values(memberSplits).reduce((sum, split) => sum + (split.percentage || 0), 0)
        if (total !== 100) {
          toast.error('Percentages must add up to 100%')
          return
        }
      }

      // Build member splits array
      const memberSplitsArray = Object.entries(memberSplits).map(([userId, split]) => ({
        userId,
        percentage: splitType === 'PERCENTAGE' ? split.percentage : undefined,
        shares: splitType === 'SHARES' ? split.shares : undefined,
        exactAmount: splitType === 'EXACT' ? split.exactAmount : undefined,
      }))

      await groupAPI.updateDefaultSplit(viewingGroup.id, {
        defaultSplitType: splitType,
        memberSplits: memberSplitsArray,
      })

      toast.success('Default split configuration saved')
      setIsEditingSplit(false)
      // Reload groups to get updated data
      await loadGroups()
      const updatedGroup = groups.find(g => g.id === viewingGroup.id)
      if (updatedGroup) {
        setViewingGroup(updatedGroup)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save split configuration')
    }
  }

  const loadGroupExpenses = async (groupId: string) => {
    try {
      setLoadingExpenses(true)
      const res = await sharedExpenseAPI.getAll(groupId)
      console.log('📊 Loaded expenses:', res.data.data)

      // Log isPaid status for all participants
      res.data.data.forEach((expense: any) => {
        console.log(`💡 Expense ${expense.description}:`)
        expense.participants.forEach((p: any) => {
          console.log(`  - ${p.user.name}: isPaid = ${p.isPaid}`)
        })
      })

      setGroupExpenses(res.data.data)
    } catch (error: any) {
      toast.error('Failed to load group expenses')
      console.error(error)
    } finally {
      setLoadingExpenses(false)
    }
  }

  // Load expenses when switching to balances tab
  useEffect(() => {
    if (viewingGroup && activeTab === 'balances') {
      loadGroupExpenses(viewingGroup.id)
    }
  }, [activeTab, viewingGroup])

  if (isLoading) {
    return <LoadingPage message={LoadingMessages.groups} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600 mt-1">Manage your expense sharing groups</p>
        </div>
        <Button onClick={handleAddNew}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Group
        </Button>
      </div>

      {/* Groups Grid - Diseño Compacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {groups.map((group) => {
          const isCreator = group.createdBy === group.members[0]?.userId
          const memberCount = group.members.length
          const totalExpenses = group._count?.expenses || 0
          const pendingExpenses = group._count?.pendingExpenses || 0

          return (
            <Card key={group.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{group.coverImageUrl}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{group.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <Tooltip content={`${memberCount} miembro${memberCount !== 1 ? 's' : ''}`} side="top">
                        <span>{memberCount}👥</span>
                      </Tooltip>
                      <Tooltip content={`${totalExpenses} gasto${totalExpenses !== 1 ? 's' : ''} total${totalExpenses !== 1 ? 'es' : ''}`} side="top">
                        <span>{totalExpenses}📝</span>
                      </Tooltip>
                      {pendingExpenses > 0 && (
                        <Tooltip content={`${pendingExpenses} gasto${pendingExpenses !== 1 ? 's' : ''} pendiente${pendingExpenses !== 1 ? 's' : ''}`} side="top">
                          <span className="text-orange-600">{pendingExpenses}⏳</span>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-3">
                  {group.members.slice(0, 4).map((member) => (
                    <Tooltip key={member.id} content={member.user.name} side="top">
                      <div
                        className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white"
                      >
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                    </Tooltip>
                  ))}
                  {group.members.length > 4 && (
                    <Tooltip content={`${group.members.length - 4} miembro${group.members.length - 4 !== 1 ? 's' : ''} más`} side="top">
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-semibold ring-2 ring-white">
                        +{group.members.length - 4}
                      </div>
                    </Tooltip>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewGroup(group)}
                    className="flex-1 py-1.5 px-3 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium"
                  >
                    Ver
                  </button>
                  {isCreator ? (
                    <button
                      onClick={() => handleDelete(group.id, group.name)}
                      className="py-1.5 px-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLeaveGroup(group.id, group.name)}
                      className="py-1.5 px-3 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {groups.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-16 text-center">
                <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No groups yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first group to start sharing expenses with friends and family
                </p>
                <Button onClick={handleAddNew}>Create Your First Group</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Group Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingGroup(null)
          setShowImagePicker(false)
          setNewEmailInput('')
          setEmailError('')
        }}
        title={editingGroup ? 'Edit Group' : 'Create Group'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Cover Image Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowImagePicker(!showImagePicker)}
                className="w-full h-24 border-2 border-gray-300 rounded-lg flex items-center justify-center text-6xl hover:border-blue-500 transition-colors bg-gradient-to-br from-blue-500 to-purple-600"
              >
                <span className="text-white drop-shadow-lg">{formData.coverImageUrl}</span>
              </button>
              {showImagePicker && (
                <div className="absolute z-10 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg w-full">
                  <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                    {GROUP_COVER_IMAGES.map((image) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, coverImageUrl: image })
                          setShowImagePicker(false)
                        }}
                        className="text-4xl hover:bg-gray-100 rounded p-2"
                      >
                        {image}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Group Name */}
          <Input
            label="Group Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Family Trip, Office Lunch"
            required
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add details about this group..."
            />
          </div>

          {/* Default Split Type - Only for new groups */}
          {!editingGroup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Split Type
              </label>
              <select
                value={formData.defaultSplitType}
                onChange={(e) => setFormData({ ...formData, defaultSplitType: e.target.value as SplitType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="EQUAL">Equal Split</option>
                <option value="PERCENTAGE">By Percentage</option>
                <option value="SHARES">By Shares</option>
                <option value="EXACT">Exact Amounts</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                This will be the default when creating shared expenses
              </p>
            </div>
          )}

          {/* Add Members - Only for new groups */}
          {!editingGroup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Members (optional)
              </label>
              <div className="space-y-3">
                {/* Email Input */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="email"
                      value={newEmailInput}
                      onChange={(e) => {
                        setNewEmailInput(e.target.value)
                        setEmailError('')
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddEmail()
                        }
                      }}
                      placeholder="member@email.com"
                      className={emailError ? 'border-red-500' : ''}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddEmail}
                    className="shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </Button>
                </div>
                {emailError && (
                  <p className="text-xs text-red-600">{emailError}</p>
                )}

                {/* Added Emails List */}
                {formData.memberEmails.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {formData.memberEmails.map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span className="text-sm text-gray-700">{email}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {formData.memberEmails.length === 0
                    ? 'You will be added automatically as the group creator'
                    : `${formData.memberEmails.length} member(s) will be invited`}
                </p>
              </div>
            </div>
          )}

          {/* Split Configuration - Only for new groups with non-EQUAL split type */}
          {!editingGroup && formData.defaultSplitType !== 'EQUAL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Configure Split Values
              </label>
              <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
                {getAllMembersForSplit().map((email) => (
                  <div key={email} className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-700 truncate block">
                          {email === user?.email ? `${user.name} (you)` : email}
                        </span>
                      </div>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        step={
                          formData.defaultSplitType === 'PERCENTAGE'
                            ? '0.01'
                            : formData.defaultSplitType === 'EXACT'
                              ? '0.01'
                              : '1'
                        }
                        min="0"
                        value={
                          formData.defaultSplitType === 'PERCENTAGE'
                            ? splitConfig[email]?.percentage || ''
                            : formData.defaultSplitType === 'SHARES'
                              ? splitConfig[email]?.shares || ''
                              : splitConfig[email]?.exactAmount || ''
                        }
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          setSplitConfig({
                            ...splitConfig,
                            [email]: {
                              percentage: formData.defaultSplitType === 'PERCENTAGE' ? value : undefined,
                              shares: formData.defaultSplitType === 'SHARES' ? value : undefined,
                              exactAmount: formData.defaultSplitType === 'EXACT' ? value : undefined,
                            },
                          })
                        }}
                        placeholder={
                          formData.defaultSplitType === 'PERCENTAGE'
                            ? '%'
                            : formData.defaultSplitType === 'SHARES'
                              ? 'shares'
                              : '$'
                        }
                        className="text-right text-sm"
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8">
                      {formData.defaultSplitType === 'PERCENTAGE'
                        ? '%'
                        : formData.defaultSplitType === 'SHARES'
                          ? 'sh'
                          : '$'}
                    </span>
                  </div>
                ))}
                {formData.defaultSplitType === 'PERCENTAGE' && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      Total: {getSplitConfigTotal()}%
                      {getSplitConfigTotal() !== 100 && Object.keys(splitConfig).length > 0 && (
                        <span className="text-red-600 ml-2">(must equal 100%)</span>
                      )}
                      {getSplitConfigTotal() === 100 && (
                        <span className="text-green-600 ml-2">✓</span>
                      )}
                    </p>
                  </div>
                )}
                {getAllMembersForSplit().length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    Add members above to configure their split values
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting
                ? LoadingMessages.creating
                : editingGroup
                  ? 'Update Group'
                  : formData.memberEmails.length > 0
                    ? `Create Group & Add ${formData.memberEmails.length} Member(s)`
                    : 'Create Group'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                setEditingGroup(null)
                setShowImagePicker(false)
                setNewEmailInput('')
                setEmailError('')
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Group Details Modal */}
      {viewingGroup && (
        <Modal
          isOpen={!!viewingGroup}
          onClose={() => {
            setViewingGroup(null)
            setIsAddMemberModalOpen(false)
            setNewMemberEmail('')
            setActiveTab('members')
          }}
          title={viewingGroup.name}
        >
          <div className="space-y-6">
            {/* Group Info */}
            <div>
              <div
                className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-6xl mb-4"
                style={{
                  background: viewingGroup.coverImageUrl?.startsWith('#')
                    ? viewingGroup.coverImageUrl
                    : undefined,
                }}
              >
                {!viewingGroup.coverImageUrl?.startsWith('#') && (
                  <span className="text-white drop-shadow-lg">{viewingGroup.coverImageUrl}</span>
                )}
              </div>
              {viewingGroup.description && (
                <p className="text-gray-600">{viewingGroup.description}</p>
              )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('members')}
                  className={`${activeTab === 'members'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Miembros
                </button>
                <button
                  onClick={() => setActiveTab('split')}
                  className={`${activeTab === 'split'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Configuración
                </button>
                <button
                  onClick={() => setActiveTab('balances')}
                  className={`${activeTab === 'balances'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Gastos y Balances
                </button>
              </nav>
            </div>

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">
                    Members ({viewingGroup.members.length})
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => setIsAddMemberModalOpen(true)}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Member
                  </Button>
                </div>

                {isAddMemberModalOpen && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="flex-1"
                      />
                      <Button
                        onClick={handleAddMember}
                        disabled={isAddingMember || !newMemberEmail.trim()}
                        size="sm"
                      >
                        {isAddingMember ? 'Adding...' : 'Add'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsAddMemberModalOpen(false)
                          setNewMemberEmail('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {viewingGroup.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {member.user.avatarUrl ? (
                          <Image
                            src={member.user.avatarUrl}
                            alt={member.user.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                            {member.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{member.user.name}</p>
                          <p className="text-sm text-gray-500">{member.user.email}</p>
                        </div>
                        {member.userId === viewingGroup.createdBy && (
                          <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                            Creator
                          </span>
                        )}
                      </div>
                      {member.userId !== viewingGroup.createdBy && (
                        <button
                          onClick={() => handleRemoveMember(member.id, member.user.name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}

                  {viewingGroup.members.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      No members yet. Add the first member!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Split Configuration Tab */}
            {activeTab === 'split' && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">
                    Default Split Settings
                  </h3>
                  {!isEditingSplit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingSplit(true)}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </Button>
                  )}
                </div>

                {isEditingSplit ? (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    {/* Split Type Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Split Type
                      </label>
                      <select
                        value={splitType}
                        onChange={(e) => setSplitType(e.target.value as SplitType)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="EQUAL">Equal Split</option>
                        <option value="PERCENTAGE">By Percentage</option>
                        <option value="SHARES">By Shares</option>
                        <option value="EXACT">Exact Amounts</option>
                      </select>
                    </div>

                    {/* Member Split Inputs */}
                    {splitType !== 'EQUAL' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Member Splits
                        </label>
                        <div className="space-y-2">
                          {viewingGroup.members.map((member) => (
                            <div key={member.id} className="flex items-center gap-3">
                              <div className="flex-1 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                                  {member.user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm text-gray-700">{member.user.name}</span>
                              </div>
                              <div className="w-32">
                                <Input
                                  type="number"
                                  step={splitType === 'PERCENTAGE' ? '0.01' : splitType === 'EXACT' ? '0.01' : '1'}
                                  min="0"
                                  value={
                                    splitType === 'PERCENTAGE'
                                      ? memberSplits[member.userId]?.percentage || ''
                                      : splitType === 'SHARES'
                                        ? memberSplits[member.userId]?.shares || ''
                                        : memberSplits[member.userId]?.exactAmount || ''
                                  }
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0
                                    setMemberSplits({
                                      ...memberSplits,
                                      [member.userId]: {
                                        percentage: splitType === 'PERCENTAGE' ? value : undefined,
                                        shares: splitType === 'SHARES' ? value : undefined,
                                        exactAmount: splitType === 'EXACT' ? value : undefined,
                                      },
                                    })
                                  }}
                                  placeholder={
                                    splitType === 'PERCENTAGE'
                                      ? '%'
                                      : splitType === 'SHARES'
                                        ? 'shares'
                                        : '$'
                                  }
                                  className="text-right"
                                />
                              </div>
                              <span className="text-sm text-gray-500 w-10">
                                {splitType === 'PERCENTAGE' ? '%' : splitType === 'SHARES' ? 'sh' : '$'}
                              </span>
                            </div>
                          ))}
                        </div>
                        {splitType === 'PERCENTAGE' && (
                          <p className="text-xs text-gray-600 mt-2">
                            Total: {Object.values(memberSplits).reduce((sum, split) => sum + (split.percentage || 0), 0)}%
                            {Object.values(memberSplits).reduce((sum, split) => sum + (split.percentage || 0), 0) !== 100 && (
                              <span className="text-red-600 ml-2">(must equal 100%)</span>
                            )}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveSplitConfig}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingSplit(false)
                          // Reset to current values
                          setSplitType(viewingGroup.defaultSplitType || 'EQUAL')
                          const splits: Record<string, { percentage?: number; shares?: number; exactAmount?: number }> = {}
                          viewingGroup.defaultSplitSettings?.forEach(setting => {
                            splits[setting.userId] = {
                              percentage: setting.percentage ? Number(setting.percentage) : undefined,
                              shares: setting.shares || undefined,
                              exactAmount: setting.exactAmount ? Number(setting.exactAmount) : undefined,
                            }
                          })
                          setMemberSplits(splits)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Split Type:</span>
                        <span className="text-sm text-gray-900">
                          {splitType === 'EQUAL' ? 'Equal Split' :
                            splitType === 'PERCENTAGE' ? 'By Percentage' :
                              splitType === 'SHARES' ? 'By Shares' :
                                'Exact Amounts'}
                        </span>
                      </div>
                      {splitType !== 'EQUAL' && (
                        <div className="mt-3 space-y-1">
                          {viewingGroup.members.map((member) => {
                            const split = memberSplits[member.userId]
                            if (!split) return null
                            return (
                              <div key={member.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">{member.user.name}</span>
                                <span className="font-medium text-gray-900">
                                  {splitType === 'PERCENTAGE' && split.percentage ? `${split.percentage}%` :
                                    splitType === 'SHARES' && split.shares ? `${split.shares} shares` :
                                      splitType === 'EXACT' && split.exactAmount ? `$${split.exactAmount}` :
                                        '-'}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Balances Tab */}
            {activeTab === 'balances' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Gastos compartidos del grupo
                </h3>

                {loadingExpenses ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : groupExpenses.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No hay gastos compartidos en este grupo aún</p>
                    <p className="text-sm text-gray-400">Crea una transacción compartida desde la página de transacciones</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupExpenses.map((expense: any) => (
                      <div key={expense.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{expense.description}</h4>
                            <p className="text-sm text-gray-500">
                              Pagado por: {expense.paidBy.name} • {new Date(expense.date).toLocaleDateString()}
                            </p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">
                              {formatCurrency(expense.amount, 'CLP')}
                            </p>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {expense.splitType}
                          </span>
                        </div>

                        <div className="space-y-2 mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Participantes:</p>
                          {expense.participants.map((participant: any) => (
                            <div
                              key={participant.id}
                              className="flex items-center justify-between bg-white p-3 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                  {participant.user.name.split(' ').map((n: string) => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{participant.user.name}</p>
                                  <p className="text-xs text-gray-500">
                                    Debe: {formatCurrency(participant.amountOwed, 'CLP')}
                                  </p>
                                </div>
                              </div>
                              <MarkAsPaidButtonStyled
                                expenseId={expense.id}
                                participantUserId={participant.userId}
                                currentUserId={user?.id || ''}
                                paidByUserId={expense.paidByUserId}
                                isPaid={participant.isPaid || false}
                                onSuccess={() => {
                                  if (viewingGroup) {
                                    loadGroupExpenses(viewingGroup.id)
                                  }
                                }}
                                designStyle="icon-only"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Group Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setViewingGroup(null)
                  handleEdit(viewingGroup)
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Group
              </Button>
              <Button
                variant="outline"
                onClick={() => setViewingGroup(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
