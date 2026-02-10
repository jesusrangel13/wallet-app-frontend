'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { MoreVertical } from 'lucide-react'

interface DropdownMenuItem {
    label: string
    onClick: () => void
    variant?: 'default' | 'danger'
    icon?: React.ReactNode
}

interface DropdownMenuProps {
    items: DropdownMenuItem[]
    icon?: React.ReactNode
    align?: 'left' | 'right'
    children?: React.ReactNode
}

export function DropdownMenu({ items, icon, align = 'right', children }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    return (
        <div className="relative" ref={menuRef}>
            <div
                onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(!isOpen)
                }}
                className={children ? "cursor-pointer inline-block" : "p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"}
            >
                {children || icon || <MoreVertical className="h-5 w-5 text-gray-500" />}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        transition={{ duration: 0.1 }}
                        className={cn(
                            'absolute mt-1 w-48 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 z-50 focus:outline-none',
                            align === 'right' ? 'right-0' : 'left-0'
                        )}
                    >
                        <div className="py-1">
                            {items.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        item.onClick()
                                        setIsOpen(false)
                                    }}
                                    className={cn(
                                        'group flex w-full items-center px-4 py-2 text-sm',
                                        item.variant === 'danger'
                                            ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    )}
                                >
                                    {item.icon && <span className="mr-2">{item.icon}</span>}
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
