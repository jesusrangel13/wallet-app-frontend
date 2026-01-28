'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { useEffect } from 'react'

interface SuccessAnimationProps {
    show: boolean
    message?: string
    onComplete?: () => void
}

export function SuccessAnimation({ show, message, onComplete }: SuccessAnimationProps) {
    useEffect(() => {
        if (show && onComplete) {
            const timer = setTimeout(onComplete, 2000)
            return () => clearTimeout(timer)
        }
    }, [show, onComplete])

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 25
                        }}
                        className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center min-w-[300px]"
                    >
                        {/* Animated Circle */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6"
                        >
                            <motion.div
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                            >
                                <Check className="w-12 h-12 text-green-600 dark:text-green-400" strokeWidth={3} />
                            </motion.div>
                        </motion.div>

                        {/* Message */}
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-xl font-bold text-gray-900 dark:text-white text-center"
                        >
                            {message || 'Success!'}
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
