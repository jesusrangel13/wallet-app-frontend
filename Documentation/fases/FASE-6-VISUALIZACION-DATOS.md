# Fase 6: Visualización de Datos Premium

> **Objetivo**: Mejorar los charts con interactividad avanzada y mejor UX
> **Referencia**: Robinhood permite "scrubbing" (arrastrar para ver valores), Mint tiene drill-down

---

## Problema Actual

Los charts de Recharts son básicos sin interactividad avanzada.

---

## Solución: Interactive Charts

### Mejoras a implementar

1. **Time range selector** con animación
2. **Interactive tooltip** con cursor tracking
3. **Animated gradient fill**
4. **Scrubbing** (arrastrar para ver valores)

---

## Código de Implementación

### TimeRangeSelector.tsx

```tsx
// NUEVO: frontend/src/components/charts/TimeRangeSelector.tsx

'use client'

import { motion } from 'framer-motion'

interface TimeRangeSelectorProps {
  ranges: string[]
  selected: string
  onChange: (range: string) => void
}

export function TimeRangeSelector({ ranges, selected, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="inline-flex bg-gray-100 rounded-lg p-1">
      {ranges.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className="relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
        >
          {selected === range && (
            <motion.div
              layoutId="timeRangeIndicator"
              className="absolute inset-0 bg-white rounded-md shadow-sm"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className={`relative z-10 ${selected === range ? 'text-gray-900' : 'text-gray-500'}`}>
            {range}
          </span>
        </button>
      ))}
    </div>
  )
}
```

---

### CustomTooltip.tsx

```tsx
// NUEVO: frontend/src/components/charts/CustomTooltip.tsx

'use client'

import { motion } from 'framer-motion'

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  currency?: 'CLP' | 'USD' | 'EUR'
  previousValue?: number
}

export function CustomTooltip({
  active,
  payload,
  label,
  currency = 'CLP',
  previousValue
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const value = payload[0]?.value
  const percentChange = previousValue
    ? ((value / previousValue) * 100 - 100)
    : 0

  const formattedValue = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'CLP' ? 0 : 2,
  }).format(value)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-4 rounded-lg shadow-lg border border-gray-100"
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">
        {formattedValue}
      </p>
      {previousValue && (
        <p className={`text-sm ${percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%
        </p>
      )}
    </motion.div>
  )
}
```

---

### EnhancedAreaChart.tsx

```tsx
// NUEVO: frontend/src/components/charts/EnhancedAreaChart.tsx

'use client'

import { useState, useCallback } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { motion } from 'framer-motion'
import { TimeRangeSelector } from './TimeRangeSelector'
import { CustomTooltip } from './CustomTooltip'

interface DataPoint {
  date: string
  value: number
}

interface EnhancedAreaChartProps {
  data: DataPoint[]
  title: string
  currency?: 'CLP' | 'USD' | 'EUR'
  showTimeSelector?: boolean
  height?: number
}

const timeRanges = ['1S', '1M', '3M', '6M', '1A', 'Todo']

export function EnhancedAreaChart({
  data,
  title,
  currency = 'CLP',
  showTimeSelector = true,
  height = 300
}: EnhancedAreaChartProps) {
  const [selectedRange, setSelectedRange] = useState('1M')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const handleMouseMove = useCallback((state: any) => {
    if (state?.activeTooltipIndex !== undefined) {
      setActiveIndex(state.activeTooltipIndex)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(null)
  }, [])

  // Filtrar datos según rango seleccionado
  const filteredData = filterDataByRange(data, selectedRange)

  // Calcular valor actual para mostrar
  const currentValue = activeIndex !== null
    ? filteredData[activeIndex]?.value
    : filteredData[filteredData.length - 1]?.value

  const previousValue = activeIndex !== null && activeIndex > 0
    ? filteredData[activeIndex - 1]?.value
    : filteredData[filteredData.length - 2]?.value

  return (
    <div className="space-y-4">
      {/* Header con valor actual */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <motion.p
            key={currentValue}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-gray-900"
          >
            {new Intl.NumberFormat('es-CL', {
              style: 'currency',
              currency,
              minimumFractionDigits: currency === 'CLP' ? 0 : 2,
            }).format(currentValue || 0)}
          </motion.p>
        </div>

        {showTimeSelector && (
          <TimeRangeSelector
            ranges={timeRanges}
            selected={selectedRange}
            onChange={setSelectedRange}
          />
        )}
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={filteredData}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f3f4f6"
            />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              dy={10}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(value) =>
                new Intl.NumberFormat('es-CL', {
                  notation: 'compact',
                  compactDisplay: 'short'
                }).format(value)
              }
              dx={-10}
            />

            <Tooltip
              content={
                <CustomTooltip
                  currency={currency}
                  previousValue={previousValue}
                />
              }
              cursor={{
                stroke: 'hsl(var(--primary))',
                strokeWidth: 1,
                strokeDasharray: '5 5'
              }}
            />

            {/* Línea de referencia en 0 */}
            <ReferenceLine y={0} stroke="#e5e7eb" />

            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorGradient)"
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Función auxiliar para filtrar datos
function filterDataByRange(data: DataPoint[], range: string): DataPoint[] {
  const now = new Date()
  let startDate: Date

  switch (range) {
    case '1S':
      startDate = new Date(now.setDate(now.getDate() - 7))
      break
    case '1M':
      startDate = new Date(now.setMonth(now.getMonth() - 1))
      break
    case '3M':
      startDate = new Date(now.setMonth(now.getMonth() - 3))
      break
    case '6M':
      startDate = new Date(now.setMonth(now.getMonth() - 6))
      break
    case '1A':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1))
      break
    default:
      return data
  }

  return data.filter(d => new Date(d.date) >= startDate)
}
```

---

## Diagrama Visual

```
┌─────────────────────────────────────────────────────────────────┐
│  Flujo de Caja                    [1S] [1M] [3M] [6M] [1A] [Todo]│
│                                         ▲                        │
│  $1,234,567                             │ Selected               │
│  +15.3% vs período anterior             └─────────────────       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ▲                                     ┌──────────────┐          │
│  │                        ╱╲           │ Ene 15       │          │
│  │              ╱╲      ╱    ╲         │ $1,234,567   │ Tooltip  │
│  │            ╱    ╲  ╱        ╲      │ +5.2%        │          │
│  │          ╱        ╲            ╲    └──────────────┘          │
│  │        ╱                         ╲                            │
│  │      ╱                             ╲                          │
│  │~~~~╱~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~╲~~~~~ Gradient fill     │
│  └──────────────────────────────────────────────────────────►    │
│     Ene    Feb    Mar    Abr    May    Jun                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Checklist de Implementación

- [ ] Crear `TimeRangeSelector.tsx`
- [ ] Crear `CustomTooltip.tsx`
- [ ] Crear `EnhancedAreaChart.tsx`
- [ ] Actualizar `CashFlowWidget.tsx` para usar nuevos componentes
- [ ] Agregar gradient fills a todos los charts
- [ ] Implementar scrubbing (arrastrar)
- [ ] Probar responsividad
- [ ] Agregar animaciones de transición entre rangos

---

## Prioridad

| Aspecto | Valor |
|---------|-------|
| Impacto | Medio |
| Esfuerzo | Alto |
| Prioridad | P2 |
| Tiempo Estimado | 12h |

---

*Parte del documento [UX-UI-MEJORAS.md](../UX-UI-MEJORAS.md)*
