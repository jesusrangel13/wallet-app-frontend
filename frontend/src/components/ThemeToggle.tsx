'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore, Theme } from '@/store/themeStore'
import { useState, useRef, useEffect } from 'react'

interface ThemeToggleProps {
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
}

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

export function ThemeToggle({ showLabel = false, size = 'md' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useThemeStore()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isDark = resolvedTheme === 'dark'

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleThemeSelect = (newTheme: Theme) => {
    setTheme(newTheme)
    setShowMenu(false)
  }

  const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Oscuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ]

  return (
    <div className="relative" ref={menuRef}>
      {/* Simple toggle button */}
      <button
        onClick={toggleTheme}
        onContextMenu={(e) => {
          e.preventDefault()
          setShowMenu(!showMenu)
        }}
        className={`
          relative ${sizeClasses[size]} rounded-lg
          bg-secondary/50
          hover:bg-secondary
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          flex items-center gap-2
        `}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title="Click para cambiar tema, click derecho para más opciones"
      >
        <motion.div
          initial={false}
          animate={{ rotate: isDark ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.div
                key="moon"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
              >
                <Moon className={`${iconSizes[size]} text-yellow-400`} />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
              >
                <Sun className={`${iconSizes[size]} text-yellow-500`} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {showLabel && (
          <span className="text-sm font-medium text-foreground">
            {isDark ? 'Oscuro' : 'Claro'}
          </span>
        )}
      </button>

      {/* Extended menu (on right-click) */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-36 py-1 bg-popover rounded-lg shadow-lg border border-border z-50"
          >
            {themeOptions.map((option) => {
              const Icon = option.icon
              const isSelected = theme === option.value

              return (
                <button
                  key={option.value}
                  onClick={() => handleThemeSelect(option.value)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 text-sm
                    transition-colors duration-150
                    ${isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{option.label}</span>
                  {isSelected && (
                    <motion.div
                      layoutId="theme-indicator"
                      className="ml-auto w-2 h-2 rounded-full bg-primary"
                    />
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
