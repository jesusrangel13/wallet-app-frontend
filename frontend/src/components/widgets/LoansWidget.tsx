'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { HandCoins } from 'lucide-react'
import { loanAPI } from '@/lib/api'
import { LoansSummary } from '@/types'
import { formatCurrency, type Currency } from '@/types/currency'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'

interface LoansWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const LoansWidget = ({ gridWidth = 1, gridHeight = 1 }: LoansWidgetProps) => {
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const fontSizes = getResponsiveFontSizes(dimensions)
  const [summary, setSummary] = useState<LoansSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true)
        setError(false)
        const response = await loanAPI.getSummary()
        setSummary(response.data.data)
      } catch (err) {
        console.error('Error fetching loans summary:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <HandCoins className="h-4 w-4 text-orange-600" />
            Mis Préstamos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !summary) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <HandCoins className="h-4 w-4 text-orange-600" />
            Mis Préstamos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No se pudo cargar la información</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className={`${dimensions.isWide ? 'text-base' : 'text-sm'} font-medium text-gray-600 flex items-center gap-2`}>
          <HandCoins className={`${dimensions.isWide ? 'h-5 w-5' : 'h-4 w-4'} text-orange-600`} />
          Mis Préstamos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {summary.totalLoans === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">No tienes préstamos registrados</p>
            <Link
              href="/dashboard/loans"
              className="block text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Crear préstamo →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pending Amount - Main Highlight */}
            <div>
              <div className={`${fontSizes.value} font-bold text-orange-600`}>
                {formatCurrency(summary.totalPending, summary.currency as Currency)}
              </div>
              <p className={`${fontSizes.label} text-gray-500`}>Pendiente de cobrar</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {summary.activeLoans}
                </div>
                <p className="text-xs text-gray-500">Préstamos activos</p>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {formatCurrency(summary.totalLent, summary.currency as Currency)}
                </div>
                <p className="text-xs text-gray-500">Total prestado</p>
              </div>
            </div>

            {/* Recovered Amount */}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Recuperado:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(summary.totalRecovered, summary.currency as Currency)}
                </span>
              </div>
            </div>

            {/* Link to full page */}
            <Link
              href="/dashboard/loans"
              className="block mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Ver todos →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
