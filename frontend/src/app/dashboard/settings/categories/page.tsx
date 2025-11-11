'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Category, TransactionType, CreateCategoryForm } from '@/types'
import { categoryAPI } from '@/lib/api'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

const EMOJI_CATEGORIES = {
  EXPENSE: [
    '🍽️', '🚗', '🛒', '🎮', '🏠', '💊', '✈️', '📚', '👔', '💰',
    '🍔', '🚕', '🛍️', '🎬', '🏋️', '💅', '🎨', '📱', '⚡', '🔧'
  ],
  INCOME: [
    '💼', '💵', '🎁', '📈', '💳', '🏆', '💎', '🎯', '📊', '💸'
  ]
}

const COLOR_PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
  '#E63946', '#F77F00', '#06A77D', '#3A86FF', '#8338EC'
]

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [selectedType, setSelectedType] = useState<TransactionType>('EXPENSE')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Form state
  const [formData, setFormData] = useState<{
    name: string
    icon: string
    color: string
    type: TransactionType
    parentId?: string
  }>({
    name: '',
    icon: '📦',
    color: '#FF6B6B',
    type: 'EXPENSE',
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const response = await categoryAPI.getAll()
      setCategories(response.data.data)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNew = (type: TransactionType, parentId?: string) => {
    setEditingCategory(null)
    setFormData({
      name: '',
      icon: type === 'EXPENSE' ? '🍽️' : '💼',
      color: COLOR_PALETTE[0],
      type,
      parentId,
    })
    setIsModalOpen(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      icon: category.icon || '📦',
      color: category.color || '#FF6B6B',
      type: category.type,
      parentId: category.parentId || undefined,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Category name is required')
      return
    }

    try {
      const payload: CreateCategoryForm = {
        name: formData.name.trim(),
        icon: formData.icon,
        color: formData.color,
        type: formData.type,
        parentId: formData.parentId,
      }

      if (editingCategory) {
        await categoryAPI.update(editingCategory.id, payload)
        toast.success('Category updated successfully')
      } else {
        await categoryAPI.create(payload)
        toast.success('Category created successfully')
      }

      loadCategories()
      setIsModalOpen(false)
      setFormData({ name: '', icon: '📦', color: '#FF6B6B', type: 'EXPENSE' })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save category')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await categoryAPI.delete(id)
      toast.success('Category deleted successfully')
      loadCategories()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete category')
    }
  }

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE' && !c.parentId)
  const incomeCategories = categories.filter((c) => c.type === 'INCOME' && !c.parentId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category Type Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setSelectedType('EXPENSE')}
          className={`px-6 py-3 font-medium border-b-2 transition-all ${
            selectedType === 'EXPENSE'
              ? 'border-red-500 text-red-600 -mb-px'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">💸</span>
            <div className="text-left">
              <div className="text-sm font-semibold">Expenses</div>
              <div className="text-xs opacity-75">{expenseCategories.length} categories</div>
            </div>
          </div>
        </button>
        <button
          onClick={() => setSelectedType('INCOME')}
          className={`px-6 py-3 font-medium border-b-2 transition-all ${
            selectedType === 'INCOME'
              ? 'border-green-500 text-green-600 -mb-px'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <div className="text-left">
              <div className="text-sm font-semibold">Income</div>
              <div className="text-xs opacity-75">{incomeCategories.length} categories</div>
            </div>
          </div>
        </button>
      </div>

      {/* Categories Grid */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedType === 'EXPENSE' ? 'Expense' : 'Income'} Categories
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Organize your {selectedType.toLowerCase()}s with custom categories
            </p>
          </div>
          <Button onClick={() => handleAddNew(selectedType)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Category
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(selectedType === 'EXPENSE' ? expenseCategories : incomeCategories).map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      {category.isDefault && (
                        <span className="text-xs text-gray-500">Default</span>
                      )}
                      {category.subcategories && category.subcategories.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {category.subcategories.length} subcategories
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    {!category.isDefault && (
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                </div>

                {/* Subcategories */}
                {category.subcategories && category.subcategories.length > 0 && (
                  <div className="space-y-1 pt-3 border-t border-gray-100">
                    {category.subcategories.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{sub.icon}</span>
                          <span className="text-sm text-gray-700">{sub.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(sub)}
                            className="p-1 text-gray-500 hover:text-blue-600 rounded"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          {!sub.isDefault && (
                            <button
                              onClick={() => handleDelete(sub.id, sub.name)}
                              className="p-1 text-gray-500 hover:text-red-600 rounded"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddNew(selectedType, category.id)}
                      className="w-full p-2 text-sm text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Subcategory
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {(selectedType === 'EXPENSE' ? expenseCategories : incomeCategories).length === 0 && (
            <div className="col-span-full">
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">
                    No {selectedType.toLowerCase()} categories yet. Create your first one!
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCategory(null)
          setShowEmojiPicker(false)
          setShowColorPicker(false)
        }}
        title={editingCategory ? 'Edit Category' : 'New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Icon & Color Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-full h-20 border-2 border-gray-300 rounded-lg flex items-center justify-center text-4xl hover:border-blue-500 transition-colors"
                  style={{ backgroundColor: formData.color + '10' }}
                >
                  {formData.icon}
                </button>
                {showEmojiPicker && (
                  <div className="absolute z-10 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-5 gap-2">
                      {EMOJI_CATEGORIES[formData.type === 'TRANSFER' ? 'EXPENSE' : formData.type].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, icon: emoji })
                            setShowEmojiPicker(false)
                          }}
                          className="text-2xl hover:bg-gray-100 rounded p-2"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-full h-20 border-2 border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
                  style={{ backgroundColor: formData.color }}
                />
                {showColorPicker && (
                  <div className="absolute z-10 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="grid grid-cols-5 gap-2">
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, color })
                            setShowColorPicker(false)
                          }}
                          className="w-10 h-10 rounded-lg border-2 border-gray-200 hover:border-gray-400"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Name */}
          <Input
            label="Category Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Groceries, Salary"
            required
          />

          {/* Parent Category (for subcategories) */}
          {!editingCategory?.parentId && formData.parentId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Category
              </label>
              <select
                value={formData.parentId || ''}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">None (Main Category)</option>
                {categories
                  .filter((c) => c.type === formData.type && !c.parentId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1">
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                setEditingCategory(null)
                setShowEmojiPicker(false)
                setShowColorPicker(false)
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
