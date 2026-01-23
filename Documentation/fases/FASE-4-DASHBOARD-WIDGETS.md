# Fase 4: Dashboard Hero y Widgets

> **Objetivo**: Crear widgets premium con hero balance prominente y insights inteligentes
> **Referencia**: Robinhood muestra el balance grande con cambio porcentual y sparkline

---

## Problema Actual

```tsx
// ACTUAL: dashboard/page.tsx
<div className="flex justify-between items-center">
  <div>
    <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
    <p className="text-gray-600 mt-1">{t('subtitle')}</p>
  </div>
  <MonthSelector />
</div>
```

El header es básico. Las fintechs premium muestran el balance prominentemente con contexto.

---

## Solución: Hero Balance Card

### HeroBalanceWidget.tsx

```tsx
// NUEVO: frontend/src/components/widgets/HeroBalanceWidget.tsx

'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { AnimatedCurrency } from '@/components/ui/animations/AnimatedCurrency'
import { Card } from '@/components/ui/Card'

interface HeroBalanceWidgetProps {
  totalBalance: number
  currency: 'CLP' | 'USD' | 'EUR'
  changePercent: number
  changeAmount: number
  period: string // "vs. mes anterior"
}

export function HeroBalanceWidget({
  totalBalance,
  currency,
  changePercent,
  changeAmount,
  period
}: HeroBalanceWidgetProps) {
  const [isHidden, setIsHidden] = useState(false)

  const isPositive = changePercent > 0
  const isNegative = changePercent < 0
  const isNeutral = changePercent === 0

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus
  const trendColor = isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-gray-500'
  const trendBg = isPositive ? 'bg-green-50' : isNegative ? 'bg-red-50' : 'bg-gray-50'

  return (
    <Card variant="gradient" className="p-6 md:p-8">
      {/* Header con toggle de visibilidad */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Balance Total
        </span>
        <button
          onClick={() => setIsHidden(!isHidden)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label={isHidden ? 'Mostrar balance' : 'Ocultar balance'}
        >
          {isHidden ? (
            <EyeOff className="w-5 h-5 text-gray-400" />
          ) : (
            <Eye className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Balance Principal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        {isHidden ? (
          <div className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            ••••••
          </div>
        ) : (
          <div className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            <AnimatedCurrency
              amount={totalBalance}
              currency={currency}
              duration={1.5}
            />
          </div>
        )}
      </motion.div>

      {/* Cambio vs período anterior */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-3"
      >
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${trendBg}`}>
          <TrendIcon className={`w-4 h-4 ${trendColor}`} />
          <span className={`text-sm font-semibold ${trendColor}`}>
            {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
          </span>
        </div>

        {!isHidden && (
          <span className="text-sm text-gray-500">
            {isPositive ? '+' : ''}{changeAmount.toLocaleString()} {period}
          </span>
        )}
      </motion.div>

      {/* Mini Sparkline (opcional) */}
      <div className="mt-6 h-16">
        {/* TODO: Integrar mini sparkline chart de últimos 7 días */}
        <div className="w-full h-full bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg flex items-center justify-center">
          <span className="text-xs text-gray-400">Sparkline últimos 7 días</span>
        </div>
      </div>
    </Card>
  )
}
```

---

### SmartInsightsWidget.tsx

```tsx
// NUEVO: frontend/src/components/widgets/SmartInsightsWidget.tsx

'use client'

import { motion } from 'framer-motion'
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  PiggyBank,
  ArrowRight
} from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface Insight {
  id: string
  type: 'positive' | 'warning' | 'tip' | 'achievement'
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
}

const insightStyles = {
  positive: {
    icon: TrendingUp,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    borderColor: 'border-l-green-500',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    borderColor: 'border-l-amber-500',
  },
  tip: {
    icon: Lightbulb,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    borderColor: 'border-l-blue-500',
  },
  achievement: {
    icon: PiggyBank,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    borderColor: 'border-l-purple-500',
  },
}

// Ejemplo de insights generados
const exampleInsights: Insight[] = [
  {
    id: '1',
    type: 'positive',
    title: 'Ingresos 15% mayores',
    description: 'Este mes has generado 15% más que tu promedio',
  },
  {
    id: '2',
    type: 'tip',
    title: 'Reserva para impuestos',
    description: 'Sugerimos apartar $450.000 para impuestos trimestrales',
    action: { label: 'Crear reserva', href: '#' }
  },
  {
    id: '3',
    type: 'warning',
    title: 'Gasto inusual detectado',
    description: 'Software subscriptions: $89.990 (+45% vs promedio)',
  },
]

export function SmartInsightsWidget() {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          Insights Inteligentes
        </h3>
      </div>

      <div className="divide-y divide-gray-50">
        {exampleInsights.map((insight, index) => {
          const style = insightStyles[insight.type]
          const Icon = style.icon

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 border-l-4 ${style.borderColor} hover:bg-gray-50 transition-colors`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${style.iconBg}`}>
                  <Icon className={`w-4 h-4 ${style.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{insight.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{insight.description}</p>

                  {insight.action && (
                    <button className="mt-2 text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
                      {insight.action.label}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}
```

---

## Diagrama Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                    HERO BALANCE WIDGET                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BALANCE TOTAL                                    [👁]           │
│                                                                  │
│  $1,234,567                                                     │
│  ────────────────────                                           │
│  Texto grande, bold, tracking-tight                             │
│                                                                  │
│  ┌─────────────┐                                                │
│  │ ↑ +15.3%    │  +$163,500 vs. mes anterior                   │
│  └─────────────┘                                                │
│  Badge con fondo verde                                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  │   │
│  │           Mini Sparkline últimos 7 días                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 SMART INSIGHTS WIDGET                            │
├─────────────────────────────────────────────────────────────────┤
│  💡 Insights Inteligentes                                        │
├─────────────────────────────────────────────────────────────────┤
│  │ ✅ Ingresos 15% mayores                                      │
│  │    Este mes has generado 15% más que tu promedio             │
├─────────────────────────────────────────────────────────────────┤
│  │ 💡 Reserva para impuestos                                    │
│  │    Sugerimos apartar $450.000 para impuestos                 │
│  │    [Crear reserva →]                                         │
├─────────────────────────────────────────────────────────────────┤
│  │ ⚠️ Gasto inusual detectado                                   │
│  │    Software subscriptions: $89.990 (+45%)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Checklist de Implementación

- [ ] Crear `HeroBalanceWidget.tsx`
- [ ] Crear `SmartInsightsWidget.tsx`
- [ ] Integrar sparkline chart (opcional)
- [ ] Conectar con datos reales del backend
- [ ] Implementar lógica de cálculo de insights
- [ ] Agregar al registro de widgets disponibles
- [ ] Agregar traducciones
- [ ] Probar toggle de visibilidad de balance

---

## Prioridad

| Aspecto | Valor |
|---------|-------|
| Impacto | Alto |
| Esfuerzo | Medio |
| Prioridad | P1 |
| Tiempo Estimado | 4h |

---

*Parte del documento [UX-UI-MEJORAS.md](../UX-UI-MEJORAS.md)*
