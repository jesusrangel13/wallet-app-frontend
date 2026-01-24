# Vista Anual de Finanzas - Documento de Diseño Completo

## Índice
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis de Requerimientos](#análisis-de-requerimientos)
3. [Diseño de Backend - 3 Enfoques](#diseño-de-backend---3-enfoques)
4. [Recomendación de Arquitectura](#recomendación-de-arquitectura)
5. [Diseño UX/UI](#diseño-uxui)
6. [Integración con Frontend Actual](#integración-con-frontend-actual)
7. [Plan de Implementación](#plan-de-implementación)
8. [Especificaciones Técnicas](#especificaciones-técnicas)

---

## Resumen Ejecutivo

### Objetivo
Crear una vista anual comprensiva que permita a los usuarios visualizar su comportamiento financiero a lo largo del año, con métricas agregadas, comparaciones históricas y insights actionables.

### Métricas Clave a Mostrar
- Total ingresos, gastos y ahorro del año
- Tasa de ahorro anual
- Gastos por categoría padre (ej: Alimentación, Transporte)
- Gastos por subcategoría (ej: Supermercado, Restaurantes)
- Gastos por tags creados por el usuario
- Tendencia mensual (12 meses)
- Comparación con años anteriores

### Parámetros del Usuario
| Parámetro | Valor |
|-----------|-------|
| Volumen esperado | 500-2000 transacciones/año |
| Frecuencia de consulta | 1-2 veces por semana |
| Comparativas | Histórico completo (múltiples años) |
| Granularidad | Categoría padre > subcategoría (2 niveles) |

---

## Análisis de Requerimientos

### Funcionales
1. **Vista resumen anual**: Totales de ingresos, gastos, ahorro
2. **Desglose por categorías**: Pie chart o bar chart con % del total
3. **Desglose por subcategorías**: Drill-down desde categoría padre
4. **Desglose por tags**: Top tags con montos y conteo
5. **Tendencia mensual**: Gráfico de 12 meses (barras o línea)
6. **Comparación multi-año**: Selector de años a comparar
7. **Insights automáticos**: "Gastaste 15% más que el año pasado en Transporte"

### No Funcionales
- **Performance**: Respuesta < 300ms para 2000 transacciones
- **Consistencia**: Totales siempre actualizados
- **Responsivo**: Funcional en móvil y desktop
- **Accesibilidad**: Navegable por teclado, screen readers

---

## Diseño de Backend - 3 Enfoques

### Arquitectura Actual Existente

```
┌─────────────────────────────────────────────────────────┐
│                    Base de Datos                        │
├─────────────────────────────────────────────────────────┤
│  Transaction          │  MonthlySummary (YA EXISTE)     │
│  ─────────────────    │  ─────────────────────────────  │
│  id                   │  id                             │
│  userId               │  userId                         │
│  amount               │  month (1-12)                   │
│  type (EXPENSE/INC)   │  year                           │
│  categoryId           │  income      ← Pre-calculado    │
│  date                 │  expense     ← Pre-calculado    │
│  tags[]               │  personalExpense                │
│                       │  sharedExpense                  │
│                       │  savings     ← Pre-calculado    │
└─────────────────────────────────────────────────────────┘
```

**Ventaja**: `MonthlySummary` ya guarda totales mensuales pre-calculados.

---

### Enfoque 1: Cálculo en Tiempo Real

#### Descripción
Todas las agregaciones se calculan al momento de la consulta usando queries SQL/Prisma.

#### Diagrama de Flujo
```
Usuario solicita /api/dashboard/annual?year=2024
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│  Promise.all([                                       │
│    getMonthlySummaries(year),      // ~10ms          │
│    getExpensesByCategory(year),    // ~150ms         │
│    getExpensesBySubcategory(year), // ~150ms         │
│    getExpensesByTag(year)          // ~100ms         │
│  ])                                                  │
└──────────────────────────────────────────────────────┘
                    │
                    ▼
            Respuesta: ~300-500ms
```

#### Queries Necesarias

```typescript
// 1. Totales (desde MonthlySummary - rápido)
const totals = await prisma.monthlySummary.aggregate({
  where: { userId, year },
  _sum: { income: true, expense: true, savings: true }
});

// 2. Por categoría padre (query pesada)
const byCategory = await prisma.$queryRaw`
  SELECT
    COALESCE(parent.name, cat.name) as category,
    COALESCE(parent.icon, cat.icon) as icon,
    SUM(t.amount) as total
  FROM transactions t
  LEFT JOIN category_templates cat ON t.category_id = cat.id
  LEFT JOIN category_templates parent ON cat.parent_template_id = parent.id
  WHERE t.user_id = ${userId}
    AND t.type = 'EXPENSE'
    AND EXTRACT(YEAR FROM t.date) = ${year}
  GROUP BY category, icon
  ORDER BY total DESC
`;

// 3. Por tag
const byTag = await prisma.$queryRaw`
  SELECT
    tg.name, tg.color,
    SUM(t.amount) as total,
    COUNT(*) as count
  FROM transactions t
  JOIN transaction_tags tt ON t.id = tt.transaction_id
  JOIN tags tg ON tt.tag_id = tg.id
  WHERE t.user_id = ${userId}
    AND t.type = 'EXPENSE'
    AND EXTRACT(YEAR FROM t.date) = ${year}
  GROUP BY tg.id
  ORDER BY total DESC
`;
```

#### Métricas

| Aspecto | Valor |
|---------|-------|
| **Complejidad de implementación** | ⭐⭐ (2/5) |
| **Performance (2K transacciones)** | 300-500ms |
| **Performance (10K transacciones)** | 2-3 segundos |
| **Consistencia de datos** | 100% - Siempre actualizado |
| **Nuevas tablas requeridas** | 0 |
| **Mantenimiento** | Bajo |

#### Pros
- ✅ Sin migraciones de base de datos
- ✅ Datos siempre actualizados en tiempo real
- ✅ Fácil de implementar y debuggear
- ✅ Flexible para agregar nuevas métricas

#### Contras
- ❌ Queries pesadas en cada request
- ❌ Escala linealmente con el volumen de datos
- ❌ Puede impactar performance de DB con uso frecuente
- ❌ No ideal para comparaciones multi-año complejas

#### Cuándo Elegir Este Enfoque
- MVP o prototipo rápido
- Volumen bajo de transacciones (<500/año)
- Consulta muy esporádica (<1 vez/semana)
- Presupuesto de tiempo limitado

---

### Enfoque 2: Tablas Materializadas

#### Descripción
Pre-calcular y almacenar todas las agregaciones en tablas dedicadas. Se actualizan cuando cambian las transacciones.

#### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    NUEVAS TABLAS                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AnnualSummary              CategoryAnnualSummary           │
│  ──────────────             ─────────────────────           │
│  userId                     userId                          │
│  year                       year                            │
│  income                     categoryId                      │
│  expense                    categoryName (denorm)           │
│  savings                    parentCategoryId                │
│  savingsRate                totalAmount                     │
│  isStale                    percentage                      │
│                             transactionCount                │
│                                                             │
│  TagAnnualSummary                                           │
│  ─────────────────                                          │
│  userId                                                     │
│  year                                                       │
│  tagId                                                      │
│  tagName (denorm)                                           │
│  totalAmount                                                │
│  percentage                                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Schema Prisma

```prisma
model AnnualSummary {
  id              String   @id @default(uuid())
  userId          String   @map("user_id")
  year            Int
  income          Decimal  @default(0) @db.Decimal(15, 2)
  expense         Decimal  @default(0) @db.Decimal(15, 2)
  personalExpense Decimal  @default(0) @map("personal_expense") @db.Decimal(15, 2)
  sharedExpense   Decimal  @default(0) @map("shared_expense") @db.Decimal(15, 2)
  savings         Decimal  @default(0) @db.Decimal(15, 2)
  savingsRate     Decimal  @default(0) @map("savings_rate") @db.Decimal(5, 2)
  isStale         Boolean  @default(false) @map("is_stale")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, year])
  @@index([userId])
  @@index([isStale])
  @@map("annual_summaries")
}

model CategoryAnnualSummary {
  id               String   @id @default(uuid())
  userId           String   @map("user_id")
  year             Int
  categoryId       String   @map("category_id")
  parentCategoryId String?  @map("parent_category_id")
  categoryName     String   @map("category_name")
  categoryIcon     String?  @map("category_icon")
  categoryColor    String?  @map("category_color")
  isParent         Boolean  @default(false) @map("is_parent")
  totalAmount      Decimal  @default(0) @map("total_amount") @db.Decimal(15, 2)
  transactionCount Int      @default(0) @map("transaction_count")
  percentage       Decimal  @default(0) @db.Decimal(5, 2)
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, year, categoryId])
  @@index([userId, year])
  @@index([userId, year, isParent])
  @@map("category_annual_summaries")
}

model TagAnnualSummary {
  id               String   @id @default(uuid())
  userId           String   @map("user_id")
  year             Int
  tagId            String   @map("tag_id")
  tagName          String   @map("tag_name")
  tagColor         String?  @map("tag_color")
  totalAmount      Decimal  @default(0) @map("total_amount") @db.Decimal(15, 2)
  transactionCount Int      @default(0) @map("transaction_count")
  percentage       Decimal  @default(0) @db.Decimal(5, 2)
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, year, tagId])
  @@index([userId, year])
  @@map("tag_annual_summaries")
}
```

#### Estrategia de Invalidación

```
┌─────────────────────────────────────────────────────────────┐
│                 FLUJO DE ACTUALIZACIÓN                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Usuario crea/edita/elimina Transacción                     │
│                    │                                        │
│                    ▼                                        │
│  transaction.service.ts                                     │
│  ├─ Actualiza MonthlySummary (existente)                    │
│  └─ Marca AnnualSummary.isStale = true  ← NUEVO             │
│                    │                                        │
│                    ▼                                        │
│  ┌─────────────────────────────────────┐                    │
│  │  Background Job (cada 5-15 min)     │                    │
│  │  ───────────────────────────────    │                    │
│  │  1. Buscar registros isStale=true   │                    │
│  │  2. Recalcular desde transacciones  │                    │
│  │  3. Actualizar tablas summary       │                    │
│  │  4. Marcar isStale=false            │                    │
│  └─────────────────────────────────────┘                    │
│                                                             │
│  Alternativa: Recalcular on-demand si isStale al consultar  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Métricas

| Aspecto | Valor |
|---------|-------|
| **Complejidad de implementación** | ⭐⭐⭐⭐ (4/5) |
| **Performance (2K transacciones)** | 20-50ms (lectura instantánea) |
| **Performance (10K transacciones)** | 20-50ms (constante) |
| **Consistencia de datos** | ~95% - Eventual (5-15 min delay) |
| **Nuevas tablas requeridas** | 3 |
| **Mantenimiento** | Alto |

#### Pros
- ✅ Lectura prácticamente instantánea
- ✅ Escala perfectamente sin importar volumen
- ✅ Comparación multi-año trivial y rápida
- ✅ Datos disponibles offline/sin recalcular

#### Contras
- ❌ 3 nuevas tablas + migración de base de datos
- ❌ Lógica de invalidación compleja
- ❌ Puede haber datos desactualizados (stale)
- ❌ Mayor complejidad de mantenimiento
- ❌ Edge cases: edición de transacciones antiguas

#### Cuándo Elegir Este Enfoque
- Alta frecuencia de consulta (>5 veces/semana)
- Volumen muy alto de transacciones (>5000/año)
- Comparación multi-año es feature crítico
- Se acepta eventual consistency (2-15 min delay)
- Equipo con experiencia en background jobs

---

### Enfoque 3: Híbrido (RECOMENDADO)

#### Descripción
Aprovechar `MonthlySummary` existente para totales (pre-computado) y calcular categorías/tags on-demand. Balance óptimo entre complejidad y performance.

#### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    ENFOQUE HÍBRIDO                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FASE 1: Totales Pre-Computados (~10ms)                     │
│  ──────────────────────────────────────                     │
│  ┌─────────────────────────────────┐                        │
│  │  MonthlySummary (YA EXISTE)     │                        │
│  │  ─────────────────────────────  │                        │
│  │  Ene: income, expense, savings  │                        │
│  │  Feb: income, expense, savings  │                        │
│  │  ...                            │  ──►  Sumar 12 meses   │
│  │  Dic: income, expense, savings  │       en memoria       │
│  └─────────────────────────────────┘                        │
│                                                             │
│  FASE 2: Categorías/Tags On-Demand (~100-150ms)             │
│  ──────────────────────────────────────────────             │
│  ┌─────────────────────────────────┐                        │
│  │  Transaction (consulta anual)   │                        │
│  │  ─────────────────────────────  │                        │
│  │  WHERE year = 2024              │  ──►  Agrupar en       │
│  │  AND type = 'EXPENSE'           │       memoria por      │
│  │  SELECT categoryId, amount      │       categoría/tag    │
│  └─────────────────────────────────┘                        │
│                                                             │
│  RESULTADO: ~150ms total (aceptable para consulta semanal)  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Implementación del Servicio

```typescript
// backend/src/services/dashboard.service.ts

export const getAnnualSummaryHybrid = async (
  userId: string,
  year: number
) => {
  const firstDay = new Date(year, 0, 1);
  const lastDay = new Date(year, 11, 31, 23, 59, 59);

  // ═══════════════════════════════════════════════════════════
  // FASE 1: Totales desde MonthlySummary (instantáneo ~10ms)
  // ═══════════════════════════════════════════════════════════
  const monthlySummaries = await prisma.monthlySummary.findMany({
    where: { userId, year },
    orderBy: { month: 'asc' }
  });

  // Sumar los 12 meses en memoria (O(12) - trivial)
  const totals = monthlySummaries.reduce((acc, s) => ({
    income: acc.income + Number(s.income),
    expense: acc.expense + Number(s.expense),
    personalExpense: acc.personalExpense + Number(s.personalExpense),
    sharedExpense: acc.sharedExpense + Number(s.sharedExpense),
    savings: acc.savings + Number(s.savings)
  }), { income: 0, expense: 0, personalExpense: 0, sharedExpense: 0, savings: 0 });

  // Tendencia mensual (12 puntos de datos)
  const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
    const s = monthlySummaries.find(m => m.month === i + 1);
    return {
      month: i + 1,
      monthName: getMonthName(i + 1), // Ene, Feb, Mar...
      income: Number(s?.income || 0),
      expense: Number(s?.expense || 0),
      savings: Number(s?.savings || 0)
    };
  });

  // ═══════════════════════════════════════════════════════════
  // FASE 2: Categorías y Tags en paralelo (~100-150ms)
  // ═══════════════════════════════════════════════════════════
  const [expenses, tagRelations] = await Promise.all([
    // Obtener todas las transacciones de gastos del año
    prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: firstDay, lte: lastDay }
      },
      select: { categoryId: true, amount: true }
    }),

    // Obtener relaciones de tags
    prisma.transactionTag.findMany({
      where: {
        transaction: {
          userId,
          type: 'EXPENSE',
          date: { gte: firstDay, lte: lastDay }
        }
      },
      select: {
        tagId: true,
        tag: { select: { name: true, color: true } },
        transaction: { select: { amount: true } }
      }
    })
  ]);

  // ═══════════════════════════════════════════════════════════
  // FASE 3: Procesamiento en memoria (eficiente)
  // ═══════════════════════════════════════════════════════════

  // Resolver categorías en batch (ya existe en el codebase)
  const categoryIds = expenses
    .map(e => e.categoryId)
    .filter((id): id is string => id !== null);
  const categoryMap = await resolveCategoriesBatch(categoryIds, userId);

  // Agregar por categoría padre
  const parentAgg: Record<string, CategoryAggregate> = {};
  const subAgg: Record<string, SubcategoryAggregate> = {};

  expenses.forEach(exp => {
    const amount = Number(exp.amount);
    const cat = exp.categoryId ? categoryMap.get(exp.categoryId) : null;
    const parent = cat?.parent || cat;
    const parentName = parent?.name || 'Sin categoría';

    // Categoría padre
    if (!parentAgg[parentName]) {
      parentAgg[parentName] = {
        name: parentName,
        icon: parent?.icon || null,
        color: parent?.color || null,
        amount: 0,
        count: 0
      };
    }
    parentAgg[parentName].amount += amount;
    parentAgg[parentName].count++;

    // Subcategoría (solo si tiene padre)
    if (cat?.parent) {
      const key = `${parentName}::${cat.name}`;
      if (!subAgg[key]) {
        subAgg[key] = {
          name: cat.name,
          parent: parentName,
          icon: cat.icon || null,
          color: cat.color || null,
          amount: 0,
          count: 0
        };
      }
      subAgg[key].amount += amount;
      subAgg[key].count++;
    }
  });

  // Agregar por tag
  const tagAgg: Record<string, TagAggregate> = {};
  tagRelations.forEach(tr => {
    if (!tagAgg[tr.tagId]) {
      tagAgg[tr.tagId] = {
        id: tr.tagId,
        name: tr.tag.name,
        color: tr.tag.color || null,
        amount: 0,
        count: 0
      };
    }
    tagAgg[tr.tagId].amount += Number(tr.transaction.amount);
    tagAgg[tr.tagId].count++;
  });

  // ═══════════════════════════════════════════════════════════
  // FASE 4: Formatear respuesta final
  // ═══════════════════════════════════════════════════════════
  const totalExpense = totals.expense;

  return {
    year,
    totals: {
      ...totals,
      savingsRate: totals.income > 0
        ? Number(((totals.savings / totals.income) * 100).toFixed(2))
        : 0
    },
    monthlyTrend,
    topCategories: Object.values(parentAgg)
      .map(c => ({
        ...c,
        percentage: totalExpense > 0
          ? Number(((c.amount / totalExpense) * 100).toFixed(2))
          : 0
      }))
      .sort((a, b) => b.amount - a.amount),
    topSubcategories: Object.values(subAgg)
      .map(s => ({
        ...s,
        percentage: totalExpense > 0
          ? Number(((s.amount / totalExpense) * 100).toFixed(2))
          : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20), // Top 20
    topTags: Object.values(tagAgg)
      .map(t => ({
        ...t,
        percentage: totalExpense > 0
          ? Number(((t.amount / totalExpense) * 100).toFixed(2))
          : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10) // Top 10
  };
};

// Comparación multi-año (eficiente usando MonthlySummary)
export const getMultiYearComparison = async (
  userId: string,
  years: number[]
) => {
  const summaries = await prisma.monthlySummary.groupBy({
    by: ['year'],
    where: { userId, year: { in: years } },
    _sum: { income: true, expense: true, savings: true }
  });

  return years.map(year => {
    const data = summaries.find(s => s.year === year);
    const income = Number(data?._sum.income || 0);
    const expense = Number(data?._sum.expense || 0);
    const savings = Number(data?._sum.savings || 0);

    return {
      year,
      income,
      expense,
      savings,
      savingsRate: income > 0 ? Number(((savings / income) * 100).toFixed(2)) : 0
    };
  });
};
```

#### Métricas

| Aspecto | Valor |
|---------|-------|
| **Complejidad de implementación** | ⭐⭐⭐ (2.5/5) |
| **Performance (2K transacciones)** | 100-200ms |
| **Performance (10K transacciones)** | 500-800ms |
| **Consistencia de datos** | 100% totales, ~99% categorías |
| **Nuevas tablas requeridas** | 0 |
| **Mantenimiento** | Bajo-Medio |

#### Pros
- ✅ Aprovecha `MonthlySummary` existente (sin desperdiciar trabajo previo)
- ✅ Sin migraciones de base de datos
- ✅ Totales siempre 100% consistentes
- ✅ Balance óptimo complejidad/performance
- ✅ Fácil escalar al Enfoque 2 si es necesario en el futuro

#### Contras
- ❌ Categorías/tags se calculan on-demand (no instantáneo)
- ❌ No tan rápido como materializado para volumen muy alto
- ❌ Requiere procesamiento en memoria

#### Cuándo Elegir Este Enfoque
- Frecuencia de consulta moderada (1-5 veces/semana)
- Se valora consistencia sobre velocidad máxima
- No se quiere agregar complejidad de nuevas tablas
- El volumen actual (500-2000 tx/año) es manejable
- Se quiere mantener opciones abiertas para escalar

---

## Recomendación de Arquitectura

### Enfoque Seleccionado: Híbrido (Enfoque 3)

#### Justificación

| Factor | Análisis |
|--------|----------|
| **Volumen (500-2000 tx/año)** | Manejable en ~150ms con enfoque híbrido |
| **Frecuencia (1-2/semana)** | No justifica complejidad de tablas materializadas |
| **MonthlySummary existe** | 70% del trabajo ya está hecho |
| **Sin migración** | Menor riesgo de deploy, más rápido de implementar |
| **Consistencia** | Totales siempre actualizados (lo más importante) |
| **Escalabilidad** | Fácil migrar a Enfoque 2 si crece significativamente |

### Comparativa Final

```
                    Enfoque 1       Enfoque 2       Enfoque 3
                    (Real-time)     (Materializado) (Híbrido)
                    ───────────     ─────────────   ─────────
Performance 2K tx   300-500ms       20-50ms         100-200ms
Performance 10K tx  2-3s            20-50ms         500-800ms
Complejidad         ⭐⭐              ⭐⭐⭐⭐           ⭐⭐⭐
Nuevas tablas       0               3               0
Consistencia        100%            ~95%            ~99%
Mantenimiento       Bajo            Alto            Bajo

                                                    ▲
                                                    │
                                            RECOMENDADO
```

---

## Diseño UX/UI

### Opción de Integración: Nueva Página

Se recomienda crear una **página dedicada** `/dashboard/annual` en lugar de un toggle en el dashboard existente.

#### Razones
1. **Claridad mental**: El usuario entiende que está en "modo anual"
2. **Espacio para métricas**: Más widgets específicos sin saturar
3. **Navegación clara**: Entrada en el sidebar
4. **Separación de concerns**: Código más limpio y mantenible

### Wireframe de la Vista Anual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Sidebar                    VISTA ANUAL                                   │
│  ──────────                   ───────────────────────────────────────────── │
│  │ Dashboard                                                                │
│  │ Transacciones              ┌─────────────────────────────────────────┐   │
│  │ Cuentas                    │  Selector de Año                        │   │
│  │ Grupos                     │  ◄  [2024]  ►    [Comparar años ▼]      │   │
│  │ Préstamos                  └─────────────────────────────────────────┘   │
│  │ ─────────────                                                            │
│  │ 📅 Vista Anual  ◄── NUEVO                                                │
│  │ ─────────────                                                            │
│  │ Importar                                                                 │
│  │ Configuración                                                            │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐ │
│  │   INGRESOS      │ │    GASTOS       │ │    AHORRO       │ │ TASA       │ │
│  │   TOTALES       │ │    TOTALES      │ │    TOTAL        │ │ AHORRO     │ │
│  │                 │ │                 │ │                 │ │            │ │
│  │  $12,000,000    │ │  $8,500,000     │ │  $3,500,000     │ │   29.2%    │ │
│  │  ↑ 12% vs 2023  │ │  ↓ 5% vs 2023   │ │  ↑ 45% vs 2023  │ │  ↑ 8pp     │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └────────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  TENDENCIA MENSUAL                                            ⋮ más  │  │
│  │  ─────────────────                                                    │  │
│  │                                                                       │  │
│  │   $1.2M ┤    ████                                                     │  │
│  │         │    ████ ████                              ████              │  │
│  │   $800K ┤    ████ ████ ████      ████ ████ ████    ████ ████          │  │
│  │         │    ████ ████ ████ ████ ████ ████ ████ ████████ ████ ████    │  │
│  │   $400K ┤    ████ ████ ████ ████ ████ ████ ████ ████████ ████ ████    │  │
│  │         └────────────────────────────────────────────────────────     │  │
│  │              Ene  Feb  Mar  Abr  May  Jun  Jul  Ago  Sep  Oct  Nov    │  │
│  │                                                                       │  │
│  │         ■ Ingresos   ■ Gastos   ─── Ahorro                            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │  GASTOS POR CATEGORÍA        │  │  TOP SUBCATEGORÍAS                   │ │
│  │  ────────────────────        │  │  ─────────────────                   │ │
│  │                              │  │                                      │ │
│  │      ┌───────┐               │  │  1. Supermercado      $1,500,000     │ │
│  │     ╱         ╲  Alimentación│  │     ████████████████░░  17.6%        │ │
│  │    │  29.4%    │  $2.5M      │  │                                      │ │
│  │    │           │             │  │  2. Restaurantes      $800,000       │ │
│  │     ╲  21.2%  ╱  Transporte  │  │     █████████░░░░░░░░  9.4%          │ │
│  │      ╲───────╱   $1.8M       │  │                                      │ │
│  │       ╲ ... ╱                │  │  3. Gasolina          $650,000       │ │
│  │                              │  │     ███████░░░░░░░░░  7.6%           │ │
│  │  [Ver todas las categorías]  │  │                                      │ │
│  └──────────────────────────────┘  │  4. Streaming         $240,000       │ │
│                                    │     ███░░░░░░░░░░░░░  2.8%           │ │
│  ┌──────────────────────────────┐  │                                      │ │
│  │  TOP TAGS                    │  │  5. Farmacia          $180,000       │ │
│  │  ────────                    │  │     ██░░░░░░░░░░░░░░  2.1%           │ │
│  │                              │  │                                      │ │
│  │  🏷 Necesario   $5M   58.8%  │  └──────────────────────────────────────┘ │
│  │  🏷 Ocio        $2M   23.5%  │                                           │
│  │  🏷 Salud       $800K  9.4%  │                                           │
│  │  🏷 Educación   $500K  5.9%  │                                           │
│  │                              │                                           │
│  └──────────────────────────────┘                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Wireframe - Modal de Comparación Multi-Año

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                          ✕  │
│                      COMPARACIÓN ANUAL                                      │
│                      ─────────────────                                      │
│                                                                             │
│   Selecciona años a comparar:  [✓] 2024  [✓] 2023  [ ] 2022  [ ] 2021      │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │   INGRESOS                                                          │   │
│   │                                                                     │   │
│   │   2024  ████████████████████████████████████████  $12,000,000       │   │
│   │   2023  ██████████████████████████████████        $10,700,000       │   │
│   │                                                   +12.1% ↑          │   │
│   │                                                                     │   │
│   │   GASTOS                                                            │   │
│   │                                                                     │   │
│   │   2024  ██████████████████████████████            $8,500,000        │   │
│   │   2023  ████████████████████████████████          $9,000,000        │   │
│   │                                                   -5.6% ↓           │   │
│   │                                                                     │   │
│   │   AHORRO                                                            │   │
│   │                                                                     │   │
│   │   2024  ████████████████████                      $3,500,000        │   │
│   │   2023  ████████████                              $1,700,000        │   │
│   │                                                   +105.9% ↑         │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  INSIGHTS AUTOMÁTICOS                                               │   │
│   │  ─────────────────────                                              │   │
│   │                                                                     │   │
│   │  💡 Tu tasa de ahorro mejoró de 15.9% a 29.2% (+13.3 puntos)        │   │
│   │  💡 Redujiste gastos en Transporte un 18% ($324,000 menos)          │   │
│   │  ⚠️  Aumentaste gastos en Entretenimiento un 34%                    │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                                                        [ Cerrar ]           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Componentes UI a Crear

#### 1. YearSelector (Similar a MonthSelector existente)

```tsx
// frontend/src/components/YearSelector.tsx

interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  minYear?: number;  // ej: 2020
  maxYear?: number;  // año actual
}

// Diseño visual:
// ◄  [2024]  ►
// Con botones para navegar años
// No permite años futuros
```

#### 2. AnnualSummaryCards (Grid de 4 tarjetas)

```tsx
// frontend/src/components/widgets/annual/AnnualSummaryCards.tsx

// 4 tarjetas en fila:
// [Ingresos] [Gastos] [Ahorro] [Tasa Ahorro]
//
// Cada tarjeta muestra:
// - Valor animado (AnimatedCurrency)
// - Comparación vs año anterior (si hay datos)
// - Icono de tendencia ↑↓
// - Color según positivo/negativo
```

#### 3. AnnualTrendChart (Gráfico de 12 meses)

```tsx
// frontend/src/components/widgets/annual/AnnualTrendChart.tsx

// Usar Recharts (ya instalado)
// - BarChart con 12 barras (una por mes)
// - Barras apiladas: Ingresos (verde) + Gastos (rojo)
// - Línea superpuesta: Ahorro
// - Tooltip con detalles al hover
// - Responsive según ancho del widget
```

#### 4. AnnualCategoriesWidget

```tsx
// frontend/src/components/widgets/annual/AnnualCategoriesWidget.tsx

// - Pie chart o Donut chart
// - Leyenda con top 5 categorías
// - Botón "Ver todas" abre modal con lista completa
// - Click en segmento muestra subcategorías
```

#### 5. AnnualSubcategoriesWidget

```tsx
// frontend/src/components/widgets/annual/AnnualSubcategoriesWidget.tsx

// - Lista vertical con barras de progreso
// - Top 10-20 subcategorías
// - Muestra categoría padre como badge
// - Porcentaje y monto absoluto
```

#### 6. AnnualTagsWidget

```tsx
// frontend/src/components/widgets/annual/AnnualTagsWidget.tsx

// - Lista de tags con chips de colores
// - Monto y porcentaje por tag
// - Contador de transacciones
// - Ordenado por monto descendente
```

#### 7. YearComparisonModal

```tsx
// frontend/src/components/modals/YearComparisonModal.tsx

// - Multi-select de años
// - Bar chart comparativo
// - Tabla con diferencias %
// - Insights automáticos generados
```

### Colores y Estilos (Siguiendo Design System Actual)

```css
/* Usar variables existentes de globals.css */

/* Ingresos - Verde */
--income: 142 76% 36%;

/* Gastos - Rojo */
--expense: 0 84% 60%;

/* Ahorro - Azul/Teal (principal) */
--primary: 172 66% 40%;

/* Comparación positiva */
.trend-up { color: hsl(var(--income)); }

/* Comparación negativa */
.trend-down { color: hsl(var(--expense)); }

/* Cards anuales - usar variante "elevated" para destacar */
<Card variant="elevated">
```

### Responsive Design

```
┌─────────────────────────────────────────────────────────────┐
│  DESKTOP (lg+)                                              │
│  ──────────────                                             │
│  - 4 tarjetas de resumen en fila                            │
│  - Gráfico de tendencia full-width                          │
│  - Categorías y Subcategorías lado a lado (50/50)           │
│  - Tags debajo                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  TABLET (md)                                                │
│  ──────────                                                 │
│  - 4 tarjetas en grid 2x2                                   │
│  - Gráfico de tendencia full-width                          │
│  - Categorías y Subcategorías apiladas (100% cada una)      │
│  - Tags full-width                                          │
└─────────────────────────────────────────────────────────────┘

┌───────────────────────────────┐
│  MOBILE (sm)                  │
│  ──────────                   │
│  - 4 tarjetas en columna      │
│  - Gráfico simplificado       │
│    (menos etiquetas)          │
│  - Todo apilado verticalmente │
│  - Scroll horizontal en       │
│    tablas si es necesario     │
└───────────────────────────────┘
```

### Navegación y Flujo de Usuario

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE NAVEGACIÓN                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Dashboard Mensual                                          │
│       │                                                     │
│       │  Click "Vista Anual" en sidebar                     │
│       ▼                                                     │
│  Vista Anual (año actual)                                   │
│       │                                                     │
│       ├──► Navegar años: ◄ [2024] ►                         │
│       │                                                     │
│       ├──► Click "Comparar años"                            │
│       │         │                                           │
│       │         ▼                                           │
│       │    Modal de comparación multi-año                   │
│       │                                                     │
│       ├──► Click en categoría del pie chart                 │
│       │         │                                           │
│       │         ▼                                           │
│       │    Expandir subcategorías de esa categoría          │
│       │                                                     │
│       └──► Click "Ver todas las categorías"                 │
│                 │                                           │
│                 ▼                                           │
│            Modal con tabla completa de categorías           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Integración con Frontend Actual

### Archivos a Crear

```
frontend/src/
├── app/[locale]/dashboard/annual/
│   └── page.tsx                          # Nueva página
│
├── components/
│   ├── YearSelector.tsx                  # Selector de año
│   │
│   ├── widgets/annual/
│   │   ├── AnnualSummaryCards.tsx        # 4 tarjetas resumen
│   │   ├── AnnualTrendChart.tsx          # Gráfico 12 meses
│   │   ├── AnnualCategoriesWidget.tsx    # Pie de categorías
│   │   ├── AnnualSubcategoriesWidget.tsx # Lista subcategorías
│   │   └── AnnualTagsWidget.tsx          # Lista de tags
│   │
│   └── modals/
│       └── YearComparisonModal.tsx       # Modal comparación
│
├── hooks/
│   └── useAnnualDashboard.ts             # Hooks de datos anuales
│
└── contexts/
    └── SelectedYearContext.tsx           # Contexto de año (opcional)
```

### Archivos a Modificar

```
frontend/src/
├── components/
│   └── Sidebar.tsx                       # Agregar enlace "Vista Anual"
│
└── config/
    └── navigation.ts                     # Si existe, agregar ruta
```

### Hooks de Datos (useAnnualDashboard.ts)

```typescript
// frontend/src/hooks/useAnnualDashboard.ts

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';

export const useAnnualSummary = (year: number) => {
  return useQuery({
    queryKey: ['annual-summary', year],
    queryFn: () => dashboardApi.getAnnualSummary(year),
    staleTime: 10 * 60 * 1000, // 10 minutos
    enabled: !!year
  });
};

export const useYearComparison = (years: number[]) => {
  return useQuery({
    queryKey: ['year-comparison', years],
    queryFn: () => dashboardApi.getYearComparison(years),
    staleTime: 10 * 60 * 1000,
    enabled: years.length > 0
  });
};
```

### Entrada en Sidebar

```typescript
// Agregar a baseNavItems en Sidebar.tsx

{
  href: `/${locale}/dashboard/annual`,
  icon: Calendar, // o TrendingUp de lucide-react
  label: t('sidebar.annualView'), // Traducción
}
```

---

## Plan de Implementación

### Fase 1: Backend (2-3 días)

| Tarea | Archivo | Prioridad |
|-------|---------|-----------|
| Implementar `getAnnualSummaryHybrid()` | `dashboard.service.ts` | Alta |
| Implementar `getMultiYearComparison()` | `dashboard.service.ts` | Alta |
| Crear controller `getAnnualSummary` | `dashboard.controller.ts` | Alta |
| Crear controller `getYearComparison` | `dashboard.controller.ts` | Alta |
| Agregar rutas | `dashboard.routes.ts` | Alta |
| Tests unitarios | `dashboard.service.test.ts` | Media |

### Fase 2: Frontend - Estructura (2-3 días)

| Tarea | Archivo | Prioridad |
|-------|---------|-----------|
| Crear página `/dashboard/annual` | `app/[locale]/dashboard/annual/page.tsx` | Alta |
| Crear `YearSelector` component | `components/YearSelector.tsx` | Alta |
| Crear hooks `useAnnualDashboard` | `hooks/useAnnualDashboard.ts` | Alta |
| Agregar enlace en sidebar | `components/Sidebar.tsx` | Alta |
| Agregar traducciones | `messages/es.json`, etc. | Media |

### Fase 3: Frontend - Widgets (3-4 días)

| Tarea | Archivo | Prioridad |
|-------|---------|-----------|
| `AnnualSummaryCards` | `widgets/annual/AnnualSummaryCards.tsx` | Alta |
| `AnnualTrendChart` | `widgets/annual/AnnualTrendChart.tsx` | Alta |
| `AnnualCategoriesWidget` | `widgets/annual/AnnualCategoriesWidget.tsx` | Media |
| `AnnualSubcategoriesWidget` | `widgets/annual/AnnualSubcategoriesWidget.tsx` | Media |
| `AnnualTagsWidget` | `widgets/annual/AnnualTagsWidget.tsx` | Media |

### Fase 4: Frontend - Comparación (2 días)

| Tarea | Archivo | Prioridad |
|-------|---------|-----------|
| `YearComparisonModal` | `modals/YearComparisonModal.tsx` | Media |
| Lógica de insights | Dentro del modal | Baja |

### Fase 5: Polish y Testing (2 días)

| Tarea | Descripción | Prioridad |
|-------|-------------|-----------|
| Responsive design | Ajustar para tablet/móvil | Alta |
| Animaciones | Entry animations, transiciones | Media |
| Loading states | Skeletons para cada widget | Media |
| Error handling | Estados de error y retry | Media |
| E2E tests | Cypress/Playwright si aplica | Baja |

---

## Especificaciones Técnicas

### API Endpoints

#### GET /api/dashboard/annual-summary

**Query Parameters:**
| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| year | number | Sí | Año a consultar (ej: 2024) |

**Response:**
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "totals": {
      "income": 12000000,
      "expense": 8500000,
      "personalExpense": 6000000,
      "sharedExpense": 2500000,
      "savings": 3500000,
      "savingsRate": 29.17
    },
    "monthlyTrend": [
      { "month": 1, "monthName": "Ene", "income": 1000000, "expense": 750000, "savings": 250000 },
      { "month": 2, "monthName": "Feb", "income": 1000000, "expense": 800000, "savings": 200000 },
      ...
    ],
    "topCategories": [
      { "name": "Alimentación", "icon": "🍔", "color": "#FF5733", "amount": 2500000, "percentage": 29.41, "count": 156 },
      { "name": "Transporte", "icon": "🚗", "color": "#33FF57", "amount": 1800000, "percentage": 21.18, "count": 89 },
      ...
    ],
    "topSubcategories": [
      { "name": "Supermercado", "parent": "Alimentación", "icon": "🛒", "color": "#FF8C00", "amount": 1500000, "percentage": 17.65, "count": 98 },
      { "name": "Restaurantes", "parent": "Alimentación", "icon": "🍽️", "color": "#FF6347", "amount": 800000, "percentage": 9.41, "count": 45 },
      ...
    ],
    "topTags": [
      { "id": "uuid-1", "name": "Necesario", "color": "#0066CC", "amount": 5000000, "percentage": 58.82, "count": 245 },
      { "id": "uuid-2", "name": "Ocio", "color": "#FF6600", "amount": 2000000, "percentage": 23.53, "count": 67 },
      ...
    ]
  }
}
```

#### GET /api/dashboard/year-comparison

**Query Parameters:**
| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| years | string | Sí | Años separados por coma (ej: "2024,2023,2022") |

**Response:**
```json
{
  "success": true,
  "data": [
    { "year": 2024, "income": 12000000, "expense": 8500000, "savings": 3500000, "savingsRate": 29.17 },
    { "year": 2023, "income": 10700000, "expense": 9000000, "savings": 1700000, "savingsRate": 15.89 },
    { "year": 2022, "income": 9500000, "expense": 8800000, "savings": 700000, "savingsRate": 7.37 }
  ]
}
```

### Tipos TypeScript

```typescript
// types/annual.ts

interface AnnualTotals {
  income: number;
  expense: number;
  personalExpense: number;
  sharedExpense: number;
  savings: number;
  savingsRate: number;
}

interface MonthlyDataPoint {
  month: number;
  monthName: string;
  income: number;
  expense: number;
  savings: number;
}

interface CategorySummary {
  name: string;
  icon: string | null;
  color: string | null;
  amount: number;
  percentage: number;
  count: number;
}

interface SubcategorySummary extends CategorySummary {
  parent: string;
}

interface TagSummary {
  id: string;
  name: string;
  color: string | null;
  amount: number;
  percentage: number;
  count: number;
}

interface AnnualSummary {
  year: number;
  totals: AnnualTotals;
  monthlyTrend: MonthlyDataPoint[];
  topCategories: CategorySummary[];
  topSubcategories: SubcategorySummary[];
  topTags: TagSummary[];
}

interface YearComparison {
  year: number;
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
}
```

### Traducciones (i18n)

```json
// messages/es.json
{
  "annualView": {
    "title": "Vista Anual",
    "subtitle": "Resumen financiero del año",
    "yearSelector": {
      "previous": "Año anterior",
      "next": "Año siguiente"
    },
    "totals": {
      "income": "Ingresos Totales",
      "expense": "Gastos Totales",
      "savings": "Ahorro Total",
      "savingsRate": "Tasa de Ahorro"
    },
    "comparison": {
      "title": "Comparación Anual",
      "vsLastYear": "vs año anterior",
      "selectYears": "Selecciona años a comparar"
    },
    "categories": {
      "title": "Gastos por Categoría",
      "viewAll": "Ver todas las categorías"
    },
    "subcategories": {
      "title": "Top Subcategorías"
    },
    "tags": {
      "title": "Gastos por Tags"
    },
    "trend": {
      "title": "Tendencia Mensual",
      "income": "Ingresos",
      "expense": "Gastos",
      "savings": "Ahorro"
    },
    "insights": {
      "title": "Insights",
      "improved": "Tu tasa de ahorro mejoró",
      "decreased": "Redujiste gastos en",
      "increased": "Aumentaste gastos en"
    }
  }
}
```

---

## Verificación y Testing

### Test Manual - Checklist

- [ ] Navegar a `/dashboard/annual` desde sidebar
- [ ] Ver resumen del año actual con totales correctos
- [ ] Navegar entre años con selector ◄ ►
- [ ] Verificar que no se pueda ir a año futuro
- [ ] Ver gráfico de tendencia con 12 meses
- [ ] Ver pie chart de categorías
- [ ] Click en categoría muestra subcategorías
- [ ] Ver lista de tags con montos
- [ ] Abrir modal de comparación multi-año
- [ ] Seleccionar 2+ años y ver comparativa
- [ ] Verificar responsive en móvil
- [ ] Verificar loading states (skeletons)
- [ ] Verificar manejo de errores

### Test de Performance

```bash
# Con 1000+ transacciones, verificar:
# - Respuesta del endpoint < 300ms
# - Renderizado de página < 1s
# - Animaciones fluidas a 60fps
```

### Test de Consistencia

```bash
# Comparar totales de vista anual con:
# - Suma de MonthlySummary del año
# - Suma manual de transacciones del año
# Los tres valores deben coincidir
```

---

## Conclusión

Este documento proporciona una guía completa para implementar la Vista Anual de Finanzas, incluyendo:

1. **3 enfoques de backend** con análisis detallado de pros/contras
2. **Recomendación clara**: Enfoque Híbrido aprovechando MonthlySummary
3. **Diseño UX/UI** con wireframes y especificaciones visuales
4. **Plan de integración** con el frontend existente
5. **Especificaciones técnicas** de API, tipos y traducciones

La implementación siguiendo este plan resultará en una feature profesional, performante y alineada con la arquitectura existente de la aplicación.
