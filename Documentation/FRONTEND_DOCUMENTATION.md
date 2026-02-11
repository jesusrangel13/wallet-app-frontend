# Documentation Frontend - Finance App

Este documento detalla la estructura, arquitectura, funcionalidades y estado técnico del frontend del proyecto **Finance App**. Se actualiza constantemente para reflejar la evolución del código.

---

## 1. Estructura del Proyecto

El frontend utiliza **Next.js 15 (App Router)**, **Tailwind CSS** para estilos y **React Query** para estado asíncrono.

### Estructura de Directorios

- `src/app`: Rutas de la aplicación (App Router) con soporte de internacionalización (`[locale]`).
- `src/components`: Biblioteca de componentes.
    - `ui/`: Componentes base (shadcn/ui + custom).
    - `widgets/`: Widgets del dashboard (28 widgets).
    - `dashboard/`, `transactions/`, `sidebar/`, `header/`, etc.: Componentes específicos por funcionalidad.
- `src/contexts`: Contextos de React (`SelectedMonthContext`, `DashboardContext`).
- `src/hooks`: Custom Hooks para lógica reutilizable y data fetching.
- `src/services`: **Capa de Servicios Modular**. Contiene la lógica de comunicación con el backend separada por dominio (api-client, auth, transactions, budgets, etc.).
- `src/store`: Estado global cliente con **Zustand** (`themeStore`, `sidebarStore`, `dashboardStore`, `authStore`).
- `src/lib`: Utilidades core y configuración (`api.ts` re-exporta servicios, `utils.ts`, `errorTranslator.ts`).
- `src/i18n`: Configuración de idiomas (`config.ts`, `request.ts`, `messages/`).
- `src/types`: Definiciones TypeScript compartidas.
- `src/config`: Configuraciones estáticas (registro de widgets).
- `src/styles`: Estilos globales y módulos CSS.

---

## 2. Arquitectura de Software

### Capa de Servicios (Modular Service Architecture)
Se ha migrado de una API monolítica a una arquitectura de servicios modulares en `src/services`.
- **`api-client.ts`**: Instancia base de Axios con interceptores para JWT y manejo de errores global.
- **Servicios por Dominio**: Cada entidad tiene su propio servicio (`transaction.service.ts`, `budget.service.ts`, `user.service.ts`, etc.) que extiende la funcionalidad base.
- **`lib/api.ts`**: Mantiene compatibilidad hacia atrás re-exportando los servicios, permitiendo imports limpios como `import { transactionAPI } from '@/lib/api'`.

### Manejo de Estado
- **Server State (React Query)**: Caching, revalidacion y sincronización de datos del backend. Configuración optimizada con `staleTime` global de 5 minutos.
- **Client State (Zustand)**:
    - `themeStore`: Manejo de tema (Claro/Oscuro/Sistema) con persistencia.
    - `sidebarStore`: Estado de colapso del menú lateral.
    - `dashboardStore`: Preferencias de widgets.
    - `notificationStore`: Estado de notificaciones no leídas.
- **Context API**:
    - `SelectedMonthContext`: Controla el filtro global de Mes/Año. Provee funciones para navegar entre meses y resetear a fecha actual. Optimizado con `useMemo` para evitar re-renders innecesarios.

### Internacionalización (i18n)
- **Motor**: `next-intl`
- **Idiomas Soportados**: Español (`es`, default), Inglés (`en`), Alemán (`de`), Francés (`fr`), Italiano (`it`), Portugués (`pt`).
- **Estado Actual**: Aunque el sistema soporta 6 idiomas, la UI (`LanguageSwitcher`) está configurada para mostrar solo **Español e Inglés** (Fase 6).
- **Rutas**: Prefijo de ruta dinámico (`/[locale]/...`).

---

## 3. Funcionalidades Clave

### Dashboard Personalizable
- **Grid System**: `react-grid-layout` permite arrastrar y redimensionar widgets.
- **Persistencia**: La disposición de los widgets se guarda en el backend (`dashboard-preference.service`).
- **Widgets**: 28 widgets disponibles divididos en "Summary", "Insights", "Action" y "Details".

### Transacciones & Presupuestos
- **Transacciones**: CRUD completo, filtros avanzados, soporte para gastos compartidos.
- **Presupuestos (Budgets)**:
    - **Nuevo Hook**: `useBudgets` maneja la obtención y creación con **Optimistic Updates** para una UI instantánea.
    - **Visualización**: Comparativa de Presupuesto vs Real (Budget vs Actual).
- **Voz**: Ingreso de transacciones por voz con `VoiceCorrectionModal` y detección inteligente de grupos.

### Temas (Theming)
- Soporte nativo para **Modo Oscuro** y **Modo Claro**.
- Detección automática de preferencia del sistema.
- Persistencia en `localStorage` vía `themeStore`.
- Toggle disponible en el menú de usuario.

### Grupos y Gastos Compartidos
- Lógica compleja de división de gastos (Equal, Percentage, Exact, Shares).
- **Settle Up**: Funcionalidad para liquidar deudas entre miembros.
- Integración profunda en el formulario de transacciones.

### Préstamos (Loans)
- Gestión de préstamos otorgados y recibidos.
- Registro de pagos parciales.
- Cálculo automático de estado (Activo, Pagado, Vencido).

---

## 4. Componentes Destacados

### Widgets (`src/components/widgets`)
Lista actualizada de widgets disponibles:
- **Balances**: `BalancesWidget`, `TotalBalanceWidget`, `HeroBalanceWidget`, `AccountBalancesWidget`, `FixedAccountBalancesWidget`, `GroupBalancesWidget`.
- **Gastos/Ingresos**: `MonthlyExpensesWidget`, `MonthlyIncomeWidget`, `NetMonthlyExpensesWidget`, `PersonalExpensesWidget`, `SharedExpensesWidget`.
- **Análisis**: `CashFlowWidget`, `BalanceTrendWidget`, `SmartInsightsWidget`, `ExpensesByCategoryWidget`, `CategoryBreakdownWidget`, `ExpensesByParentCategoryWidget`, `ExpenseDetailsPieWidget`.
- **Tags**: `TopTagsWidget`, `TagTrendWidget`, `ExpensesByTagWidget`.
- **Listas**: `RecentTransactionsWidget`, `LoansWidget`.
- **Otros**: `QuickActionsWidget`, `SavingsWidget`, `GroupsWidget`.
- **Lazy Loading**: `lazyWidgets.tsx` implementa carga diferida para widgets pesados (gráficos).

### Componentes de UI
- **Navegación**: `Sidebar`, `UserMenu` (nuevo, con acciones de usuario y tema), `LanguageSwitcher`.
- **Modales**: `TransactionFormModal`, `VoiceCorrectionModal`, `CreateLoanModal`, `SettleBalanceModal`.
- **Inputs**: `PayeeAutocomplete`, `CategorySelector`, `TagSelector`.
- **Feedback**: `NotificationBell` (tiempo real), `Toasts` (Sonner).

---

## 5. Hooks Personalizados (`src/hooks`)

- **Data Fetching**:
    - `useTransactions`: Filtros y paginación.
    - `useBudgets`: **(Nuevo)** Gestión de presupuestos con caché.
    - `useLoans`: Gestión de préstamos.
    - `useSharedExpenses`: Lógica de deudas y grupos.
    - `useAccounts`, `useCategories`, `useTags`.
- **UI/UX**:
    - `useThemeStore`: **(Nuevo)** Control del tema visual.
    - `useDashboard`: Lógica de widgets y layout.
    - `useVoiceRecognition`: Integración Web Speech API + AI processing.

---

## 6. Estado Técnico y Dependencias

- **Core**: Next.js 15.5.8, React 18.3.
- **Estado**: TanStack Query v5 (Server), Zustand v5 (Client).
- **Estilos**: TailwindCSS 3.4.
- **Charts**: Recharts 2.15.
- **Validación**: Zod + React Hook Form.
- **Utils**: Date-fns v4, Axios.

### Optimizaciones Recientes
1. **Modularización de API**: Separación de `api.ts` monolítico en servicios dedicados para mejor mantenibilidad y tree-shaking.
2. **Optimistic Updates**: Implementado en Budgets y Transacciones para feedback inmediato.
3. **Memoización de Contexto**: `SelectedMonthContext` usa `useMemo` agresivo para evitar renders innecesarios al cambiar de mes.
4. **Lazy Loading**: Widgets pesados se cargan solo cuando son necesarios.
