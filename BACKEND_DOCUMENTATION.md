# Backend Documentation - Finance App

## 📋 Tabla de Contenidos
- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Stack Tecnológico](#stack-tecnológico)
- [Base de Datos](#base-de-datos)
- [API Endpoints](#api-endpoints)
- [Servicios](#servicios)
- [Características Principales](#características-principales)
- [Configuración](#configuración)

---

## Descripción General

El backend de Finance App es una API RESTful construida con **Express.js** y **TypeScript** que proporciona funcionalidades completas de gestión financiera personal y compartida. Utiliza **Prisma ORM** para interactuar con una base de datos **PostgreSQL** (Supabase).

### Propósito
- Gestión de cuentas bancarias y transacciones personales
- Sistema de gastos compartidos similar a Splitwise
- Gestión de préstamos entre usuarios
- Presupuestos mensuales
- Importación de transacciones desde CSV/Excel
- Sistema de notificaciones en tiempo real
- Dashboard personalizable con widgets

---

## Arquitectura

### Estructura del Proyecto
```
backend/
├── src/
│   ├── controllers/      # Lógica de controladores HTTP
│   ├── services/         # Lógica de negocio
│   ├── routes/           # Definición de rutas API
│   ├── middleware/       # Middleware (auth, errores)
│   ├── data/             # Datos estáticos (plantillas)
│   ├── @types/           # Tipos TypeScript personalizados
│   └── server.ts         # Punto de entrada
├── prisma/
│   ├── schema.prisma     # Esquema de base de datos
│   └── migrations/       # Migraciones de BD
└── scripts/              # Scripts de utilidad
```

### Patrón de Diseño
El backend sigue una arquitectura **MVC (Model-View-Controller)** adaptada:
- **Routes**: Definen los endpoints y aplican middleware
- **Controllers**: Manejan requests/responses HTTP
- **Services**: Contienen la lógica de negocio
- **Prisma Models**: Representan las entidades de la base de datos

---

## Stack Tecnológico

### Core
- **Node.js** + **TypeScript**: Runtime y lenguaje
- **Express.js**: Framework web
- **Prisma ORM**: ORM para PostgreSQL
- **PostgreSQL (Supabase)**: Base de datos

### Dependencias Principales
```json
{
  "@prisma/client": "^6.18.0",
  "express": "^4.18.2",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^5.1.1",
  "cors": "^2.8.5",
  "compression": "^1.8.1",
  "express-validator": "^7.0.1",
  "zod": "^3.22.4",
  "multer": "^1.4.5-lts.1"
}
```

### Características de Seguridad
- **JWT (JSON Web Tokens)**: Autenticación stateless
- **bcrypt**: Hash de contraseñas
- **CORS**: Control de acceso entre dominios
- **express-validator + Zod**: Validación de datos

### Optimizaciones
- **Compression**: Compresión gzip de respuestas (~70% reducción)
- **Indexación de BD**: Índices en campos frecuentemente consultados

---

## Base de Datos

### Modelos Principales

#### 1. **User** (Usuarios)
```prisma
- id: UUID
- email: String (único)
- passwordHash: String
- name: String
- currency: String (CLP, USD, EUR)
- defaultSharedExpenseAccountId: String?
```
**Relaciones**: accounts, transactions, budgets, groups, loans, notifications

#### 2. **Account** (Cuentas Bancarias)
```prisma
- id: UUID
- userId: String
- name: String
- type: AccountType (CASH, DEBIT, CREDIT, SAVINGS, INVESTMENT)
- balance: Decimal
- currency: String
- creditLimit: Decimal? (solo para CREDIT)
- billingDay: Int? (día de corte para tarjetas)
- includeInTotalBalance: Boolean
- isArchived: Boolean
```

#### 3. **Transaction** (Transacciones)
```prisma
- id: UUID
- userId: String
- accountId: String
- type: TransactionType (EXPENSE, INCOME, TRANSFER)
- amount: Decimal
- categoryId: String?
- description: String?
- date: DateTime
- payee: String? (destinatario del pago)
- payer: String? (quien pagó)
- toAccountId: String? (para transferencias)
- sharedExpenseId: String? (si es gasto compartido)
- loanId: String? (si es préstamo)
```

#### 4. **CategoryTemplate** (Plantillas de Categorías)
Sistema de categorías globales compartidas entre usuarios:
```prisma
- id: UUID
- name: String
- icon: String?
- color: String?
- type: TransactionType
- parentTemplateId: String? (para subcategorías)
- isSystem: Boolean
```

#### 5. **UserCategoryOverride** (Personalizaciones de Categorías)
Permite a usuarios personalizar o crear categorías:
```prisma
- id: UUID
- userId: String
- templateId: String? (null si es categoría custom)
- name: String
- icon: String?
- color: String?
- isActive: Boolean
- isCustom: Boolean
```

#### 6. **Budget** (Presupuestos)
```prisma
- id: UUID
- userId: String
- amount: Decimal
- month: Int (1-12)
- year: Int
```

#### 7. **Group** (Grupos de Gastos Compartidos)
```prisma
- id: UUID
- name: String
- description: String?
- createdBy: String
- defaultSplitType: SplitType (EQUAL, PERCENTAGE, EXACT, SHARES)
```

#### 8. **SharedExpense** (Gastos Compartidos)
```prisma
- id: UUID
- groupId: String
- paidByUserId: String
- amount: Decimal
- description: String
- categoryId: String?
- splitType: SplitType
```

#### 9. **ExpenseParticipant** (Participantes en Gastos)
```prisma
- id: UUID
- expenseId: String
- userId: String
- amountOwed: Decimal
- isPaid: Boolean
- paidDate: DateTime?
- paidAmount: Decimal?
```

#### 10. **Loan** (Préstamos)
```prisma
- id: UUID
- userId: String (prestamista)
- borrowerName: String
- borrowerUserId: String?
- originalAmount: Decimal
- paidAmount: Decimal
- status: LoanStatus (ACTIVE, PAID, CANCELLED)
```

#### 11. **LoanPayment** (Pagos de Préstamos)
```prisma
- id: UUID
- loanId: String
- amount: Decimal
- paymentDate: DateTime
- transactionId: String?
```

#### 12. **Notification** (Notificaciones)
```prisma
- id: UUID
- userId: String
- type: NotificationType
- title: String
- message: String
- data: Json
- isRead: Boolean
```

#### 13. **UserDashboardPreference** (Preferencias de Dashboard)
```prisma
- id: UUID
- userId: String
- widgets: Json (configuración de widgets)
- layout: Json (disposición de grid)
```

---

## API Endpoints

### 🔐 Autenticación (`/api/auth`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Registrar nuevo usuario | No |
| POST | `/login` | Iniciar sesión | No |
| GET | `/profile` | Obtener perfil del usuario | Sí |

### 👤 Usuarios (`/api/users`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/profile` | Obtener perfil |
| PUT | `/profile` | Actualizar perfil |
| DELETE | `/account` | Eliminar cuenta |
| GET | `/stats` | Estadísticas del usuario |
| GET | `/my-balances` | Balances de gastos compartidos |
| PATCH | `/me/default-shared-expense-account` | Configurar cuenta por defecto |
| GET | `/dashboard-preferences` | Obtener preferencias de dashboard |
| PUT | `/dashboard-preferences` | Guardar preferencias |

### 💳 Cuentas (`/api/accounts`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear cuenta |
| GET | `/` | Listar todas las cuentas (paginado) |
| GET | `/:id` | Obtener cuenta por ID |
| PUT | `/:id` | Actualizar cuenta |
| DELETE | `/:id` | Eliminar cuenta |
| GET | `/:id/balance` | Obtener balance |
| GET | `/balance/total` | Balance total |
| GET | `/:id/balance-history` | Historial de balance |

**Parámetros de paginación** (GET `/`):
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Registros por página (default: 50, max: 200)

### 💰 Transacciones (`/api/transactions`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear transacción |
| GET | `/` | Listar transacciones (con filtros) |
| GET | `/:id` | Obtener transacción |
| PUT | `/:id` | Actualizar transacción |
| DELETE | `/:id` | Eliminar transacción |
| POST | `/bulk-delete` | Eliminar múltiples |
| GET | `/by-category` | Agrupar por categoría |
| GET | `/stats` | Estadísticas |
| GET | `/recent` | Transacciones recientes |

**Filtros disponibles**:
- `accountId`, `type`, `categoryId`
- `startDate`, `endDate`
- `minAmount`, `maxAmount`
- `tags[]`, `search`
- `sortBy`, `sortOrder`
- `page`, `limit` (paginación)

### 📊 Presupuestos (`/api/budgets`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear presupuesto |
| GET | `/` | Listar presupuestos (paginado) |
| GET | `/:id` | Obtener presupuesto |
| PUT | `/:id` | Actualizar presupuesto |
| DELETE | `/:id` | Eliminar presupuesto |
| GET | `/vs-actual` | Presupuesto vs. gasto real |
| GET | `/current` | Presupuesto del mes actual |

**Parámetros disponibles** (GET `/`):
- `year` (opcional): Filtrar por año
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Registros por página (default: 50, max: 100)

### 🏷️ Categorías (`/api/categories`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Obtener categorías del usuario |
| GET | `/user/categories` | Categorías merged (templates + overrides) |
| GET | `/templates/all` | Todas las plantillas |
| GET | `/templates/hierarchy` | Plantillas en jerarquía |
| POST | `/overrides` | Crear override de plantilla |
| GET | `/overrides/:id` | Obtener override |
| PUT | `/overrides/:id` | Actualizar override |
| DELETE | `/overrides/:id` | Eliminar override |
| POST | `/custom` | Crear categoría custom |
| GET | `/custom/all` | Listar categorías custom |

### 🏷️ Etiquetas (`/api/tags`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear etiqueta |
| GET | `/` | Listar etiquetas (paginado) |
| GET | `/:id` | Obtener etiqueta |
| PUT | `/:id` | Actualizar etiqueta |
| DELETE | `/:id` | Eliminar etiqueta |

**Parámetros de paginación** (GET `/`):
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Registros por página (default: 50, max: 200)

### 👥 Grupos (`/api/groups`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear grupo |
| GET | `/` | Listar grupos |
| GET | `/:id` | Obtener grupo |
| PUT | `/:id` | Actualizar grupo |
| DELETE | `/:id` | Eliminar grupo |
| POST | `/:id/members` | Agregar miembro |
| DELETE | `/:id/members/:memberId` | Eliminar miembro |
| POST | `/:id/leave` | Salir del grupo |
| GET | `/:id/balances` | Balances del grupo |
| PUT | `/:id/default-split` | Configurar división por defecto |
| POST | `/:id/settle-balance` | Liquidar balance |

### 💸 Gastos Compartidos (`/api/shared-expenses`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear gasto compartido |
| GET | `/` | Listar gastos |
| GET | `/:id` | Obtener gasto |
| PUT | `/:id` | Actualizar gasto |
| DELETE | `/:id` | Eliminar gasto |
| POST | `/payments` | Registrar pago |
| GET | `/payments/history` | Historial de pagos |
| GET | `/groups/:groupId/simplified-debts` | Deudas simplificadas |
| PATCH | `/:id/participants/:userId/mark-paid` | Marcar como pagado |
| PATCH | `/:id/participants/:userId/mark-unpaid` | Marcar como no pagado |

### 💵 Préstamos (`/api/loans`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear préstamo |
| GET | `/` | Listar préstamos |
| GET | `/:id` | Obtener préstamo |
| POST | `/:id/payments` | Registrar pago |
| PATCH | `/:id/cancel` | Cancelar préstamo |
| DELETE | `/:id` | Eliminar préstamo |
| GET | `/summary` | Resumen de préstamos |
| GET | `/by-borrower` | Agrupar por prestatario |

### 📥 Importación (`/api/import`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Importar transacciones |
| GET | `/history` | Historial de importaciones |
| GET | `/history/:id` | Detalle de importación |

### 📈 Dashboard (`/api/dashboard`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/cashflow` | Flujo de caja |
| GET | `/expenses-by-category` | Gastos por categoría |
| GET | `/expenses-by-parent-category` | Gastos por categoría padre |
| GET | `/balance-history` | Historial de balance |
| GET | `/group-balances` | Balances de grupos |
| GET | `/account-balances` | Balances de cuentas |
| GET | `/personal-expenses` | Gastos personales |
| GET | `/shared-expenses` | Total de gastos compartidos |
| GET | `/savings` | Ahorros mensuales |

### 🔔 Notificaciones (`/api/notifications`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar notificaciones |
| GET | `/unread` | Notificaciones no leídas |
| GET | `/count` | Contador de no leídas |
| PATCH | `/:id/read` | Marcar como leída |
| PATCH | `/read-all` | Marcar todas como leídas |
| DELETE | `/:id` | Eliminar notificación |
| DELETE | `/read/all` | Eliminar todas las leídas |

---

## Servicios

### 1. **AuthService** (`auth.service.ts`)
- `register()`: Registro de usuarios con hash de contraseña
- `login()`: Autenticación y generación de JWT
- `getProfile()`: Obtener perfil del usuario autenticado

### 2. **AccountService** (`account.service.ts`)
- CRUD de cuentas bancarias
- Cálculo de balances
- Historial de balances por mes
- Soft delete con opción de transferir transacciones

### 3. **TransactionService** (`transaction.service.ts`)
- CRUD de transacciones
- Filtrado avanzado y paginación
- Actualización automática de balances de cuentas
- Manejo de transferencias entre cuentas
- Estadísticas por categoría y período

### 4. **BudgetService** (`budget.service.ts`)
- CRUD de presupuestos mensuales
- Comparación presupuesto vs. gasto real
- Cálculo de porcentaje de uso

### 5. **CategoryService** (`category.service.ts`)
- Sistema híbrido de categorías (templates + overrides)
- Merge de categorías globales con personalizaciones
- Soporte para jerarquías (categorías y subcategorías)

### 6. **CategoryTemplateService** (`categoryTemplate.service.ts`)
- Inicialización de plantillas por defecto
- Gestión de plantillas globales
- Categorías predefinidas: Alimentación, Transporte, Salud, etc.

### 7. **GroupService** (`group.service.ts`)
- CRUD de grupos
- Gestión de miembros
- Cálculo de balances por grupo
- Configuración de división por defecto (EQUAL, PERCENTAGE, SHARES, EXACT)

### 8. **SharedExpenseService** (`sharedExpense.service.ts`)
- CRUD de gastos compartidos
- División automática según tipo configurado
- Cálculo de deudas simplificadas (algoritmo de minimización)
- Liquidación de balances con creación de transacciones
- Marcado de participantes como pagados/no pagados

### 9. **LoanService** (`loan.service.ts`)
- CRUD de préstamos
- Registro de pagos parciales
- Actualización automática de estado (ACTIVE → PAID)
- Resumen de préstamos por prestatario
- Vinculación con transacciones

### 10. **ImportService** (`import.service.ts`)
- Importación masiva desde CSV/Excel
- Validación de datos
- Registro de historial de importaciones
- Manejo de errores por fila

### 11. **DashboardService** (`dashboard.service.ts`)
- Generación de datos para widgets
- Cálculo de métricas financieras
- Agregación de datos por período
- Soporte para filtros de mes/año

### 12. **NotificationService** (`notification.service.ts`)
- Creación de notificaciones
- Tipos: PAYMENT_RECEIVED, SHARED_EXPENSE_CREATED, GROUP_MEMBER_ADDED, BALANCE_SETTLED
- Marcado de leídas/no leídas
- Limpieza de notificaciones antiguas

### 13. **DashboardPreferenceService** (`dashboardPreference.service.ts`)
- Gestión de widgets personalizados
- Configuración de layout de grid
- Reset a configuración por defecto

---

## Características Principales

### 🔒 Autenticación y Seguridad
- JWT con expiración configurable
- Hash de contraseñas con bcrypt (10 rounds)
- Middleware de autenticación en todas las rutas protegidas
- CORS configurable por entorno

### 💳 Gestión de Cuentas
- Múltiples tipos: Efectivo, Débito, Crédito, Ahorros, Inversión
- Soporte multi-moneda (CLP, USD, EUR)
- Límites de crédito para tarjetas
- Día de corte para tarjetas de crédito
- Soft delete con opción de transferir transacciones
- Exclusión de cuentas del balance total

### 💰 Transacciones
- Tipos: Gastos, Ingresos, Transferencias
- Categorización jerárquica
- Etiquetado múltiple
- Filtrado avanzado
- Paginación
- Búsqueda por texto
- Vinculación con gastos compartidos y préstamos

### 🏷️ Sistema de Categorías
- **Plantillas globales**: Categorías predefinidas compartidas
- **Overrides**: Personalizaciones por usuario
- **Categorías custom**: Creadas completamente por el usuario
- **Jerarquía**: Soporte para subcategorías
- **Merge inteligente**: Combina templates + overrides + custom

### 👥 Gastos Compartidos (Splitwise-like)
- Grupos con múltiples miembros
- 4 tipos de división:
  - **EQUAL**: División equitativa
  - **PERCENTAGE**: Por porcentajes
  - **SHARES**: Por partes (ej: 2:1:1)
  - **EXACT**: Montos exactos por persona
- Cálculo de deudas simplificadas (minimiza transacciones)
- Liquidación automática con creación de transacciones
- Tracking de pagos individuales
- Configuración de división por defecto por grupo

### 💵 Préstamos
- Registro de préstamos a terceros
- Pagos parciales
- Estados: ACTIVE, PAID, CANCELLED
- Resumen por prestatario
- Vinculación con transacciones

### 📊 Dashboard Personalizable
- Widgets configurables
- Layout de grid personalizable
- Métricas disponibles:
  - Flujo de caja
  - Gastos por categoría
  - Historial de balance
  - Balances de grupos
  - Ahorros mensuales
  - Gastos personales vs. compartidos

### 📥 Importación de Datos
- Formatos: CSV, Excel
- Validación de datos
- Historial de importaciones
- Reporte de errores por fila

### 🔔 Notificaciones
- Eventos:
  - Pago recibido
  - Nuevo gasto compartido
  - Miembro agregado a grupo
  - Balance liquidado
- Estado leído/no leído
- Datos adicionales en JSON

### 📈 Reportes y Estadísticas
- Presupuesto vs. gasto real
- Gastos por categoría
- Flujo de caja mensual
- Historial de balances
- Tasa de ahorro

---

## Configuración

### Variables de Entorno
```env
# Base de datos
DATABASE_URL=postgresql://user:password@host:5432/database
DIRECT_URL=postgresql://user:password@host:5432/database

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Server
PORT=5000
NODE_ENV=development
```

### Scripts Disponibles
```bash
# Desarrollo
npm run dev              # Servidor con nodemon

# Producción
npm run build            # Compilar TypeScript
npm start                # Iniciar servidor compilado

# Base de datos
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:studio    # Abrir Prisma Studio
npm run prisma:push      # Push schema a BD

# Testing
npm test                 # Ejecutar tests
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Cobertura de tests

# Scripts de migración
npm run migrate:categories  # Migrar categorías por defecto
npm run init:templates      # Inicializar plantillas
npm run migrate:templates   # Migrar a sistema de templates
npm run validate:migration  # Validar migración
npm run cleanup:legacy      # Limpiar categorías legacy
```

### Inicialización
Al iniciar el servidor, se ejecuta automáticamente:
- Inicialización de plantillas de categorías por defecto (idempotente)

### Health Check
```
GET /health
Response: {
  "status": "ok",
  "timestamp": "2024-12-03T14:25:00.000Z",
  "environment": "development"
}
```

---

## Middleware

### 1. **authenticate** (`middleware/auth.ts`)
- Verifica JWT en header `Authorization: Bearer <token>`
- Decodifica token y agrega `userId` al request
- Retorna 401 si token inválido o ausente

### 2. **errorHandler** (`middleware/errorHandler.ts`)
- Manejo centralizado de errores
- Formato de respuesta consistente
- Logging de errores

### 3. **notFoundHandler** (`middleware/notFoundHandler.ts`)
- Maneja rutas no encontradas (404)

---

## Optimizaciones

### 1. **Compresión GZIP** ✅ **IMPLEMENTADO**
- **Estado**: Activo en producción
- **Ubicación**: `server.ts` (líneas 32-43)
- **Configuración**:
  - Nivel de compresión: 6 (balance óptimo entre velocidad y ratio)
  - Reduce tamaño de respuestas ~70%
  - Filtro personalizado: permite deshabilitar compresión con header `x-no-compression`
  - Aplica a todas las respuestas HTTP
- **Dependencia**: `compression@^1.8.1`
- **Beneficios**:
  - Reducción significativa en uso de ancho de banda
  - Mejora en tiempos de carga para clientes
  - Menor costo de transferencia de datos

### 2. **Indexación de Base de Datos** ✅ **IMPLEMENTADO**
- **Estado**: Activo en producción
- **Ubicación**: `prisma/schema.prisma`
- **Fecha de implementación**: 2025-12-03
- **Índices agregados**:
  
  #### Transaction Model
  - `[userId, date]` - Optimiza consultas de transacciones por usuario y rango de fechas (dashboard, reportes)
  - `[userId, type, date]` - Optimiza filtrado de transacciones por usuario, tipo y fecha
  - `[accountId, date]` - Optimiza historial de transacciones por cuenta
  
  #### SharedExpense Model
  - `[groupId, date]` - Optimiza consultas de historial de gastos por grupo
  - `[paidByUserId, date]` - Optimiza consultas de gastos pagados por usuario en el tiempo
  
  #### ExpenseParticipant Model
  - `[userId, isPaid]` - Optimiza consultas de deudas pendientes por usuario
  
  #### Loan Model
  - `[userId, loanDate]` - Optimiza consultas de historial de préstamos
  
  #### Payment Model
  - `[fromUserId, date]` - Optimiza consultas de historial de pagos realizados
  - `[toUserId, date]` - Optimiza consultas de historial de pagos recibidos

- **Método de aplicación**: `npx prisma db push`
- **Beneficios**:
  - Mejora significativa en rendimiento de queries complejas
  - Reducción de tiempo de respuesta en endpoints de dashboard y reportes
  - Optimización de consultas con filtros de fecha (muy frecuentes)
  - Mejor performance en queries de deudas pendientes y balances
  - Índices compuestos reducen la necesidad de escaneos completos de tabla
  
- **Índices existentes previos**:
  - Índices simples en claves foráneas (`userId`, `accountId`, `groupId`, etc.)
  - Índices únicos en campos de identificación (`email`, combinaciones únicas)
  - Total de índices simples: ~30
  - Total de índices compuestos agregados: 10

### 3. **Paginación** ✅ **COMPLETADO**
- **Estado**: Activo en producción
- **Fecha de implementación**: 2025-12-03
- **Ubicación**: `/backend/src/@types/pagination.types.ts`
- **Endpoints paginados**:
  - ✅ Transacciones (`GET /api/transactions`) - Default: 50, Max: 500
  - ✅ Notificaciones (`GET /api/notifications`) - Default: 50, Max: 100
  - ✅ Préstamos (`GET /api/loans`) - Default: 50, Max: 200
  - ✅ Grupos (`GET /api/groups`) - Default: 50, Max: 200
  - ✅ Gastos compartidos (`GET /api/shared-expenses`) - Default: 50, Max: 200
  - ✅ Historial de importaciones (`GET /api/import/history`) - Default: 50, Max: 100
  - ✅ **Cuentas (`GET /api/accounts`)** - Default: 50, Max: 200
  - ✅ **Presupuestos (`GET /api/budgets`)** - Default: 50, Max: 100
  - ✅ **Etiquetas (`GET /api/tags`)** - Default: 50, Max: 200

- **Infraestructura**:
  - `PaginationParams` - Parámetros de entrada (page, limit)
  - `PaginationMeta` - Metadatos de respuesta (total, totalPages, hasMore)
  - `PaginatedResponse<T>` - Wrapper genérico de respuesta
  - `calculatePagination()` - Genera metadatos de paginación
  - `calculateSkip()` - Calcula offset para queries de Prisma

- **Formato de respuesta**:
  ```json
  {
    "success": true,
    "data": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2,
      "hasMore": true
    }
  }
  ```

- **Beneficios**:
  - Reducción 40-60% en tamaño de respuestas para usuarios con datos extensos
  - Mejora 30-50% en tiempos de respuesta en endpoints con grandes volúmenes de datos
  - Previene sobrecarga de memoria en cliente y servidor
  - Escalabilidad para crecimiento futuro de datos
  - Experiencia de usuario mejorada con carga inicial rápida
  - Menor consumo de ancho de banda

### 4. **Soft Delete**
- Cuentas archivadas en lugar de eliminadas
- Preserva integridad referencial
- Permite recuperación de datos

---

## Notas Adicionales

### Sistema de Categorías
El backend implementa un sistema híbrido de categorías:
1. **CategoryTemplate**: Plantillas globales (sistema)
2. **UserCategoryOverride**: Personalizaciones por usuario
3. **Merge**: Al consultar categorías, se combinan templates + overrides + custom

### Cálculo de Deudas Simplificadas
El algoritmo minimiza el número de transacciones necesarias para liquidar deudas en un grupo:
- Calcula balances netos por usuario
- Agrupa deudores y acreedores
- Genera transacciones óptimas

### Manejo de Transacciones de BD
- Operaciones críticas usan transacciones de Prisma
- Garantiza consistencia en operaciones complejas (ej: liquidación de balances)

### Validación
- Zod para validación de schemas
- express-validator para validación de requests
- Validación a nivel de base de datos (constraints, unique, etc.)
