'use client'

export type TimelineVariant = 'classic' | 'minimal' | 'elegant' | 'neon'

interface TimelineConnectorProps {
    isFirst?: boolean
    isLast?: boolean
    type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
    variant?: TimelineVariant
}

const dotColors = {
    EXPENSE: 'bg-red-400',
    INCOME: 'bg-green-400',
    TRANSFER: 'bg-blue-400',
}

const ringColors = {
    EXPENSE: 'ring-red-400',
    INCOME: 'ring-green-400',
    TRANSFER: 'ring-blue-400',
}

const neonShadows = {
    EXPENSE: 'shadow-[0_0_10px_rgba(248,113,113,0.7)]',
    INCOME: 'shadow-[0_0_10px_rgba(74,222,128,0.7)]',
    TRANSFER: 'shadow-[0_0_10px_rgba(96,165,250,0.7)]',
}

/* 
  Styles definition:
  - Classic: Current style (Gray solid line, Color filled dot, White/Dark ring)
  - Minimal: Dashed line, Hollow ring dot (Border color, Transparent center)
  - Elegant: Thin solid line (1px), Small dot (w-2 h-2), darker line
  - Neon: Solid line, Glowing dot, bright colors
*/

export function TimelineConnector({ isFirst, isLast, type, variant = 'classic' }: TimelineConnectorProps) {
    // Line Styles
    const getLineStyles = () => {
        const base = "w-0.5 flex-1"
        const transparent = "bg-transparent"

        switch (variant) {
            case 'minimal':
                return {
                    top: !isFirst ? "w-0.5 flex-1 border-l-2 border-dashed border-gray-300 dark:border-gray-600 ml-[1px]" : transparent,
                    bottom: !isLast ? "w-0.5 flex-1 border-l-2 border-dashed border-gray-300 dark:border-gray-600 ml-[1px]" : transparent
                }
            case 'elegant':
                return {
                    top: !isFirst ? "w-[1px] flex-1 bg-gray-300 dark:bg-gray-600" : transparent,
                    bottom: !isLast ? "w-[1px] flex-1 bg-gray-300 dark:bg-gray-600" : transparent
                }
            case 'neon':
                return {
                    top: !isFirst ? "w-0.5 flex-1 bg-gray-300 dark:bg-gray-600/50" : transparent,
                    bottom: !isLast ? "w-0.5 flex-1 bg-gray-300 dark:bg-gray-600/50" : transparent
                }
            default: // Classic
                return {
                    top: !isFirst ? "w-0.5 flex-1 bg-gray-200 dark:bg-gray-700" : transparent,
                    bottom: !isLast ? "w-0.5 flex-1 bg-gray-200 dark:bg-gray-700" : transparent
                }
        }
    }

    // Dot Styles
    const getDotStyles = () => {
        const base = "rounded-full z-10 my-1 transition-all duration-300"

        switch (variant) {
            case 'minimal':
                return `${base} w-3 h-3 bg-white dark:bg-gray-900 border-2 ${ringColors[type].replace('ring-', 'border-')}`
            case 'elegant':
                return `${base} w-2 h-2 ${dotColors[type]} ring-2 ring-white dark:ring-gray-900`
            case 'neon':
                return `${base} w-3 h-3 ${dotColors[type]} ring-0 ${neonShadows[type]}`
            default: // Classic
                return `${base} w-3 h-3 ${dotColors[type]} ring-4 ring-white dark:ring-gray-900`
        }
    }

    const lineStyles = getLineStyles()

    return (
        <div className="flex flex-col items-center w-6 mr-2 self-stretch">
            {/* Línea superior */}
            <div className={lineStyles.top} />

            {/* Punto */}
            <div className={getDotStyles()} />

            {/* Línea inferior */}
            <div className={lineStyles.bottom} />
        </div>
    )
}
