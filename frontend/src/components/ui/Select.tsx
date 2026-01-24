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
                    <label className="block text-sm font-medium text-foreground mb-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        className={`
              w-full px-3 py-2
              bg-background
              border border-input
              rounded-lg
              text-foreground
              focus:ring-2 focus:ring-ring focus:border-input
              disabled:opacity-50 disabled:cursor-not-allowed
              placeholder:text-muted-foreground
              transition-colors
              ${error ? 'border-destructive' : ''}
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
                    <p className="text-destructive text-sm mt-1 animate-in slide-in-from-top-1 fade-in">
                        {error}
                    </p>
                )}
            </div>
        )
    }
)

Select.displayName = 'Select'

export { Select }
