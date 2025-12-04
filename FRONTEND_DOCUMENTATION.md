# Frontend Documentation - Finance App

## 📋 Tabla de Contenidos
- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Páginas y Rutas](#páginas-y-rutas)
- [Componentes Principales](#componentes-principales)
- [Gestión de Estado](#gestión-de-estado)
- [Hooks Personalizados](#hooks-personalizados)
- [Características Principales](#características-principales)
- [Configuración](#configuración)

---

## Descripción General

El frontend de Finance App es una aplicación web moderna construida con **Next.js 15** y **React 18**, que proporciona una interfaz de usuario completa para la gestión financiera personal y compartida. Utiliza **TailwindCSS** para estilos, **React Query** para gestión de datos del servidor, y **Zustand** para estado local.

### Propósito
- Interfaz intuitiva para gestión de finanzas personales
- Dashboard personalizable con widgets arrastrables
- Gestión de gastos compartidos estilo Splitwise
- Importación y exportación de transacciones
- Visualización de datos con gráficos interactivos
- Notificaciones en tiempo real

---

## Arquitectura

### Patrón de Diseño
- **App Router de Next.js 15**: Routing basado en sistema de archivos
- **Server Components**: Componentes de servidor por defecto
- **Client Components**: Para interactividad (marcados con 'use client')
- **API Layer**: Axios con interceptores para autenticación
- **State Management**: React Query + Zustand
- **Component-First**: Componentes reutilizables y modulares

### Flujo de Datos
```
Usuario → Componente → Hook → API Client → Backend
                ↓
        React Query Cache
                ↓
        Zustand Store (estado local)
```

---

## Stack Tecnológico

### Core
- **Next.js 15**: Framework React con App Router
- **React 18**: Biblioteca de UI
- **TypeScript**: Tipado estático
- **TailwindCSS**: Framework CSS utility-first

### Gestión de Datos
- **@tanstack/react-query**: Server state management
- **Axios**: Cliente HTTP
- **Zustand**: Estado global ligero

### UI y Visualización
- **Recharts**: Gráficos y visualizaciones
- **Lucide React**: Iconos
- **Sonner**: Notificaciones toast
- **React Grid Layout**: Dashboard con widgets arrastrables

### Formularios y Validación
- **React Hook Form**: Gestión de formularios
- **Zod**: Validación de schemas
- **@hookform/resolvers**: Integración Zod + React Hook Form

### Utilidades
- **date-fns**: Manipulación de fechas
- **clsx + tailwind-merge**: Utilidades de clases CSS
- **PapaParse**: Parseo de CSV
- **XLSX**: Manejo de archivos Excel

### Backend Integration
- **@supabase/supabase-js**: Cliente de Supabase (PostgreSQL)

---

## Estructura del Proyecto

```
frontend/src/
├── app/                          # App Router (Next.js 15)
│   ├── (auth)/                   # Grupo de rutas de autenticación
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/                # Rutas del dashboard
│   │   ├── accounts/
│   │   ├── groups/
│   │   ├── import/
│   │   ├── loans/
│   │   ├── settings/
│   │   ├── transactions/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # Componentes React
│   ├── dashboard/                # Componentes específicos del dashboard
│   ├── providers/                # Providers (React Query, etc.)
│   ├── ui/                       # Componentes UI base
│   └── [componentes específicos]
├── hooks/                        # Custom hooks
│   ├── useAccounts.ts
│   ├── useCategories.ts
│   ├── useDashboard.ts
│   ├── useGroups.ts
│   ├── useTags.ts
│   ├── useTransactions.ts
│   └── useWidgetDimensions.ts
├── lib/                          # Utilidades y configuración
│   ├── api.ts                    # Cliente API
│   ├── supabase.ts               # Cliente Supabase
│   ├── queryClient.ts            # Configuración React Query
│   ├── utils.ts                  # Utilidades generales
│   ├── exportExcel.ts            # Exportación a Excel
│   └── exportTransactions.ts     # Exportación de transacciones
├── styles/                       # Estilos adicionales
│   └── dashboard-grid.css
├── types/                        # Tipos TypeScript
│   └── index.ts
└── store/                        # Zustand stores (si existen)
```

---

## Páginas y Rutas

### Rutas Públicas

#### `/` - Landing Page
- Página de inicio
- Información del producto
- Links a login/registro

#### `/login` - Inicio de Sesión
- Formulario de login
- Validación con Zod
- Redirección a dashboard tras login exitoso

#### `/register` - Registro
- Formulario de registro
- Validación de email y contraseña
- Creación de cuenta

### Rutas Protegidas (Dashboard)

#### `/dashboard` - Dashboard Principal
**Características**:
- Dashboard personalizable con widgets
- Grid layout arrastrable (React Grid Layout)
- Widgets disponibles:
  - Balance de cuentas
  - Flujo de caja
  - Gastos por categoría
  - Gastos personales vs. compartidos
  - Balances de grupos
  - Ahorros mensuales
  - Transacciones recientes
- Selector de mes/año
- Persistencia de configuración por usuario

**Componentes clave**:
- `DashboardGrid`: Grid principal con drag & drop
- `WidgetWrapper`: Wrapper para cada widget
- `WidgetSelector`: Modal para agregar widgets
- `MonthSelector`: Selector de período

#### `/dashboard/accounts` - Gestión de Cuentas
**Características**:
- Lista de cuentas bancarias
- Crear/editar/eliminar cuentas
- Tipos: Efectivo, Débito, Crédito, Ahorros, Inversión
- Balance total por moneda
- Historial de balance por cuenta
- Configuración de límite de crédito
- Día de corte para tarjetas

#### `/dashboard/transactions` - Transacciones
**Características**:
- Lista paginada de transacciones
- Filtros avanzados:
  - Por cuenta
  - Por tipo (ingreso/gasto/transferencia)
  - Por categoría
  - Por rango de fechas
  - Por monto (min/max)
  - Por etiquetas
  - Búsqueda por texto
- Ordenamiento (fecha, monto, payee)
- Crear/editar/eliminar transacciones
- Importar desde CSV/Excel
- Exportar a Excel
- Eliminación masiva
- Agrupación por fecha
- Indicadores de gastos compartidos y préstamos

**Componentes**:
- `TransactionFilters`: Panel de filtros
- `TransactionFormModal`: Modal de creación/edición
- `DateGroupHeader`: Agrupación por fecha
- `Pagination`: Paginación
- `SharedExpenseIndicator`: Badge de gasto compartido
- `LoanIndicator`: Badge de préstamo

#### `/dashboard/groups` - Grupos y Gastos Compartidos
**Características**:
- Lista de grupos
- Crear/editar/eliminar grupos
- Agregar/eliminar miembros
- Configurar división por defecto
- Ver balances del grupo
- Crear gastos compartidos
- 4 tipos de división:
  - Equitativa
  - Por porcentajes
  - Por partes
  - Montos exactos
- Deudas simplificadas
- Liquidar balances
- Marcar gastos como pagados
- Historial de pagos

**Componentes**:
- `SharedExpenseForm`: Formulario de gasto compartido
- `SettleBalanceModal`: Modal de liquidación
- `MarkExpensePaidModal`: Modal para marcar como pagado
- `MarkAsPaidButton`: Botón de acción rápida

#### `/dashboard/loans` - Préstamos
**Características**:
- Lista de préstamos
- Crear préstamos
- Registrar pagos
- Estados: Activo, Pagado, Cancelado
- Resumen por prestatario
- Filtros por estado
- Cancelar préstamos
- Eliminar préstamos

**Componentes**:
- `CreateLoanModal`: Modal de creación
- `RecordLoanPaymentModal`: Modal de registro de pago

#### `/dashboard/import` - Importación de Datos
**Características**:
- Importar transacciones desde CSV
- Importar desde Excel
- Mapeo de columnas
- Vista previa de datos
- Validación antes de importar
- Historial de importaciones
- Reporte de errores

#### `/dashboard/settings` - Configuración
**Características**:
- Perfil de usuario
- Configuración de moneda
- Cuenta por defecto para gastos compartidos
- Gestión de categorías
- Gestión de etiquetas
- Presupuestos mensuales
- Eliminar cuenta

---

## Componentes Principales

### Layout y Navegación

#### `Sidebar`
- Navegación principal
- Links a todas las secciones
- Indicador de ruta activa
- Responsive (colapsa en móvil)

#### `DashboardLayoutContent`
- Layout del dashboard
- Incluye sidebar y contenido principal
- Manejo de autenticación

### Dashboard

#### `DashboardGrid`
- Grid principal con React Grid Layout
- Drag & drop de widgets
- Responsive breakpoints
- Persistencia de layout

#### `WidgetWrapper`
- Wrapper para cada widget
- Botón de eliminar
- Configuración de widget
- Manejo de errores

#### `AddWidgetButton`
- Botón para agregar widgets
- Abre modal de selección

#### `WidgetSelector`
- Modal de selección de widgets
- Lista de widgets disponibles
- Prevención de duplicados

### Widgets Específicos

#### `BalancesWidget`
- Muestra balances de cuentas
- Agrupado por moneda
- Indicador de límite de crédito

#### `FixedAccountBalancesWidget`
- Versión fija (no arrastrable)
- Para uso fuera del dashboard

### Transacciones

#### `TransactionFormModal`
- Formulario completo de transacción
- Validación con Zod
- Selector de categorías
- Selector de etiquetas
- Soporte para transferencias
- Campos condicionales según tipo

#### `TransactionFilters`
- Panel de filtros avanzados
- Filtros por múltiples criterios
- Reset de filtros
- Aplicación en tiempo real

#### `CategorySelector`
- Selector de categorías jerárquico
- Soporte para subcategorías
- Búsqueda de categorías

#### `TagSelector`
- Selector de etiquetas múltiple
- Crear etiquetas on-the-fly
- Chips visuales

### Gastos Compartidos

#### `SharedExpenseForm`
- Formulario de gasto compartido
- Selector de grupo
- Selector de participantes
- Configuración de división
- Validación de montos

#### `SettleBalanceModal`
- Modal de liquidación de balance
- Cálculo automático de monto
- Selector de cuenta
- Creación de transacciones

#### `MarkExpensePaidModal`
- Marcar participante como pagado
- Opción de crear transacción
- Selector de cuenta

### Préstamos

#### `CreateLoanModal`
- Formulario de creación de préstamo
- Validación de montos
- Selector de prestatario
- Opción de crear transacción

#### `RecordLoanPaymentModal`
- Registro de pago de préstamo
- Validación de monto
- Opción de crear transacción

### UI Base

#### `MonthSelector`
- Selector de mes y año
- Navegación prev/next
- Botón "Hoy"

#### `NotificationBell`
- Icono de notificaciones
- Badge con contador
- Dropdown con lista

#### `NotificationDropdown`
- Lista de notificaciones
- Marcar como leída
- Eliminar notificación
- Marcar todas como leídas

#### `Pagination`
- Componente de paginación
- Navegación de páginas
- Info de resultados

### Indicadores

#### `SharedExpenseIndicator`
- Badge visual para gastos compartidos
- Muestra grupo
- Click para ver detalle

#### `LoanIndicator`
- Badge visual para préstamos
- Muestra prestatario
- Click para ver detalle

#### `PaymentStatusBadge`
- Badge de estado de pago
- Colores según estado
- Estados: Pagado, Pendiente

---

## Gestión de Estado

### React Query (Server State)
Gestiona todo el estado del servidor con caché automático:

**Queries**:
- `accounts`: Lista de cuentas
- `transactions`: Lista de transacciones
- `groups`: Lista de grupos
- `loans`: Lista de préstamos
- `categories`: Categorías del usuario
- `tags`: Etiquetas
- `budgets`: Presupuestos
- `notifications`: Notificaciones
- `dashboard-*`: Datos de widgets

**Mutations**:
- `createAccount`, `updateAccount`, `deleteAccount`
- `createTransaction`, `updateTransaction`, `deleteTransaction`
- `createGroup`, `updateGroup`, `deleteGroup`
- `createLoan`, `recordLoanPayment`
- `markExpensePaid`, `settleBalance`

**Configuración**:
```typescript
{
  staleTime: 5 * 60 * 1000,  // 5 minutos
  cacheTime: 10 * 60 * 1000, // 10 minutos
  refetchOnWindowFocus: true,
  retry: 1
}
```

### Zustand (Client State)
Estado local ligero para:
- Filtros de transacciones
- Estado de modales
- Preferencias de UI temporales

### Local Storage
- Token JWT de autenticación
- Preferencias de usuario
- Configuración de dashboard

---

## Hooks Personalizados

### `useAccounts`
```typescript
- useAccounts(): Query de todas las cuentas
- useAccount(id): Query de cuenta específica
- useCreateAccount(): Mutation para crear
- useUpdateAccount(): Mutation para actualizar
- useDeleteAccount(): Mutation para eliminar
- useTotalBalance(): Query de balance total
```

### `useTransactions`
```typescript
- useTransactions(filters): Query con filtros
- useTransaction(id): Query de transacción específica
- useCreateTransaction(): Mutation para crear
- useUpdateTransaction(): Mutation para actualizar
- useDeleteTransaction(): Mutation para eliminar
- useBulkDeleteTransactions(): Mutation para eliminar múltiples
- useRecentTransactions(limit): Query de recientes
```

### `useCategories`
```typescript
- useCategories(type?): Query de categorías
- useCreateCategory(): Mutation para crear
- useUpdateCategory(): Mutation para actualizar
- useDeleteCategory(): Mutation para eliminar
```

### `useTags`
```typescript
- useTags(): Query de etiquetas
- useCreateTag(): Mutation para crear
- useUpdateTag(): Mutation para actualizar
- useDeleteTag(): Mutation para eliminar
```

### `useGroups`
```typescript
- useGroups(): Query de grupos
- useGroup(id): Query de grupo específico
- useCreateGroup(): Mutation para crear
- useUpdateGroup(): Mutation para actualizar
- useDeleteGroup(): Mutation para eliminar
- useGroupBalances(id): Query de balances
- useSettleBalance(): Mutation para liquidar
```

### `useDashboard`
```typescript
- useCashFlow(months, params): Query de flujo de caja
- useExpensesByCategory(params): Query de gastos por categoría
- useBalanceHistory(days, params): Query de historial
- useGroupBalances(params): Query de balances de grupos
- useAccountBalances(): Query de balances de cuentas
- useSavings(params): Query de ahorros
```

### `useWidgetDimensions`
```typescript
- useWidgetDimensions(widgetType): Hook para dimensiones de widgets
- Retorna: { minW, minH, maxW, maxH, defaultW, defaultH }
```

---

## Características Principales

### 🎨 Dashboard Personalizable
- **Widgets arrastrables**: React Grid Layout
- **Persistencia**: Configuración guardada por usuario
- **Responsive**: Breakpoints para móvil/tablet/desktop
- **Widgets disponibles**:
  - Balance de cuentas
  - Flujo de caja (gráfico de líneas)
  - Gastos por categoría (gráfico de barras)
  - Gastos personales vs. compartidos
  - Balances de grupos
  - Ahorros mensuales
  - Transacciones recientes

### 📊 Visualización de Datos
- **Recharts**: Gráficos interactivos
- **Tipos de gráficos**:
  - Líneas (flujo de caja, historial de balance)
  - Barras (gastos por categoría)
  - Pie (distribución de gastos)
- **Tooltips informativos**
- **Colores consistentes**

### 🔍 Filtrado Avanzado
- **Múltiples criterios**: Cuenta, tipo, categoría, fechas, montos, etiquetas
- **Búsqueda por texto**: En descripción y payee
- **Ordenamiento**: Por fecha, monto, payee
- **Paginación**: Carga eficiente de datos
- **URL state**: Filtros en URL para compartir

### 📥 Importación/Exportación
- **Importar**:
  - CSV con mapeo de columnas
  - Excel (.xlsx)
  - Vista previa antes de importar
  - Validación de datos
- **Exportar**:
  - Excel con formato
  - Filtros aplicados
  - Múltiples hojas

### 👥 Gastos Compartidos
- **Grupos**: Crear y gestionar grupos
- **División flexible**: 4 tipos de división
- **Balances en tiempo real**: Cálculo automático
- **Deudas simplificadas**: Minimiza transacciones
- **Liquidación automática**: Crea transacciones al liquidar
- **Tracking de pagos**: Marcar como pagado/no pagado

### 💵 Gestión de Préstamos
- **Registro de préstamos**: A terceros o usuarios registrados
- **Pagos parciales**: Múltiples pagos
- **Estados automáticos**: ACTIVE → PAID
- **Resumen por prestatario**: Agrupación inteligente
- **Vinculación con transacciones**: Opcional

### 🔔 Notificaciones
- **Toast notifications**: Sonner
- **Notificaciones persistentes**: Bell icon con badge
- **Tipos**:
  - Pago recibido
  - Nuevo gasto compartido
  - Miembro agregado
  - Balance liquidado
- **Acciones**: Marcar como leída, eliminar

### 📱 Responsive Design
- **Mobile-first**: Diseño adaptable
- **Breakpoints**: sm, md, lg, xl
- **Sidebar colapsable**: En móvil
- **Grid adaptable**: Widgets reorganizados

### 🎨 UI/UX
- **TailwindCSS**: Estilos utility-first
- **Lucide Icons**: Iconos consistentes
- **Color coding**: Categorías y cuentas
- **Loading states**: Skeletons y spinners
- **Error handling**: Mensajes claros
- **Validación en tiempo real**: Formularios

---

## Configuración

### Variables de Entorno
```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Supabase (opcional)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Scripts Disponibles
```bash
# Desarrollo
npm run dev              # Servidor de desarrollo (puerto 3000)

# Producción
npm run build            # Build de producción
npm start                # Iniciar servidor de producción

# Linting
npm run lint             # Ejecutar ESLint
```

### Configuración de TailwindCSS
```javascript
// tailwind.config.ts
{
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Colores personalizados
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')
  ]
}
```

### Configuración de Next.js
```javascript
// next.config.js
{
  reactStrictMode: true,
  images: {
    domains: ['your-image-domain.com']
  }
}
```

---

## Flujos de Usuario

### Flujo de Autenticación
1. Usuario visita `/login`
2. Ingresa credenciales
3. Frontend envía POST a `/api/auth/login`
4. Backend retorna JWT
5. Frontend guarda token en localStorage
6. Redirección a `/dashboard`
7. Axios interceptor agrega token a todas las requests

### Flujo de Creación de Transacción
1. Usuario abre modal de transacción
2. Completa formulario (tipo, monto, categoría, etc.)
3. React Hook Form valida con Zod
4. Mutation envía POST a `/api/transactions`
5. Backend crea transacción y actualiza balance
6. React Query invalida cache de transacciones y cuentas
7. UI se actualiza automáticamente
8. Toast de confirmación

### Flujo de Gasto Compartido
1. Usuario selecciona grupo
2. Ingresa monto y descripción
3. Selecciona participantes
4. Configura tipo de división
5. Frontend calcula montos por participante
6. Mutation envía POST a `/api/shared-expenses`
7. Backend crea gasto y participantes
8. Backend crea notificaciones para participantes
9. React Query actualiza cache
10. UI muestra nuevo gasto

### Flujo de Liquidación de Balance
1. Usuario ve balance pendiente en grupo
2. Click en "Liquidar"
3. Modal muestra monto a pagar
4. Usuario selecciona cuenta (opcional)
5. Mutation envía POST a `/api/groups/:id/settle-balance`
6. Backend:
   - Crea Payment
   - Marca ExpenseParticipants como pagados
   - Crea transacciones en cuentas (si se seleccionó)
   - Crea notificación
7. React Query invalida cache
8. UI actualiza balances

---

## Optimizaciones

### 1. **React Query Cache**
- Reduce requests al servidor
- Stale time de 5 minutos
- Refetch automático en focus

### 2. **Code Splitting**
- Next.js divide código automáticamente
- Lazy loading de componentes pesados
- Dynamic imports para modales

### 3. **Optimistic Updates**
- Mutations actualizan UI antes de respuesta
- Rollback automático en error
- Mejor UX

### 4. **Debouncing**
- Búsqueda con debounce
- Evita requests excesivos

### 5. **Memoization**
- useMemo para cálculos pesados
- useCallback para funciones
- React.memo para componentes

### 6. **Image Optimization**
- Next.js Image component
- Lazy loading automático
- Formatos modernos (WebP)

---

## Tipos TypeScript

### Tipos Principales
```typescript
interface User {
  id: string
  email: string
  name: string
  currency: string
  avatarUrl?: string
}

interface Account {
  id: string
  userId: string
  name: string
  type: 'CASH' | 'DEBIT' | 'CREDIT' | 'SAVINGS' | 'INVESTMENT'
  balance: number
  currency: string
  creditLimit?: number
  billingDay?: number
  color?: string
}

interface Transaction {
  id: string
  userId: string
  accountId: string
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
  amount: number
  categoryId?: string
  description?: string
  date: string
  payee?: string
  payer?: string
  toAccountId?: string
  sharedExpenseId?: string
  loanId?: string
  tags?: Tag[]
}

interface Group {
  id: string
  name: string
  description?: string
  coverImageUrl?: string
  createdBy: string
  defaultSplitType: 'EQUAL' | 'PERCENTAGE' | 'EXACT' | 'SHARES'
  members: User[]
}

interface SharedExpense {
  id: string
  groupId: string
  paidByUserId: string
  amount: number
  description: string
  categoryId?: string
  date: string
  splitType: 'EQUAL' | 'PERCENTAGE' | 'EXACT' | 'SHARES'
  participants: ExpenseParticipant[]
}

interface Loan {
  id: string
  userId: string
  borrowerName: string
  borrowerUserId?: string
  originalAmount: number
  paidAmount: number
  currency: string
  loanDate: string
  status: 'ACTIVE' | 'PAID' | 'CANCELLED'
  payments: LoanPayment[]
}
```

---

## Notas Adicionales

### Autenticación
- JWT almacenado en localStorage
- Interceptor de Axios agrega token automáticamente
- Redirección a login en 401
- Protected routes con middleware

### Manejo de Errores
- Toast notifications para errores
- Mensajes de error claros
- Retry automático en React Query
- Fallback UI para errores críticos

### Accesibilidad
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus management

### Performance
- Server Components por defecto
- Client Components solo cuando necesario
- Lazy loading de componentes
- Image optimization
- Code splitting automático

### Testing
- Jest configurado
- Testing library setup
- Unit tests para utilidades
- Integration tests para flujos críticos
