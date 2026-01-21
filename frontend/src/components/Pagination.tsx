'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('pagination')

  // Memoize calculations to prevent recalculating on every render
  const startItem = useMemo(
    () => (currentPage - 1) * itemsPerPage + 1,
    [currentPage, itemsPerPage]
  )

  const endItem = useMemo(
    () => Math.min(currentPage * itemsPerPage, totalItems),
    [currentPage, itemsPerPage, totalItems]
  )

  // Memoize page numbers generation - expensive calculation
  const pageNumbers = useMemo(() => {
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
  }, [currentPage, totalPages])

  return (
    <nav
      className="flex flex-col gap-4 items-center justify-between px-4 py-4 border-t"
      aria-label="Pagination navigation"
    >
      {/* Items per page selector */}
      <div className="flex items-center gap-2 text-sm text-gray-600" role="group" aria-label="Items per page">
        <span id="items-per-page-label">{t('show')}</span>
        {[10, 20, 50, 100].map((limit) => (
          <button
            key={limit}
            type="button"
            onClick={() => {
              onItemsPerPageChange(limit)
              onPageChange(1) // Reset to page 1
            }}
            aria-label={`Show ${limit} items per page`}
            aria-pressed={itemsPerPage === limit}
            className={`px-3 py-1 rounded ${itemsPerPage === limit
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {limit}
          </button>
        ))}
        <span>{t('perPage')}</span>
      </div>

      {/* Info and navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
        {/* Item count info */}
        <div className="text-sm text-gray-600" aria-live="polite">
          {t('showing', { start: startItem, end: endItem, total: totalItems })}
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-1" role="group" aria-label="Page navigation">
          {/* First page button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            aria-label={t('firstPage')}
          >
            <ChevronsLeft className="w-4 h-4" aria-hidden="true" />
          </Button>

          {/* Previous button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label={t('previousPage')}
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1 mx-2">
            {pageNumbers.map((page, idx) => {
              const isCurrentPage = page === currentPage
              const isEllipsis = page === '...'

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => typeof page === 'number' && onPageChange(page)}
                  disabled={isEllipsis}
                  aria-label={isEllipsis ? 'More pages' : `Go to page ${page}`}
                  aria-current={isCurrentPage ? 'page' : undefined}
                  className={`w-8 h-8 text-sm rounded ${isCurrentPage
                      ? 'bg-blue-500 text-white font-semibold'
                      : isEllipsis
                        ? 'text-gray-400 cursor-default'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {page}
                </button>
              )
            })}
          </div>

          {/* Next button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label={t('nextPage')}
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Button>

          {/* Last page button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            aria-label={t('lastPage')}
          >
            <ChevronsRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Page info */}
        <div className="text-sm text-gray-600" aria-live="polite">
          {t('pageOf', { current: currentPage, total: totalPages })}
        </div>
      </div>
    </nav>
  )
}
