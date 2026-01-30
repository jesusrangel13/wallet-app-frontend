'use client'

import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  /** Optional description for aria-describedby */
  description?: string
  /** Optional class name for the modal container */
  className?: string
}

export function Modal({ isOpen, onClose, title, children, description, className }: ModalProps) {
  const t = useTranslations('common');
  const hasInitializedFocusRef = useRef(false)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Effect for initial focus - only runs when modal opens
  useEffect(() => {
    if (isOpen && !hasInitializedFocusRef.current) {
      // Store currently focused element for restoration
      previousActiveElementRef.current = document.activeElement as HTMLElement

      const modalElement = document.getElementById('modal-content')
      if (modalElement) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          // Find focusable elements excluding the close button for initial focus
          const focusableElementsForInit = modalElement.querySelectorAll(
            'button:not([data-modal-close]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          const firstElement = focusableElementsForInit[0] as HTMLElement
          firstElement?.focus()
          hasInitializedFocusRef.current = true
        }, 0)
      }
    }

    if (!isOpen) {
      hasInitializedFocusRef.current = false
      // Restore focus to previously focused element
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus()
        previousActiveElementRef.current = null
      }
    }
  }, [isOpen])

  // Effect for escape key and focus trap - doesn't move focus
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'

      // Focus trap for Tab key navigation
      const modalElement = document.getElementById('modal-content')
      const handleTab = (e: KeyboardEvent) => {
        if (e.key === 'Tab' && modalElement) {
          // Find all focusable elements (including close button for tab trap)
          const allFocusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          const firstElement = allFocusableElements[0] as HTMLElement
          const lastElement = allFocusableElements[allFocusableElements.length - 1] as HTMLElement

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault()
              lastElement.focus()
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault()
              firstElement.focus()
            }
          }
        }
      }

      if (modalElement) {
        modalElement.addEventListener('keydown', handleTab)
      }

      // Single cleanup function for all event listeners and overflow
      return () => {
        if (modalElement) {
          modalElement.removeEventListener('keydown', handleTab)
        }
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen, onClose])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center p-4 sm:p-6 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby={description ? "modal-description" : undefined}
        >
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Animated Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{
              duration: 0.2,
              ease: [0.25, 0.46, 0.45, 0.94] as const,
            }}
            id="modal-content"
            className={`relative bg-background rounded-xl shadow-2xl w-full max-h-[85vh] overflow-y-auto border border-border ${className || 'max-w-md'}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 id="modal-title" className="text-xl font-semibold text-foreground">{title}</h2>
                {description && (
                  <p id="modal-description" className="sr-only">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={t('closeModal')}
                data-modal-close="true"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
