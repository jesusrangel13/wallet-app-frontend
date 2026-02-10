'use client'

import { useState, useRef, useEffect, useId } from 'react'
import { Tag } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useTags, useCreateTag } from '@/hooks/useTags'
import { useTranslations } from 'next-intl'

interface TagSelectorProps {
  value: string[]
  onChange: (tagIds: string[]) => void
  error?: string
  label?: string
}

const TAG_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
  'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
]

export default function TagSelector({
  value = [],
  onChange,
  error,
  label,
}: TagSelectorProps) {
  const { data: tags = [], isLoading } = useTags()
  const createTagMutation = useCreateTag()
  const t = useTranslations('transactions.tags')

  const tagsList: Tag[] = Array.isArray(tags) ? tags : []
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1) // For keyboard navigation

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const labelId = useId()
  const listboxId = useId()
  const errorId = useId()

  const selectedTags = tagsList.filter((tag) => value.includes(tag.id))

  // Filter available tags based on input AND exclude already selected
  const availableTags = tagsList.filter((tag) => {
    if (value.includes(tag.id)) return false
    if (!inputValue.trim()) return true
    return tag.name.toLowerCase().includes(inputValue.toLowerCase())
  })

  // Check unique match
  const exactMatch = tagsList.find(
    (tag) => tag.name.toLowerCase() === inputValue.trim().toLowerCase()
  )

  // Reset active index when list changes
  useEffect(() => {
    setActiveIndex(-1)
  }, [inputValue, isOpen])

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeElement = listRef.current.children[activeIndex] as HTMLElement
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [activeIndex])

  const getTagColor = (index: number) => {
    return TAG_COLORS[index % TAG_COLORS.length]
  }

  const handleContainerClick = () => {
    inputRef.current?.focus()
    setIsOpen(true)
  }

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace to remove tag
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      const newValue = [...value]
      newValue.pop()
      onChange(newValue)
      return
    }

    // Navigation
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        return
      }
      const maxIndex = availableTags.length + (inputValue.trim() && !exactMatch ? 0 : -1) // +1 for create option if applicable, simplistic check
      // Let's refine max items count
      let totalItems = availableTags.length
      if (inputValue.trim() && !exactMatch) totalItems += 1

      setActiveIndex(prev => (prev + 1) % totalItems)
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        return
      }
      let totalItems = availableTags.length
      if (inputValue.trim() && !exactMatch) totalItems += 1

      setActiveIndex(prev => (prev - 1 + totalItems) % totalItems)
      return
    }

    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (!inputValue.trim() && activeIndex === -1) return

      // If item selected via keyboard
      if (activeIndex !== -1) {
        if (activeIndex < availableTags.length) {
          handleSelectTag(availableTags[activeIndex].id)
        } else {
          // It's the "Create" option
          handleCreateNewTag()
        }
        return
      }

      // Default Enter behavior (first match or create)
      if (exactMatch) {
        if (!value.includes(exactMatch.id)) {
          onChange([...value, exactMatch.id])
        }
        setInputValue('')
      } else if (availableTags.length === 1) {
        onChange([...value, availableTags[0].id])
        setInputValue('')
      } else {
        handleCreateNewTag()
      }
    }

    if (!isOpen && e.key.length === 1) {
      setIsOpen(true)
    }
  }

  const handleCreateNewTag = async () => {
    try {
      const newTag = await createTagMutation.mutateAsync({ name: inputValue.trim() })
      onChange([...value, newTag.id])
      setInputValue('')
      setActiveIndex(-1)
      toast.success('Tag created')
    } catch (error: any) {
      toast.error('Failed to create tag')
    }
  }

  const handleSelectTag = (tagId: string) => {
    onChange([...value, tagId])
    setInputValue('')
    setIsOpen(true) // Keep open for multiple selection
    inputRef.current?.focus()
    setActiveIndex(-1)
  }

  const handleRemoveTag = (e: React.MouseEvent, tagId: string) => {
    e.stopPropagation()
    onChange(value.filter(id => id !== tagId))
    inputRef.current?.focus()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsFocused(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (isLoading) {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-foreground mb-1">{label || t('label')}</label>
        <div className="animate-pulse bg-muted h-12 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-2 relative" ref={containerRef}>
      <label id={labelId} className="block text-sm font-medium text-foreground mb-1">
        {label || t('label')}
      </label>

      {/* Unified Input Container */}
      <div
        onClick={handleContainerClick}
        className={cn(
          "min-h-[42px] w-full px-3 py-2 border rounded-lg bg-background transition-all cursor-text flex flex-wrap gap-2 items-center shadow-sm",
          isFocused ? "ring-2 ring-primary border-primary shadow-primary/10" : "border-input hover:border-gray-400 dark:hover:border-gray-500",
          error && "border-red-500 ring-red-200"
        )}
      >
        {/* Selected Tags (Chips) */}
        {selectedTags.map((tag, index) => (
          <span
            key={tag.id}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium border animate-in zoom-in-50 duration-200",
              getTagColor(index)
            )}
          >
            <span className="max-w-[150px] truncate">{tag.name}</span>
            <button
              type="button"
              onClick={(e) => handleRemoveTag(e, tag.id)}
              className="hover:bg-black/10 dark:hover:bg-white/20 rounded-full p-0.5 transition-colors focus:outline-none focus:bg-black/20"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </span>
        ))}

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true)
            setIsOpen(true)
          }}
          placeholder={selectedTags.length === 0 ? t('searchPlaceholder') : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none border-none focus:ring-0 focus:outline-none text-sm placeholder:text-muted-foreground h-7"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `option-${activeIndex}` : undefined}
          autoComplete="off"
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id={listboxId}
          className="absolute z-50 w-full mt-1.5 bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5"
        >
          <div className="max-h-[220px] overflow-y-auto p-1 custom-scrollbar" ref={listRef}>
            {/* Available Tags */}
            {availableTags.map((tag, index) => (
              <button
                key={tag.id}
                id={`option-${index}`}
                type="button"
                onClick={() => handleSelectTag(tag.id)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-lg transition-all flex items-center justify-between group",
                  activeIndex === index ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-transform",
                    getTagColor(selectedTags.length + index).split(' ')[0].replace('bg-', 'bg-').replace('100', '400'),
                    activeIndex === index && "scale-125"
                  )} />
                  <span className={cn("font-medium", activeIndex === index && "font-semibold")}>{tag.name}</span>
                </div>
                {activeIndex === index && (
                  <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">↵</span>
                  </kbd>
                )}
              </button>
            ))}

            {/* Create Option */}
            {inputValue.trim() && !exactMatch && (
              <button
                id={`option-${availableTags.length}`}
                type="button"
                onClick={handleCreateNewTag}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 border-t border-dashed border-border mt-1",
                  activeIndex === availableTags.length ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                )}
              >
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                </div>
                <span className="font-medium">Create &quot;{inputValue.trim()}&quot;</span>
              </button>
            )}

            {/* Empty State */}
            {availableTags.length === 0 && !inputValue.trim() && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                <p className="italic">{t('noTagsYet')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p id={errorId} className="text-red-500 text-sm mt-1 animate-in slide-in-from-top-1" role="alert">{error}</p>}
    </div>
  )
}
