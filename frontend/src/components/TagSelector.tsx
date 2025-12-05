'use client'

import { useState, useRef, useEffect } from 'react'
import { Tag } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useTags, useCreateTag } from '@/hooks/useTags'

interface TagSelectorProps {
  value: string[]
  onChange: (tagIds: string[]) => void
  error?: string
  label?: string
}

const TAG_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-300',
  'bg-green-100 text-green-800 border-green-300',
  'bg-purple-100 text-purple-800 border-purple-300',
  'bg-pink-100 text-pink-800 border-pink-300',
  'bg-yellow-100 text-yellow-800 border-yellow-300',
  'bg-indigo-100 text-indigo-800 border-indigo-300',
  'bg-red-100 text-red-800 border-red-300',
  'bg-orange-100 text-orange-800 border-orange-300',
]

export default function TagSelector({
  value = [],
  onChange,
  error,
  label = 'Tags',
}: TagSelectorProps) {
  const { data: tags = [], isLoading } = useTags()
  const createTagMutation = useCreateTag()

  // Asegurar que tags es un array
  const tagsList: Tag[] = Array.isArray(tags) ? tags : []
  const [isExpanded, setIsExpanded] = useState(false)
  const [newTagInput, setNewTagInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce search input - only trigger filtering after 300ms of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(newTagInput)
    }, 300)

    return () => clearTimeout(timer)
  }, [newTagInput])

  // Auto-focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  const handleToggleTag = (tagId: string) => {
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId))
    } else {
      onChange([...value, tagId])
    }
  }

  const handleCreateTag = async () => {
    if (!newTagInput.trim()) return

    // Check if tag already exists (case-insensitive)
    const existingTag = tagsList.find(
      (tag) => tag.name.toLowerCase() === newTagInput.trim().toLowerCase()
    )

    if (existingTag) {
      // Select existing tag instead of creating duplicate
      onChange([...value, existingTag.id])
      setNewTagInput('')
      toast.info(`Tag "${existingTag.name}" already exists - selected it for you`)
      return
    }

    try {
      const newTag = await createTagMutation.mutateAsync({ name: newTagInput.trim() })
      onChange([...value, newTag.id])
      setNewTagInput('')
      toast.success('Tag created successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create tag')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()

      // Check for exact match first
      const exactMatch = availableTags.find(
        (tag) => tag.name.toLowerCase() === newTagInput.trim().toLowerCase()
      )

      if (exactMatch) {
        // Select the existing tag
        handleToggleTag(exactMatch.id)
        setNewTagInput('')
      } else if (availableTags.length === 1) {
        // Only one filtered result - select it
        handleToggleTag(availableTags[0].id)
        setNewTagInput('')
      } else if (newTagInput.trim()) {
        // No match - create new tag
        handleCreateTag()
      }
    }
  }

  const getTagColor = (index: number) => {
    return TAG_COLORS[index % TAG_COLORS.length]
  }

  const selectedTags = tagsList.filter((tag) => value.includes(tag.id))
  const availableTags = tagsList.filter((tag) => {
    // Exclude already selected tags
    if (value.includes(tag.id)) return false

    // If there's a search term, filter by name (use debounced search)
    if (debouncedSearch.trim()) {
      return tag.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    }

    // Show all if no search term
    return true
  })

  // Check for exact match to prevent duplicate creation
  const exactMatch = tagsList.find(
    (tag) => tag.name.toLowerCase() === newTagInput.trim().toLowerCase()
  )
  const showCreateButton = newTagInput.trim() && !exactMatch

  if (isLoading) {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        )}
        <div className="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}

      {/* Selected Tags Display */}
      <div className="min-h-[44px] p-2 border rounded-lg bg-gray-50 flex flex-wrap gap-2 items-center">
        {selectedTags.length === 0 && (
          <span className="text-sm text-gray-400 px-2">No tags selected</span>
        )}
        {selectedTags.map((tag, index) => (
          <span
            key={tag.id}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border transition-all',
              getTagColor(index)
            )}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            {tag.name}
            <button
              type="button"
              onClick={() => handleToggleTag(tag.id)}
              className="ml-1 hover:bg-white/50 rounded-full p-0.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>
        ))}
      </div>

      {/* Add Tags Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full px-4 py-2 border rounded-lg text-sm font-medium transition-colors flex items-center justify-between',
          'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
          error ? 'border-red-500' : 'border-gray-300',
          isExpanded && 'bg-gray-50 border-blue-500 ring-2 ring-blue-500'
        )}
      >
        <span className="text-gray-700">
          {isExpanded ? 'Close tag selector' : 'Add tags...'}
        </span>
        <svg
          className={cn('w-4 h-4 text-gray-400 transition-transform', isExpanded && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Available Tags Grid */}
      {isExpanded && (
        <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-lg space-y-3">
          {/* Create New Tag Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search or create new tag..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            {showCreateButton && (
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={createTagMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createTagMutation.isPending ? 'Creating...' : `Create "${newTagInput.trim()}"`}
              </button>
            )}
          </div>

          {/* Available Tags */}
          {availableTags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Available Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag, index) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                      'hover:shadow-md',
                      getTagColor(selectedTags.length + index)
                    )}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {tag.name}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tagsList.length === 0 ? (
            <p className="text-sm text-gray-500 italic text-center py-2">
              No tags yet. Create your first tag above!
            </p>
          ) : (
            availableTags.length === 0 &&
            newTagInput.trim() && (
              <p className="text-sm text-gray-500 italic text-center py-2">
                No tags match &quot;{newTagInput.trim()}&quot;. Press Enter to create it.
              </p>
            )
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}
