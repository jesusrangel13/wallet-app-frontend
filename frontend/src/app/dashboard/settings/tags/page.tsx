'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Tag, CreateTagForm } from '@/types'
import { tagAPI } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { LoadingPage, LoadingSpinner, LoadingMessages } from '@/components/ui/Loading'

const COLOR_PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
  '#E63946', '#F77F00', '#06A77D', '#3A86FF', '#8338EC',
  '#F72585', '#7209B7', '#3A0CA3', '#4361EE', '#4CC9F0'
]

export default function TagsSettingsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState<{
    name: string
    color: string
  }>({
    name: '',
    color: '#FF6B6B',
  })

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      setIsLoading(true)
      const response = await tagAPI.getAll()
      setTags(response.data.data)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load tags')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingTag(null)
    setFormData({
      name: '',
      color: COLOR_PALETTE[0],
    })
    setShowColorPicker(false)
    setIsModalOpen(true)
  }

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      color: tag.color || '#FF6B6B',
    })
    setShowColorPicker(false)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Tag name is required')
      return
    }

    try {
      setIsSaving(true)
      const payload: CreateTagForm = {
        name: formData.name.trim(),
        color: formData.color,
      }

      if (editingTag) {
        await tagAPI.update(editingTag.id, payload)
        toast.success('Tag updated successfully')
      } else {
        await tagAPI.create(payload)
        toast.success('Tag created successfully')
      }

      loadTags()
      setIsModalOpen(false)
      setFormData({ name: '', color: '#FF6B6B' })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save tag')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      await tagAPI.delete(id)
      toast.success('Tag deleted successfully')
      loadTags()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete tag')
    }
  }

  if (isLoading) {
    return <LoadingPage message={LoadingMessages.tags} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Your Tags</h2>
          <p className="text-sm text-gray-500 mt-1">
            Organize and label your transactions with custom tags
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Tag
        </Button>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {tags.map((tag) => (
          <Card key={tag.id} className="group hover:shadow-md transition-all hover:scale-102">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: tag.color || '#FF6B6B' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate text-sm">{tag.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{tag.color}</p>
                </div>
              </div>
              <div className="flex gap-1.5 pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(tag)}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Edit tag"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(tag.id, tag.name)}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete tag"
                >
                  Delete
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        {tags.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tags yet</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Create your first tag to better organize and categorize your transactions
                </p>
                <Button onClick={handleAddNew}>Create Your First Tag</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Tag Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTag(null)
          setShowColorPicker(false)
        }}
        title={editingTag ? 'Edit Tag' : 'New Tag'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tag Name */}
          <Input
            label="Tag Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Business, Personal, Urgent"
            maxLength={50}
            required
          />

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full h-12 border-2 border-gray-300 rounded-lg flex items-center gap-3 px-3 hover:border-blue-500 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: formData.color }}
                />
                <span className="font-mono text-sm">{formData.color}</span>
              </button>
              {showColorPicker && (
                <div className="absolute z-10 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg w-full">
                  <div className="grid grid-cols-5 gap-2">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, color })
                          setShowColorPicker(false)
                        }}
                        className={`w-10 h-10 rounded-full transition-all ${
                          formData.color === color
                            ? 'ring-2 ring-blue-500 ring-offset-2 scale-110'
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <LoadingSpinner size="sm" className="text-current" />
                  {LoadingMessages.saving}
                </span>
              ) : (
                <span>{editingTag ? 'Update Tag' : 'Create Tag'}</span>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                setEditingTag(null)
                setShowColorPicker(false)
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
