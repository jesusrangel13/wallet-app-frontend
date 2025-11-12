'use client'

import { Button } from '@/components/ui/Button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage: number
  onItemsPerPageChange: (limit: number) => void
  totalItems: number
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
}: PaginationProps) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxPagesToShow = 5
    const halfWindow = Math.floor(maxPagesToShow / 2)

    let startPage = Math.max(1, currentPage - halfWindow)
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }

    if (startPage > 1) {
      pages.push(1)
      if (startPage > 2) pages.push('...')
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex flex-col gap-4 items-center justify-between px-4 py-4 border-t">
      {/* Items per page selector */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Show:</span>
        {[10, 20, 50, 100].map((limit) => (
          <button
            key={limit}
            onClick={() => {
              onItemsPerPageChange(limit)
              onPageChange(1) // Reset to page 1
            }}
            className={`px-3 py-1 rounded ${
              itemsPerPage === limit
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {limit}
          </button>
        ))}
        <span>per page</span>
      </div>

      {/* Info and navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
        {/* Item count info */}
        <div className="text-sm text-gray-600">
          Showing {startItem}-{endItem} of {totalItems} transactions
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-1">
          {/* First page button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>

          {/* Previous button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1 mx-2">
            {pageNumbers.map((page, idx) => (
              <button
                key={idx}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={page === '...'}
                className={`w-8 h-8 text-sm rounded ${
                  page === currentPage
                    ? 'bg-blue-500 text-white font-semibold'
                    : page === '...'
                    ? 'text-gray-400 cursor-default'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Next button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Last page button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Page info */}
        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </div>
      </div>
    </div>
  )
}
