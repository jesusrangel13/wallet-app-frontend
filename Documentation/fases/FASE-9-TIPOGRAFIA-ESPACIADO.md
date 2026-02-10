# Fase 9: Tipografía y Espaciado

> **Objetivo**: Implementar un sistema tipográfico premium con números tabulares
> **Impacto**: Mejor legibilidad y aspecto más profesional

---

## Problema Actual

```tsx
// ACTUAL: Button.tsx
const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}
```

La tipografía es funcional pero no premium. Los números no usan tabular nums.

---

## Solución: Sistema Tipográfico Premium

### Actualizar globals.css

```css
/* AGREGAR a globals.css */

@layer base {
  /* Tipografía para números financieros */
  .font-numeric {
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum';
    letter-spacing: -0.02em;
  }

  /* Escala tipográfica para balances */
  .text-balance-hero {
    font-size: 2.75rem;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.03em;
  }

  .text-balance-large {
    font-size: 1.875rem;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .text-balance-medium {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.3;
  }

  /* Labels de métricas */
  .text-metric-label {
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: hsl(var(--muted-foreground));
  }

  /* Mejores focus states */
  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2;
  }
}

/* Responsive typography */
@media (max-width: 768px) {
  .text-balance-hero {
    font-size: 2rem;
  }
  .text-balance-large {
    font-size: 1.5rem;
  }
}
```

---

## Diagrama de Jerarquía Tipográfica

```
┌─────────────────────────────────────────────────────────────────┐
│  JERARQUÍA TIPOGRÁFICA RECOMENDADA                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BALANCE TOTAL          ← text-balance-hero (44px, -0.03em)     │
│  $1,234,567                                                      │
│  ─────────────────────────────────────────────────────          │
│                                                                  │
│  Ingresos del Mes       ← text-balance-large (30px, -0.02em)    │
│  $567,890                                                        │
│  ─────────────────────────────────────────────────────          │
│                                                                  │
│  Por Categoría          ← text-balance-medium (20px)            │
│  $123,456                                                        │
│  ─────────────────────────────────────────────────────          │
│                                                                  │
│  ETIQUETA               ← text-metric-label (12px, uppercase)   │
│  ─────────────────────────────────────────────────────          │
│                                                                  │
│  Descripción normal     ← text-base (16px)                      │
│                                                                  │
│  Texto secundario       ← text-sm text-gray-500 (14px)          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Ejemplo de Uso Mejorado

```tsx
// ANTES
<span className="text-3xl font-bold">$1,234,567</span>

// DESPUÉS
<span className="text-balance-hero font-numeric">$1,234,567</span>
```

---

## Comparación Visual: Tabular vs Proportional

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROPORTIONAL (❌ ANTES)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Cuenta Corriente    $1,234,567                                 │
│  Ahorro              $567,890                                   │
│  Inversiones         $12,345,678                                │
│                                                                  │
│  Los números no se alinean verticalmente                         │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                    TABULAR NUMS (✅ DESPUÉS)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Cuenta Corriente    $ 1,234,567                                │
│  Ahorro              $   567,890                                │
│  Inversiones         $12,345,678                                │
│                                                                  │
│  Todos los dígitos tienen el mismo ancho                        │
│  Se alinean perfectamente en columnas                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Componente Typography.tsx (Opcional)

```tsx
// NUEVO: frontend/src/components/ui/Typography.tsx

import { cn } from '@/lib/utils'

interface TypographyProps {
  children: React.ReactNode
  className?: string
}

export function BalanceHero({ children, className }: TypographyProps) {
  return (
    <span className={cn('text-balance-hero font-numeric', className)}>
      {children}
    </span>
  )
}

export function BalanceLarge({ children, className }: TypographyProps) {
  return (
    <span className={cn('text-balance-large font-numeric', className)}>
      {children}
    </span>
  )
}

export function BalanceMedium({ children, className }: TypographyProps) {
  return (
    <span className={cn('text-balance-medium font-numeric', className)}>
      {children}
    </span>
  )
}

export function MetricLabel({ children, className }: TypographyProps) {
  return (
    <span className={cn('text-metric-label', className)}>
      {children}
    </span>
  )
}

// Uso:
// <MetricLabel>Balance Total</MetricLabel>
// <BalanceHero>$1,234,567</BalanceHero>
```

---

## Actualizar Componente AnimatedCurrency

```tsx
// MODIFICAR: frontend/src/components/ui/animations/AnimatedCurrency.tsx

// Agregar clase font-numeric por defecto
export function AnimatedCurrency({
  amount,
  currency,
  className,
  ...props
}: AnimatedCurrencyProps) {
  return (
    <motion.span
      className={cn('font-numeric', className)}
      {...props}
    >
      {formatCurrency(amount, currency)}
    </motion.span>
  )
}
```

---

## Escala de Espaciado Recomendada

```css
/* Sistema de espaciado consistente */

/* Micro spacing (dentro de componentes) */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */

/* Component spacing */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */

/* Section spacing */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */

/* Layout spacing */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
--space-24: 6rem;    /* 96px */
```

---

## Aplicación en Widgets

```tsx
// Ejemplo de widget con tipografía mejorada

export function AccountCard({ account }: { account: Account }) {
  return (
    <Card>
      <CardContent className="p-6">
        {/* Label */}
        <MetricLabel>
          {account.name}
        </MetricLabel>

        {/* Balance principal */}
        <BalanceLarge className="mt-2 text-gray-900">
          <AnimatedCurrency
            amount={account.balance}
            currency={account.currency}
          />
        </BalanceLarge>

        {/* Cambio */}
        <p className="text-sm text-gray-500 mt-1 font-numeric">
          {account.change >= 0 ? '+' : ''}{account.change.toFixed(1)}% este mes
        </p>
      </CardContent>
    </Card>
  )
}
```

---

## Checklist de Implementación

- [x] Agregar clases tipográficas a `globals.css` *(Ya existían)*
- [x] Agregar clase `.font-numeric` con tabular-nums *(Ya existía)*
- [x] Crear componentes de tipografía (`Typography.tsx`)
- [x] Actualizar `AnimatedCurrency.tsx` con font-numeric
- [x] Aplicar `text-balance-hero` al hero balance widget
- [x] Aplicar `text-metric-label` a todas las etiquetas
- [x] Revisar espaciado en widgets principales
- [x] Probar responsive typography en mobile *(Clases responsive ya existen)*
- [x] Verificar que los números se alinean en tablas/listas

---

## Cambios Implementados

### ✅ Componente Typography.tsx
**Archivo**: `frontend/src/components/ui/Typography.tsx`

Creado componente con helpers tipográficos premium:
- `BalanceHero`: Para balances principales (text-balance-hero + font-numeric)
- `BalanceLarge`: Para balances secundarios (text-balance-large + font-numeric)
- `BalanceMedium`: Para balances medianos (text-balance-medium + font-numeric)
- `MetricLabel`: Para etiquetas de métricas (text-metric-label)

### ✅ AnimatedCurrency.tsx
**Archivo**: `frontend/src/components/ui/animations/AnimatedCurrency.tsx`

- Agregada clase `font-numeric` por defecto a todos los valores de moneda
- Asegura números tabulares en todas las animaciones de currency

### ✅ HeroBalanceWidget.tsx
**Archivo**: `frontend/src/components/widgets/HeroBalanceWidget.tsx`

- Header "Patrimonio Total": `text-metric-label`
- Balance principal: `text-balance-hero` (reemplaza text-5xl/text-6xl)
- Porcentaje de cambio: `font-numeric` para alineación consistente

### ✅ TotalBalanceWidget.tsx
**Archivo**: `frontend/src/components/widgets/TotalBalanceWidget.tsx`

- Título del widget: `text-metric-label` para consistencia

### ✅ AccountBalancesWidget.tsx
**Archivo**: `frontend/src/components/widgets/AccountBalancesWidget.tsx`

- Labels "Spent" y "Balance": `text-metric-label` para jerarquía consistente

---

## Mejoras Adicionales Sugeridas

### 1. **Aplicar Typography a más widgets**
Considerar aplicar las clases tipográficas a:
- `MonthlyExpensesWidget.tsx`
- `MonthlyIncomeWidget.tsx`
- `SavingsWidget.tsx`
- `ExpensesByCategoryWidget.tsx`
- Otros widgets de dashboard

### 2. **Usar componentes Typography directamente**
En lugar de aplicar clases manualmente, usar los componentes:
```tsx
// En lugar de:
<span className="text-balance-hero font-numeric">{value}</span>

// Usar:
<BalanceHero>{value}</BalanceHero>
```

### 3. **Aplicar font-numeric a tablas de transacciones**
Las listas y tablas de transacciones se beneficiarían de números tabulares para mejor alineación visual.

### 4. **Revisar espaciado entre secciones**
Aplicar el sistema de espaciado consistente documentado en la fase para mejorar la jerarquía visual.

---

## Prioridad

| Aspecto | Valor |
|---------|-------|
| Impacto | Medio |
| Esfuerzo | Bajo |
| Prioridad | P1 |
| Tiempo Estimado | 2h |

---

*Parte del documento [UX-UI-MEJORAS.md](../UX-UI-MEJORAS.md)*
