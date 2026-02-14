import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ClairCardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'highlight'
}

export const ClairCard = forwardRef<HTMLDivElement, ClairCardProps>(
    ({ className, variant = 'default', children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "relative overflow-hidden rounded-2xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-black/20 backdrop-blur-2xl shadow-xl flex flex-col transition-all duration-300 group",
                    className
                )}
                {...props}
            >
                {/* Background Decorations (The "Flow" Feel) */}
                <div className="absolute top-[-20%] right-[-20%] w-[300px] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-75" />
                <div className="absolute bottom-[-20%] left-[-20%] w-[250px] h-[250px] bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-[60px] pointer-events-none transition-opacity duration-500 group-hover:opacity-75" />

                {/* Content Container - Enforcing Contrast Text */}
                <div className="relative z-10 flex-1 flex flex-col text-slate-800 dark:text-gray-100">
                    {children}
                </div>
            </div>
        )
    }
)

ClairCard.displayName = 'ClairCard'

// Re-export specific sub-components if needed using same heavy contrast logic
// For now, standard CardHeader/CardTitle/CardContent can be used inside, 
// OR we can define them here to force specific styles.
// Let's use standard HTML structure inside for flexibility, but we can override text colors globally in the container above.
