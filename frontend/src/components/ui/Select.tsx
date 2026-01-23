import { forwardRef } from 'react'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = '', label, error, children, disabled, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        className={`
              w-full px-3 py-2
              bg-white dark:bg-card
              border border-gray-300 dark:border-gray-600
              rounded-lg
              text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              transition-colors
              ${error ? 'border-red-500 dark:border-red-500' : ''}
              ${className}
            `}
                        ref={ref}
                        disabled={disabled}
                        {...props}
                    >
                        {children}
                    </select>
                </div>
                {error && (
                    <p className="text-red-500 text-sm mt-1 animate-in slide-in-from-top-1 fade-in">
                        {error}
                    </p>
                )}
            </div>
        )
    }
)

Select.displayName = 'Select'

export { Select }
