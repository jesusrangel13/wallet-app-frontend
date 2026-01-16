import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

/**
 * TransactionListSkeleton
 * Partial skeleton shown only in the transaction list area
 * Keeps header/filters visible for better UX during data refresh
 */

interface TransactionListSkeletonProps {
  itemCount?: number
}

export const TransactionListSkeleton = ({ itemCount = 5 }: TransactionListSkeletonProps) => {
  return (
    <div className="space-y-4">
      {/* Date Group Header Skeleton */}
      {[1, 2].map((groupIndex) => (
        <div key={groupIndex} className="space-y-2">
          {/* Date header */}
          <div className="pt-6 pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>

          {/* Transaction items */}
          {Array.from({ length: groupIndex === 1 ? 3 : 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  {/* Left Section: Checkbox + Icon + Details */}
                  <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox */}
                    <Skeleton className="w-5 h-5 rounded flex-shrink-0 mt-1" />

                    {/* Category Icon */}
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>

                  {/* Right Section: Amount + Actions */}
                  <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                    <Skeleton className="h-6 w-24" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-16 rounded-md" />
                      <Skeleton className="h-8 w-16 rounded-md" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
}
