# Fase 8: Funcionalidades para Freelancers

> **Objetivo**: Agregar características específicas para freelancers como tracking de impuestos y clientes
> **Público**: Freelancers y Autónomos

---

## Problema Actual

No hay diferenciación entre gastos personales y de negocio, ni tracking de clientes/proyectos.

---

## Solución: Tax & Client Tracking

### Nuevo campo en Transaction Form

```tsx
// MODIFICAR: frontend/src/components/TransactionFormModal.tsx

// Agregar toggle de tipo de gasto (para EXPENSE)
{selectedType === 'EXPENSE' && (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">
      Tipo de gasto
    </label>
    <div className="flex gap-2">
      {[
        { value: 'personal', label: 'Personal', icon: User },
        { value: 'business', label: 'Negocio', icon: Briefcase },
        { value: 'mixed', label: 'Mixto', icon: Percent },
      ].map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setValue('taxCategory', option.value)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all',
            watch('taxCategory') === option.value
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <option.icon className="w-4 h-4" />
          {option.label}
        </button>
      ))}
    </div>

    {/* Porcentaje para gastos mixtos */}
    {watch('taxCategory') === 'mixed' && (
      <div className="mt-3 flex items-center gap-3">
        <span className="text-sm text-gray-600">% Negocio:</span>
        <Input
          type="number"
          min={0}
          max={100}
          className="w-24"
          {...register('businessPercent')}
        />
        <span className="text-sm text-gray-500">%</span>
      </div>
    )}
  </div>
)}
```

---

### TaxSummaryWidget.tsx

```tsx
// NUEVO: frontend/src/components/widgets/TaxSummaryWidget.tsx

'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Receipt, Download, Calculator } from 'lucide-react'
import { AnimatedCurrency } from '@/components/ui/animations/AnimatedCurrency'
import { Button } from '@/components/ui/Button'

interface TaxSummaryWidgetProps {
  businessExpenses: number
  personalExpenses: number
  estimatedDeductions: number
  taxRate: number
  currency: 'CLP' | 'USD' | 'EUR'
}

export function TaxSummaryWidget({
  businessExpenses,
  personalExpenses,
  estimatedDeductions,
  taxRate,
  currency
}: TaxSummaryWidgetProps) {
  const estimatedTaxSavings = estimatedDeductions * (taxRate / 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Receipt className="w-5 h-5 text-primary" />
          Resumen Tributario
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Gastos de negocio */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Gastos de Negocio</span>
            <span className="font-semibold text-gray-900">
              <AnimatedCurrency amount={businessExpenses} currency={currency} />
            </span>
          </div>

          {/* Gastos personales */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Gastos Personales</span>
            <span className="font-medium text-gray-500">
              <AnimatedCurrency amount={personalExpenses} currency={currency} />
            </span>
          </div>

          <hr className="border-gray-100" />

          {/* Deducciones estimadas */}
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-900 font-medium">Deducciones Estimadas</span>
              <p className="text-xs text-gray-500">Basado en tasa del {taxRate}%</p>
            </div>
            <span className="font-bold text-green-600">
              <AnimatedCurrency amount={estimatedTaxSavings} currency={currency} />
            </span>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Calculator className="w-4 h-4 mr-2" />
              Calcular
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### IncomeByClientWidget.tsx

```tsx
// NUEVO: frontend/src/components/widgets/IncomeByClientWidget.tsx

'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Users, TrendingUp, TrendingDown } from 'lucide-react'
import { AnimatedCurrency } from '@/components/ui/animations/AnimatedCurrency'

interface ClientIncome {
  clientName: string
  income: number
  percentChange: number
  color: string
}

export function IncomeByClientWidget({ clients }: { clients: ClientIncome[] }) {
  const total = clients.reduce((sum, c) => sum + c.income, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Users className="w-5 h-5 text-primary" />
          Ingresos por Cliente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {clients.map((client, index) => (
            <div key={client.clientName} className="flex items-center gap-3">
              {/* Barra de porcentaje */}
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {client.clientName}
                  </span>
                  <span className="text-sm text-gray-600">
                    <AnimatedCurrency amount={client.income} currency="CLP" />
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(client.income / total) * 100}%`,
                      backgroundColor: client.color,
                    }}
                  />
                </div>
              </div>

              {/* Cambio porcentual */}
              <div className={`flex items-center gap-1 text-sm ${
                client.percentChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {client.percentChange >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(client.percentChange)}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### Sistema de Tags con Tipo Client/Project

```tsx
// MEJORAR: Sistema de tags para incluir tipo "client"

// En el schema de tags (backend), agregar:
interface Tag {
  id: string
  name: string
  color: string
  type: 'general' | 'client' | 'project'  // NUEVO
}

// Componente ClientTagSelector
export function ClientTagSelector({
  tags,
  selectedTags,
  onSelect
}: {
  tags: Tag[]
  selectedTags: string[]
  onSelect: (tagId: string) => void
}) {
  const clientTags = tags.filter(t => t.type === 'client')

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Cliente
      </label>
      <div className="flex flex-wrap gap-2">
        {clientTags.map(tag => (
          <button
            key={tag.id}
            type="button"
            onClick={() => onSelect(tag.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              selectedTags.includes(tag.id)
                ? 'ring-2 ring-offset-2'
                : 'opacity-70 hover:opacity-100'
            )}
            style={{
              backgroundColor: `${tag.color}20`,
              color: tag.color,
              ...(selectedTags.includes(tag.id) && { ringColor: tag.color })
            }}
          >
            {tag.name}
          </button>
        ))}
        <button
          type="button"
          className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 border border-dashed border-gray-300 hover:border-gray-400"
        >
          + Nuevo Cliente
        </button>
      </div>
    </div>
  )
}
```

---

### InvoiceTrackingWidget.tsx (Futuro)

```tsx
// NUEVO: frontend/src/components/widgets/InvoiceTrackingWidget.tsx

'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { AnimatedCurrency } from '@/components/ui/animations/AnimatedCurrency'

interface Invoice {
  id: string
  clientName: string
  amount: number
  status: 'pending' | 'paid' | 'overdue'
  dueDate: Date
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    label: 'Pendiente'
  },
  paid: {
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-50',
    label: 'Pagada'
  },
  overdue: {
    icon: AlertCircle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    label: 'Vencida'
  }
}

export function InvoiceTrackingWidget({ invoices }: { invoices: Invoice[] }) {
  const pendingAmount = invoices
    .filter(i => i.status === 'pending' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <FileText className="w-5 h-5 text-primary" />
          Facturas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Resumen */}
        <div className="p-4 bg-gray-50 rounded-lg mb-4">
          <p className="text-sm text-gray-500">Por cobrar</p>
          <p className="text-2xl font-bold text-gray-900">
            <AnimatedCurrency amount={pendingAmount} currency="CLP" />
          </p>
        </div>

        {/* Lista de facturas */}
        <div className="space-y-3">
          {invoices.slice(0, 5).map(invoice => {
            const status = statusConfig[invoice.status]
            const StatusIcon = status.icon

            return (
              <div key={invoice.id} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${status.bg}`}>
                  <StatusIcon className={`w-4 h-4 ${status.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {invoice.clientName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {status.label} • Vence {invoice.dueDate.toLocaleDateString()}
                  </p>
                </div>
                <span className="font-semibold text-gray-900">
                  <AnimatedCurrency amount={invoice.amount} currency="CLP" />
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## Diagrama de Flujo para Freelancers

```
┌─────────────────────────────────────────────────────────────────┐
│                  FLUJO DE TRANSACCIÓN FREELANCER                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Registrar Gasto/Ingreso                                      │
│     │                                                            │
│     ├── Tipo: [Personal] [Negocio] [Mixto]                      │
│     │         ↓          ↓         ↓                            │
│     │      100%        100%     X% Negocio                      │
│     │     Personal   Deducible                                   │
│     │                                                            │
│     └── Si es Ingreso → Seleccionar Cliente/Proyecto            │
│                                                                  │
│  2. Automáticamente se actualiza:                                │
│     ├── TaxSummaryWidget (deducciones estimadas)                │
│     ├── IncomeByClientWidget (ingresos por cliente)             │
│     └── InvoiceTrackingWidget (facturas pendientes)             │
│                                                                  │
│  3. Al final del período:                                        │
│     └── Exportar reporte tributario (PDF/CSV)                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Modificaciones al Backend (Opcional)

```typescript
// Agregar campos al modelo Transaction
interface Transaction {
  // ... campos existentes
  taxCategory?: 'personal' | 'business' | 'mixed'
  businessPercent?: number // Solo para 'mixed'
  clientId?: string // Relación con tag de tipo 'client'
  projectId?: string // Relación con tag de tipo 'project'
}

// Nuevo endpoint para resumen tributario
GET /api/tax-summary?year=2026&month=1
Response: {
  businessExpenses: number
  personalExpenses: number
  mixedExpenses: number
  totalDeductible: number
  taxRate: number
  estimatedSavings: number
}
```

---

## Checklist de Implementación

- [ ] Agregar campo `taxCategory` al formulario de transacción
- [ ] Agregar campo `businessPercent` para gastos mixtos
- [ ] Crear `TaxSummaryWidget.tsx`
- [ ] Crear `IncomeByClientWidget.tsx`
- [ ] Modificar sistema de tags para incluir tipo `client`/`project`
- [ ] Crear `ClientTagSelector.tsx`
- [ ] Agregar endpoint de resumen tributario (backend)
- [ ] Crear página de exportación de reportes
- [ ] Agregar traducciones
- [ ] Documentar flujo para usuarios

---

## Prioridad

| Aspecto | Valor |
|---------|-------|
| Impacto | Alto |
| Esfuerzo | Alto |
| Prioridad | P2 |
| Tiempo Estimado | 20h |

---

*Parte del documento [UX-UI-MEJORAS.md](../UX-UI-MEJORAS.md)*
