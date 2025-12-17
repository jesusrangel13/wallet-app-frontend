import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const hasInitializedFocusRef = useRef(false)

  // Effect for initial focus - only runs when modal opens
  useEffect(() => {
    if (isOpen && !hasInitializedFocusRef.current) {
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
      if (modalElement) {
        const handleTab = (e: KeyboardEvent) => {
          if (e.key === 'Tab') {
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

        modalElement.addEventListener('keydown', handleTab)

        return () => {
          modalElement.removeEventListener('keydown', handleTab)
        }
      }

      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        id="modal-content"
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
            data-modal-close="true"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
