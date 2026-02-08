'use client'

import { TimelineVariant } from './TimelineConnector'

interface TimelineStyleSelectorProps {
    currentStyle: TimelineVariant
    onChange: (style: TimelineVariant) => void
}

export function TimelineStyleSelector({ currentStyle, onChange }: TimelineStyleSelectorProps) {
    const styles: { id: TimelineVariant; label: string; description: string }[] = [
        { id: 'classic', label: 'Classic', description: 'Solid' },
        { id: 'minimal', label: 'Minimal', description: 'Dashed' },
        { id: 'elegant', label: 'Elegant', description: 'Thin' },
        { id: 'neon', label: 'Neon', description: 'Glow' },
    ]

    return (
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg self-center sm:self-auto mb-4 sm:mb-0 overflow-x-auto max-w-full">
            {styles.map((style) => (
                <button
                    key={style.id}
                    onClick={() => onChange(style.id)}
                    className={`
            px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap
            flex flex-col items-center gap-0.5 min-w-[70px]
            ${currentStyle === style.id
                            ? 'bg-white dark:bg-gray-700 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                        }
          `}
                >
                    <span>{style.label}</span>
                    {/* Tiny visual indicator of the style */}
                    <div className="mt-1 h-3 flex items-center justify-center w-full">
                        {style.id === 'classic' && (
                            <div className="w-2 h-2 rounded-full bg-blue-400 ring-2 ring-gray-300 dark:ring-gray-600"></div>
                        )}
                        {style.id === 'minimal' && (
                            <div className="w-2 h-2 rounded-full border-2 border-blue-400 bg-transparent"></div>
                        )}
                        {style.id === 'elegant' && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                        )}
                        {style.id === 'neon' && (
                            <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_4px_rgba(96,165,250,0.8)]"></div>
                        )}
                    </div>
                </button>
            ))}
        </div>
    )
}
