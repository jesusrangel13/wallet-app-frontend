'use client'

import { motion } from 'framer-motion'

interface ChartSkeletonProps {
    height?: number | string
    className?: string
}

export function ChartSkeleton({ height = 300, className = '' }: ChartSkeletonProps) {
    return (
        <div
            className={`w-full relative overflow-hidden bg-gray-50 dark:bg-gray-900/50 rounded-xl ${className}`}
            style={{ height }}
        >
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
                {/* Header Skeleton */}
                <div className="flex justify-between items-start mb-8">
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                    </div>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-8 w-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                        ))}
                    </div>
                </div>

                {/* Chart Area Skeleton */}
                <div className="flex-1 flex items-end justify-between gap-2 px-2">
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="w-full bg-gray-200 dark:bg-gray-800 rounded-t-sm opacity-60"
                            initial={{ height: '10%' }}
                            animate={{ height: ['20%', '60%', '30%', '80%', '40%'][i % 5] }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "reverse",
                                ease: "easeInOut",
                                delay: i * 0.1
                            }}
                        />
                    ))}
                </div>

                {/* X-Axis Skeleton */}
                <div className="h-4 w-full mt-4 flex justify-between">
                    <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                </div>
            </div>

            {/* Shimmer Overlay */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5" />
        </div>
    )
}
