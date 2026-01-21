"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  indicatorClassName?: string
  /** Maximum value for the progress bar, defaults to 100 */
  max?: number
  /** Accessible label for the progress bar */
  label?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorClassName, max = 100, label, ...props }, ref) => (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-gray-200",
        className
      )}
      {...props}
    >
      <div
        className={cn("h-full w-full flex-1 bg-blue-600 transition-all", indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        aria-hidden="true"
      />
    </div>
  )
)
Progress.displayName = "Progress"

export { Progress }
