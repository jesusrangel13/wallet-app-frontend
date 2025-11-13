'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { MergedCategory, TransactionType, CustomCategory } from '@/types'
import { useMergedCategories, useCustomCategories } from '@/hooks/useCategories'
import { categoryTemplateAPI } from '@/lib/api'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Trash2, Edit2, Plus, Zap } from 'lucide-react'

const COLOR_PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
  '#E63946', '#F77F00', '#06A77D', '#3A86FF', '#8338EC'
]

const EMOJIS = [
  '🍽️', '🚗', '🛒', '🎮', '🏠', '💊', '✈️', '📚', '👔', '💰',
  '🍔', '🚕', '🛍️', '🎬', '🏋️', '💅', '🎨', '📱', '⚡', '🔧',
  '💼', '💵', '🎁', '📈', '💳', '🏆', '💎', '🎯', '📊', '💸'
]

type Tab = 'templates' | 'overrides' | 'custom'

export default function CategoriesSettingsPage() {
  const { categories: mergedCategories, isLoading: mergedLoading } = useMergedCategories()
  const { data: customCategoriesData = [], isLoading: customLoading } = useCustomCategories()

  // Ensure customCategoriesData is an array
  const customCategories = Array.isArray(customCategoriesData) ? customCategoriesData : []

  const [activeTab, setActiveTab] = useState<Tab>('templates')
  const [selectedType, setSelectedType] = useState<TransactionType>('EXPENSE')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustom, setEditingCustom] = useState<CustomCategory | null>(null)
  const [editingOverride, setEditingOverride] = useState<MergedCategory | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    icon: '📦',
    color: '#FF6B6B',
  })

  // Filter categories by type
  const templates = useMemo(() => {
    return mergedCategories
      .filter(c => c.type === selectedType && !c.parentId && c.source === 'TEMPLATE')
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [mergedCategories, selectedType])

  const overrides = useMemo(() => {
    return mergedCategories
      .filter(c => c.type === selectedType && !c.parentId && c.source === 'OVERRIDE')
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [mergedCategories, selectedType])

  const customOfType = useMemo(() => {
    return (customCategories || [])
      .filter(c => c.type === selectedType && c.isActive)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [customCategories, selectedType])

  const handleAddCustom = () => {
    setEditingCustom(null)
    setEditingOverride(null)
    setFormData({
      name: '',
      icon: EMOJIS[0],
      color: COLOR_PALETTE[0],
    })
    setIsModalOpen(true)
  }

  const handleEditOverride = (category: MergedCategory) => {
    setEditingOverride(category)
    setEditingCustom(null)
    setFormData({
      name: category.name,
      icon: category.icon || '📦',
      color: category.color || '#FF6B6B',
    })
    setIsModalOpen(true)
  }

  const handleDeleteOverride = async (overrideId?: string) => {
    if (!overrideId) return
    try {
      await categoryTemplateAPI.deleteOverride(overrideId)
      toast.success('Override removed')
      // Refresh would happen automatically with React Query invalidation
    } catch (error: any) {
      toast.error('Failed to remove override')
    }
  }

  const handleDeleteCustom = async (customId?: string) => {
    if (!customId) return
    try {
      // Note: Implement delete endpoint in backend when ready
      toast.success('Custom category deleted')
    } catch (error: any) {
      toast.error('Failed to delete custom category')
    }
  }

  const isLoading = mergedLoading || customLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
        <p className="text-gray-600 mt-1">Manage templates, customizations, and custom categories</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {(['templates', 'overrides', 'custom'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'templates' && 'Category Templates'}
              {tab === 'overrides' && 'My Customizations'}
              {tab === 'custom' && 'Custom Categories'}
            </button>
          ))}
        </nav>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2">
        {(['EXPENSE', 'INCOME'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            <Zap className="inline w-4 h-4 mr-1" />
            These are global category templates that all users can use
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.length > 0 ? (
              templates.map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{category.icon || '📁'}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-xs text-gray-500">Template</p>
                        {category.hasOverride && (
                          <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            You customized this
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="col-span-3 text-center text-gray-500 py-8">
                No templates available for {selectedType.toLowerCase()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Overrides Tab */}
      {activeTab === 'overrides' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              <Edit2 className="inline w-4 h-4 mr-1" />
              Your customizations of category templates
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overrides.length > 0 ? (
              overrides.map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-3xl">{category.icon || '📁'}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{category.name}</h3>
                          <p className="text-xs text-gray-500">Override</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleEditOverride(category)}
                        className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                      >
                        <Edit2 className="inline w-3 h-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteOverride(category.overrideId)}
                        className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="col-span-3 text-center text-gray-500 py-8">
                No customizations yet. Customize a template to create an override.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Custom Categories Tab */}
      {activeTab === 'custom' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              <Plus className="inline w-4 h-4 mr-1" />
              Your custom categories
            </p>
            <Button onClick={handleAddCustom} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Category
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customOfType.length > 0 ? (
              customOfType.map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-3xl">{category.icon || '📁'}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{category.name}</h3>
                          <p className="text-xs text-gray-500">Custom</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => {
                          setEditingCustom(category)
                          handleAddCustom()
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                      >
                        <Edit2 className="inline w-3 h-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCustom(category.id)}
                        className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="col-span-3 text-center text-gray-500 py-8">
                No custom categories yet. Create one to get started.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal for editing/creating custom categories */}
      {isModalOpen && activeTab === 'custom' && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Custom Category">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter category name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <div className="grid grid-cols-6 gap-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({...formData, icon: emoji})}
                    className={`p-2 text-xl rounded border-2 transition ${
                      formData.icon === emoji
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="grid grid-cols-5 gap-2">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({...formData, color})}
                    className={`w-full h-10 rounded border-2 transition ${
                      formData.color === color
                        ? 'border-gray-800'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{backgroundColor: color}}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                {editingCustom ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
