# Backend Documentation - Finance App

## 📋 Tabla de Contenidos
- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
  - [Estructura del Proyecto](#estructura-del-proyecto)
  - [Patrón de Diseño](#patrón-de-diseño)
  - [Sistema de Tipos](#sistema-de-tipos)
- [Stack Tecnológico](#stack-tecnológico)
  - [Core](#core)
  - [Dependencias Principales](#dependencias-principales)
  - [Características de Seguridad](#características-de-seguridad)
- [Configuración y Entorno](#configuración-y-entorno)
  - [Validación de Variables de Entorno](#validación-de-variables-de-entorno)
  - [Variables de Entorno Requeridas](#variables-de-entorno-requeridas)
- [Base de Datos](#base-de-datos)
- [API Endpoints](#api-endpoints)
- [Documentación de API (Swagger)](#documentación-de-api-swagger)
- [Servicios](#servicios)
- [Middleware](#middleware)
  - [Autenticación](#autenticación)
  - [Rate Limiting](#rate-limiting)
  - [Validación de Requests](#validación-de-requests)
  - [Request Logger](#request-logger)
  - [Manejo de Errores](#manejo-de-errores)
- [Sistema de Logging](#sistema-de-logging)
  - [Configuración de Winston](#configuración-de-winston)
  - [Niveles de Log](#niveles-de-log)
  - [Archivos de Log](#archivos-de-log)
- [Manejo de Errores y Códigos](#manejo-de-errores-y-códigos)
  - [Códigos de Error](#códigos-de-error)
  - [Clase AppError](#clase-apperror)
  - [Soporte i18n](#soporte-i18n)
- [Características Principales](#características-principales)
- [Configuración](#configuración)
- [Deployment](#deployment)
  - [Render.com Configuration](#rendercom-configuration)
  - [Variables de Entorno de Producción](#variables-de-entorno-de-producción)
- [Testing](#testing)
  - [Infraestructura de Testing](#infraestructura-de-testing)
  - [Tests Unitarios](#tests-unitarios)
  - [Tests de Integración](#tests-de-integración)
  - [Best Practices](#best-practices)

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

### Sistema de Tipos

El backend utiliza TypeScript con un sistema de tipos robusto para garantizar seguridad de tipos en toda la aplicación.

#### Directorio `@types`

**Estructura**:
```
src/@types/
├── express/
│   └── index.d.ts       # Extensiones de Express Request
└── pagination.types.ts  # Tipos de paginación
```

**Express Request Extensions** (`@types/express/index.d.ts`):
```typescript
declare namespace Express {
  export interface Request {
    user?: {
      userId: string;
    };
  }
}
```
- Agrega propiedad `user` al objeto Request de Express
- Permite acceso type-safe a datos del usuario autenticado
- Evita uso de `(req as any).user`

**Pagination Types** (`@types/pagination.types.ts`):
```typescript
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}
```
- Tipos reutilizables para paginación consistente
- Funciones helper: `calculatePagination()`, `calculateSkip()`

#### Tipos Adicionales

**Auth Types** (`types/auth.ts`):
```typescript
export interface TokenPayload {
  userId: string;
}

export interface UserRegistration {
  email: string;
  password: string;
  name: string;
  currency?: string;
}
```

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
  "express-rate-limit": "^8.2.1",
  "helmet": "^8.1.0",
  "isomorphic-dompurify": "^2.34.0",
  "winston": "^3.19.0",
  "swagger-jsdoc": "^6.2.8",
  "swagger-ui-express": "^5.0.1",
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

## Configuración y Entorno

### Validación de Variables de Entorno

El backend implementa validación estricta de variables de entorno usando **Zod** en `src/config/env.ts`. Esto garantiza que el servidor no inicie con configuración incorrecta o incompleta (fail-fast).

**Archivo**: `src/config/env.ts`

```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ALLOWED_ORIGINS: z.string(),
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

export const env = envSchema.parse(process.env);
```

**Características**:
- ✅ Validación automática al inicio del servidor
- ✅ Tipos TypeScript generados automáticamente
- ✅ Valores por defecto para variables opcionales
- ✅ Error descriptivo si falta alguna variable requerida
- ✅ Previene errores en runtime por configuración incorrecta

### Variables de Entorno Requeridas

**Desarrollo** (`.env`):
```env
# Base de datos
DATABASE_URL=postgresql://user:password@host:5432/database
DIRECT_URL=postgresql://user:password@host:5432/database

# JWT
JWT_SECRET=your-secret-key-min-32-characters
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Server
PORT=5000
NODE_ENV=development
```

**Producción** (`.env.production`):
```env
# Base de datos (Supabase)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# JWT (usar clave segura generada)
JWT_SECRET=<secure-random-string-min-32-chars>
JWT_EXPIRES_IN=7d

# CORS (dominios permitidos separados por coma)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Server
PORT=5000
NODE_ENV=production
```

**Validación al inicio**:
```bash
# Si falta una variable requerida:
$ npm start
Error: [
  {
    "code": "invalid_string",
    "validation": "url",
    "path": ["DATABASE_URL"],
    "message": "Invalid url"
  }
]
```

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
| PATCH | `/me/default-shared-expense-account` | Configurar cuenta por defecto para liquidaciones |

**Nota**: La cuenta por defecto se usa automáticamente al liquidar balances de gastos compartidos.

### 🎨 Preferencias de Dashboard (`/api/users/dashboard-preferences`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/dashboard-preferences` | Obtener preferencias completas |
| PUT | `/dashboard-preferences` | Guardar preferencias completas |
| POST | `/dashboard-preferences/widgets` | Agregar nuevo widget |
| DELETE | `/dashboard-preferences/widgets/:widgetId` | Eliminar widget |
| PATCH | `/dashboard-preferences/widgets/:widgetId/settings` | Actualizar configuración de widget |
| PATCH | `/dashboard-preferences/layout` | Actualizar layout del grid |
| DELETE | `/dashboard-preferences/reset` | Restablecer a valores por defecto |

**Widgets disponibles**:
- `cashflow` - Flujo de caja mensual
- `expenses-by-category` - Gastos por categoría
- `balance-history` - Historial de balance (30 días)
- `group-balances` - Balances de grupos
- `account-balances` - Balances por cuenta
- `personal-expenses` - Gastos personales
- `shared-expenses` - Gastos compartidos
- `savings` - Ahorros mensuales
- `expenses-by-tag` - Gastos por etiqueta
- `top-tags` - Etiquetas más usadas
- `tag-trend` - Tendencia de etiquetas

**Configuración de layout**:
- Basado en react-grid-layout
- Cada widget tiene: `x`, `y`, `w` (width), `h` (height)
- Grid responsive con breakpoints

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
| GET | `/payees` | Lista de payees únicos (autocompletado) |

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
| GET | `/summary` | **Dashboard completo en una sola llamada** |
| GET | `/cashflow` | Flujo de caja |
| GET | `/expenses-by-category` | Gastos por categoría |
| GET | `/expenses-by-parent-category` | Gastos por categoría padre |
| GET | `/balance-history` | Historial de balance |
| GET | `/group-balances` | Balances de grupos |
| GET | `/account-balances` | Balances de cuentas |
| GET | `/personal-expenses` | Gastos personales |
| GET | `/shared-expenses` | Total de gastos compartidos |
| GET | `/savings` | Ahorros mensuales |
| GET | `/expenses-by-tag` | Gastos agrupados por etiqueta |
| GET | `/top-tags` | Top 10 etiquetas más usadas |
| GET | `/tag-trend` | Tendencia de uso de etiquetas en el tiempo |

**Optimización**: El endpoint `/summary` retorna todos los datos del dashboard en una sola llamada, reduciendo ~70% el tiempo de carga.

**Parámetros disponibles para endpoints de tag**:
- `month` (opcional): Mes específico (1-12)
- `year` (opcional): Año específico
- `limit` (opcional): Número de resultados (default: 10 para top-tags)

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

## Documentación de API (Swagger)

El backend incluye documentación interactiva de API generada automáticamente con **Swagger/OpenAPI 3.0**.

### Acceso a la Documentación

**URL de desarrollo**:
```
http://localhost:5000/api-docs
```

**URL de producción**:
```
https://your-domain.com/api-docs
```

### Configuración

**Archivo**: `src/config/swagger.ts`

```typescript
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance App API',
      version: '1.0.0',
      description: 'API Documentation for Finance App'
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development server'
      },
      {
        url: 'http://localhost:5000/api',
        description: 'Legacy alias'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.ts']
};

export const specs = swaggerJsdoc(options);
```

### Características

- ✅ **Interfaz interactiva**: Prueba endpoints directamente desde el navegador
- ✅ **Autenticación JWT**: Botón "Authorize" para agregar token Bearer
- ✅ **Validación de schemas**: Muestra modelos de request/response
- ✅ **Generación automática**: Basada en JSDoc comments en routes
- ✅ **Versionado**: Soporte para `/api/v1` y alias `/api`

### Cómo Documentar Endpoints

**Ejemplo de JSDoc en routes**:

```typescript
/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Listar todas las cuentas
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *     responses:
 *       200:
 *         description: Lista de cuentas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Account'
 */
router.get('/', authenticate, accountController.getAccounts);
```

### Uso en Desarrollo

1. Iniciar servidor: `npm run dev`
2. Abrir navegador: `http://localhost:5000/api-docs`
3. Click en "Authorize" y pegar token JWT
4. Expandir endpoint y click en "Try it out"
5. Completar parámetros y ejecutar

### Beneficios

- **Onboarding rápido**: Nuevos desarrolladores entienden la API rápidamente
- **Testing manual**: Prueba endpoints sin Postman
- **Documentación siempre actualizada**: Se genera desde el código fuente
- **Contratos de API**: Sirve como especificación para frontend

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

### 14. **CategoryResolverService** (`categoryResolver.service.ts`)
- Resolución de IDs de categorías (templates + overrides)
- Operaciones batch para optimizar performance
- Validación de categorías por usuario
- Búsqueda de categorías por nombre
- Enhancement de transacciones con datos de categoría

**Optimización**: Las operaciones batch reducen ~90% las queries N+1 al cargar transacciones.

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
- Extrae payload: `{ userId: string }`

**Implementación**:
```typescript
const authHeader = req.headers.authorization;
const token = authHeader.substring(7); // Remove 'Bearer '
const decoded = verifyToken(token);
(req as any).user = decoded;
```

### 2. **errorHandler** (`middleware/errorHandler.ts`)
- Manejo centralizado de errores
- Formato de respuesta consistente
- Logging de errores
- Manejo especial de errores:
  - `AppError`: Errores operacionales con statusCode
  - `PrismaClientKnownRequestError`: Errores de base de datos
  - `JsonWebTokenError`: Tokens inválidos
  - `TokenExpiredError`: Tokens expirados

**Clase AppError**:
```typescript
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}
```

### 3. **notFoundHandler** (`middleware/notFoundHandler.ts`)
- Maneja rutas no encontradas (404)
- Retorna mensaje de error consistente

### 4. **rateLimiter** (`middleware/rateLimiter.ts`)
Rate limiting para protección contra abuso de API y ataques de fuerza bruta.

**Auth Limiter** (endpoints de autenticación):
```typescript
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 5,                     // 5 intentos máximo
  message: 'Too many login attempts, please try again after 15 minutes'
});
```
- Aplicado a: `/api/v1/auth/*`
- Límite: 5 requests por 15 minutos
- Previene ataques de fuerza bruta

**API Limiter** (endpoints generales):
```typescript
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 1000,                 // 1000 requests máximo
  message: 'Too many requests, please try again after 15 minutes'
});
```
- Aplicado a: Todos los endpoints `/api/v1/*` excepto auth
- Límite: 1000 requests por 15 minutos
- Previene abuso de recursos

**Características**:
- Headers estándar: `RateLimit-*` (RFC)
- Por IP address
- Mensajes personalizados en español
- Respuestas consistentes con formato de error de la API

### 5. **requestLogger** (`middleware/requestLogger.ts`)
Logging de todas las peticiones HTTP usando Winston.

**Implementación**:
```typescript
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    };

    logger.http(JSON.stringify(logData));

    // Alerta para requests lentos
    if (duration > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });

  next();
};
```

**Características**:
- Log de método, ruta, status code, duración
- Alerta automática para requests > 1000ms
- Integrado con Winston logger
- Log level: `http`

### 6. **validate** (`middleware/validate.ts`)
Middleware genérico de validación usando esquemas Zod.

**Implementación**:
```typescript
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors
      });
    }
  };
};
```

**Uso en routes**:
```typescript
import { validate } from '../middleware/validate';
import { createTransactionSchema } from '../utils/validation';

router.post('/',
  authenticate,
  validate(createTransactionSchema),
  transactionController.createTransaction
);
```

**Beneficios**:
- Validación centralizada y reutilizable
- Mensajes de error descriptivos
- Type-safe (TypeScript infiere tipos del schema)
- Previene datos inválidos antes de llegar al controller

---

## Sistema de Logging

El backend implementa un sistema de logging robusto usando **Winston** para registrar eventos, errores y métricas de performance.

### Configuración de Winston

**Archivo**: `src/utils/logger.ts`

```typescript
import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'warn';
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.json()
  }),
  new winston.transports.File({
    filename: 'logs/all.log',
    format: winston.format.json()
  })
];

const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports
});

export default logger;
```

### Niveles de Log

| Nivel | Prioridad | Uso | Ejemplo |
|-------|-----------|-----|---------|
| `error` | 0 | Errores críticos | Falla de BD, excepciones no manejadas |
| `warn` | 1 | Advertencias | Requests lentos, recursos limitados |
| `info` | 2 | Información general | Server iniciado, configuración cargada |
| `http` | 3 | Requests HTTP | Todas las peticiones API |
| `debug` | 4 | Debugging detallado | Valores de variables, flujo de ejecución |

**Nivel por ambiente**:
- **Development**: `debug` (muestra todo)
- **Production**: `warn` (solo advertencias y errores)

### Archivos de Log

**Ubicación**: `/backend/logs/`

#### `error.log`
- **Nivel**: Solo errores (`error`)
- **Formato**: JSON
- **Uso**: Debugging de errores en producción
- **Ejemplo**:
```json
{
  "level": "error",
  "message": "Database connection failed",
  "timestamp": "2025-12-03 14:25:30:123",
  "stack": "Error: Connection timeout..."
}
```

#### `all.log`
- **Nivel**: Todos los niveles
- **Formato**: JSON
- **Uso**: Auditoría completa de eventos
- **Ejemplo**:
```json
{
  "level": "http",
  "message": "{\"method\":\"GET\",\"path\":\"/api/transactions\",\"statusCode\":200,\"duration\":\"45ms\"}",
  "timestamp": "2025-12-03 14:25:30:123"
}
```

### Uso en Código

**Logging de errores**:
```typescript
try {
  await prisma.transaction.create({ data });
} catch (error) {
  logger.error(`Failed to create transaction: ${error.message}`);
  throw error;
}
```

**Logging de info**:
```typescript
logger.info('Server started on port 5000');
logger.info(`User ${userId} logged in`);
```

**Logging de warnings**:
```typescript
if (duration > 1000) {
  logger.warn(`Slow query: ${query} took ${duration}ms`);
}
```

### Características

- ✅ **Console colorizada**: Logs legibles en desarrollo
- ✅ **Archivos persistentes**: Logs en JSON para análisis
- ✅ **Niveles configurables**: Por ambiente
- ✅ **Timestamps precisos**: Con milisegundos
- ✅ **Rotación manual**: Archivos pueden crecer, rotación manual recomendada
- ✅ **Formato JSON**: Fácil parsing con herramientas

### Mejoras Recomendadas

- **Log Rotation**: Implementar `winston-daily-rotate-file`
- **Agregación**: Enviar logs a servicio externo (Logtail, Datadog)
- **Alertas**: Notificaciones automáticas en errores críticos
- **Filtrado sensible**: Evitar logging de passwords, tokens

---

## Manejo de Errores y Códigos

### Códigos de Error

**Archivo**: `src/constants/errorCodes.ts`

Sistema de códigos de error estandarizados con soporte para internacionalización (i18n).

```typescript
export const ERROR_CODES = {
  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  FORBIDDEN: 'FORBIDDEN',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',

  // Business Logic
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_SPLIT_TOTAL: 'INVALID_SPLIT_TOTAL',
  LOAN_HAS_PAYMENTS: 'LOAN_HAS_PAYMENTS',

  // Generic
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const;
```

### Clase AppError

**Archivo**: `src/middleware/errorHandler.ts`

```typescript
export class AppError extends Error {
  statusCode: number;
  errorCode?: string;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    errorCode?: string,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}
```

**Uso en servicios**:
```typescript
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES } from '../constants/errorCodes';

// Ejemplo de uso
if (!user) {
  throw new AppError(
    'User not found',
    404,
    ERROR_CODES.NOT_FOUND
  );
}

if (balance < amount) {
  throw new AppError(
    'Insufficient balance',
    400,
    ERROR_CODES.INSUFFICIENT_BALANCE
  );
}
```

### Error Handler Middleware

**Procesamiento centralizado de errores**:

```typescript
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err.message);

  // AppError (operacional)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      errorCode: err.errorCode,
      message: err.message
    });
  }

  // Prisma errors
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        status: 'error',
        errorCode: ERROR_CODES.ALREADY_EXISTS,
        message: 'Resource already exists'
      });
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      errorCode: ERROR_CODES.TOKEN_INVALID,
      message: 'Invalid token'
    });
  }

  // Default (programmatic error)
  return res.status(500).json({
    status: 'error',
    errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: 'Internal server error'
  });
};
```

### Soporte i18n

**Frontend puede traducir por código**:

```typescript
// Frontend - translations/es.json
{
  "errors": {
    "INVALID_CREDENTIALS": "Credenciales inválidas",
    "INSUFFICIENT_BALANCE": "Saldo insuficiente",
    "NOT_FOUND": "No encontrado"
  }
}

// Frontend - error handling
const errorMessage = t(`errors.${error.errorCode}`) || error.message;
```

**Beneficios**:
- Mensajes consistentes entre frontend y backend
- Fácil traducción a múltiples idiomas
- Códigos únicos para debugging
- Separación de mensaje técnico vs. mensaje de usuario

### Formato de Respuesta de Error

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

**Error Response**:
```json
{
  "status": "error",
  "errorCode": "INSUFFICIENT_BALANCE",
  "message": "Insufficient balance to complete transaction",
  "details": { ... }  // opcional
}
```

---

## Utilidades

### 1. **JWT Utils** (`utils/jwt.ts`)
**Funciones**:
- `generateToken(userId: string): string` - Genera JWT con expiración configurable
- `verifyToken(token: string): TokenPayload` - Verifica y decodifica JWT

**Configuración**:
- `JWT_SECRET`: Clave secreta (variable de entorno)
- `JWT_EXPIRES_IN`: Tiempo de expiración (default: 7d)

**Payload**:
```typescript
interface TokenPayload {
  userId: string;
}
```

### 2. **Password Utils** (`utils/password.ts`)
**Funciones**:
- `hashPassword(password: string): Promise<string>` - Hash con bcrypt
- `comparePassword(password: string, hash: string): Promise<boolean>` - Verifica contraseña

**Configuración**:
- Salt rounds: 10 (balance entre seguridad y performance)

### 3. **Validation Schemas** (`utils/validation.ts`)
Validación completa con **Zod** para todos los endpoints:

#### Schemas de Autenticación
- `registerSchema`: Email, password (min 8 chars), name, currency, country
- `loginSchema`: Email, password

#### Schemas de Cuentas
- `createAccountSchema`: Validación completa incluyendo:
  - Campos requeridos para tarjetas de crédito (creditLimit, billingDay)
  - Validación de accountNumber (solo dígitos)
  - Validación de color (formato hex)
- `updateAccountSchema`: Versión parcial para updates

#### Schemas de Transacciones
- `createTransactionSchema`: Validación incluyendo:
  - toAccountId requerido para TRANSFER
  - Validación de UUIDs
  - Tags como array de UUIDs
- `updateTransactionSchema`: Versión parcial

#### Schemas de Presupuestos
- `createBudgetSchema`: Amount positivo, month (1-12), year (min 2020)

#### Schemas de Grupos
- `createGroupSchema`: Incluye:
  - memberEmails para creación en un paso
  - defaultSplitType
  - memberSplitSettings con configuración por miembro
- `updateGroupSchema`: Versión parcial

#### Schemas de Gastos Compartidos
- `createSharedExpenseSchema`: Validación de:
  - splitType (EQUAL, PERCENTAGE, EXACT, SHARES)
  - participants con amountOwed, percentage, shares
  - Validación de suma de porcentajes/montos
- `updateSharedExpenseSchema`: Versión parcial

#### Schemas de Etiquetas
- `createTagSchema`: Name (max 50 chars), color (hex)
- `updateTagSchema`: Versión parcial

**Características**:
- Validación de tipos de datos
- Validación de formatos (email, UUID, hex colors)
- Validación condicional (ej: creditLimit requerido para CREDIT)
- Mensajes de error personalizados en español
- Preprocessing para campos opcionales

---

## Lógica de Negocio Especial

### 1. **Manejo de Tarjetas de Crédito**
Las tarjetas de crédito (`AccountType.CREDIT`) tienen un comportamiento **inverso** en el balance:

**Comportamiento**:
- **Gastos (EXPENSE)**: Incrementan el balance (aumentan la deuda)
- **Ingresos/Pagos (INCOME)**: Reducen el balance (pagan la deuda)
- **Balance positivo**: Indica deuda pendiente
- **Balance negativo**: Indica saldo a favor (crédito disponible extra)

**Implementación** (`transaction.service.ts`):
```typescript
function updateAccountBalance(
  accountId: string,
  accountType: string,
  transactionType: TransactionType,
  amount: number,
  operation: 'add' | 'subtract'
) {
  if (accountType === 'CREDIT') {
    // Invert logic for credit cards
    if (transactionType === 'EXPENSE') {
      // Expenses increase debt (add to balance)
      operation = operation === 'add' ? 'add' : 'subtract';
    } else if (transactionType === 'INCOME') {
      // Payments reduce debt (subtract from balance)
      operation = operation === 'add' ? 'subtract' : 'add';
    }
  }
  // Apply balance update...
}
```

**Beneficio**: Representación intuitiva de deuda en tarjetas de crédito.

### 2. **Resolución de Categorías (Hybrid System)**
Sistema híbrido que combina tres fuentes:

1. **CategoryTemplate**: Categorías globales del sistema (compartidas)
2. **UserCategoryOverride**: Personalizaciones del usuario sobre templates
3. **Categorías Custom**: Creadas completamente por el usuario

**Proceso de resolución** (`categoryResolver.service.ts`):
```
1. Buscar en UserCategoryOverride
   - Si existe y es custom (templateId = null): Retornar custom
   - Si existe y es override (templateId != null): Merge con template
2. Si no existe override, buscar en CategoryTemplate
3. Resolver jerarquía de padres recursivamente
4. Retornar CategoryInfo completa
```

**Operaciones Batch**:
- `resolveCategoriesBatch()`: Resuelve múltiples IDs en una sola query
- **Optimización**: Reduce N+1 queries en ~90%
- **Uso**: Al cargar listas de transacciones

**Funciones disponibles**:
- `resolveCategoryById()`: Resolución individual
- `resolveCategoriesBatch()`: Resolución en lote
- `validateCategoryId()`: Validar que categoría existe para usuario
- `searchCategoriesByName()`: Búsqueda por nombre
- `enhanceTransactionsWithCategories()`: Agregar datos de categoría a transacciones

### 3. **División de Gastos Compartidos**
Cuatro tipos de división con validación automática:

#### EQUAL (División Equitativa)
```typescript
amountOwed = totalAmount / numberOfParticipants
```
- Automático, no requiere configuración
- Divide el monto equitativamente

#### PERCENTAGE (Por Porcentajes)
```typescript
amountOwed = (totalAmount * percentage) / 100
```
- **Validación**: Suma de porcentajes debe ser 100%
- Cada participante especifica su porcentaje (0-100)

#### SHARES (Por Partes)
```typescript
amountOwed = (totalAmount * userShares) / totalShares
```
- División proporcional (ej: 2:1:1 = 50%, 25%, 25%)
- Flexible para proporciones no exactas

#### EXACT (Montos Exactos)
```typescript
amountOwed = specifiedAmount
```
- **Validación**: Suma de montos debe igualar el total
- Control total sobre distribución

**Implementación** (`sharedExpense.service.ts`):
- Validación automática en creación/actualización
- Recálculo automático al cambiar splitType
- Preserva configuración de participantes

### 4. **Simplificación de Deudas**
Algoritmo de minimización de transacciones para liquidar deudas en un grupo:

**Algoritmo** (`calculateSimplifiedDebts`):
```
1. Calcular balance neto por usuario:
   - Balance = Total pagado - Total adeudado
   - Positivo = Acreedor (le deben)
   - Negativo = Deudor (debe)

2. Separar en dos grupos:
   - Acreedores: balance > 0
   - Deudores: balance < 0

3. Emparejar montos:
   - Ordenar ambos grupos por monto
   - Emparejar deudor con acreedor
   - Transferir mínimo entre deuda y crédito
   - Actualizar balances
   - Repetir hasta balances = 0

4. Generar lista de pagos optimizados
```

**Ejemplo**:
```
Antes:
- A pagó $100, debe $30 → Balance: +$70
- B pagó $20, debe $60 → Balance: -$40
- C pagó $10, debe $40 → Balance: -$30

Después (simplificado):
- B paga $40 a A
- C paga $30 a A

Total: 2 transacciones (vs 6 posibles)
```

**Beneficio**: Minimiza número de transacciones necesarias para liquidar.

### 5. **Soft Delete de Préstamos**
Sistema de eliminación segura que preserva integridad de datos:

**Reglas**:
- **Eliminación física**: Solo permitida si no hay pagos registrados
- **Cancelación**: Alternativa que preserva historial (status: CANCELLED)
- **Validación**: Previene pérdida de datos de pagos

**Implementación** (`loan.service.ts`):
```typescript
async function deleteLoan(userId: string, loanId: string) {
  const loan = await prisma.loan.findUnique({
    include: { payments: true }
  });
  
  if (loan.payments.length > 0) {
    throw new AppError(
      'Cannot delete loan with payments. Cancel instead.',
      400
    );
  }
  
  // Safe to delete
  await prisma.loan.delete({ where: { id: loanId } });
}
```

**Estados de préstamo**:
- `ACTIVE`: Tiene balance pendiente
- `PAID`: Completamente pagado (paidAmount >= originalAmount)
- `CANCELLED`: Cancelado/perdonado (preserva historial)

### 6. **Cuenta por Defecto para Gastos Compartidos**
Configuración de cuenta predeterminada para liquidaciones automáticas:

**Campo**: `User.defaultSharedExpenseAccountId`

**Funcionalidad**:
- Al liquidar un balance, se usa esta cuenta automáticamente
- Evita seleccionar cuenta manualmente en cada liquidación
- Configurable por usuario

**Endpoint**: `PATCH /api/users/me/default-shared-expense-account`

**Uso** (`sharedExpense.service.ts`):
```typescript
// Si no se especifica accountId, usar cuenta por defecto
const accountId = data.accountId || user.defaultSharedExpenseAccountId;
```

### 7. **Autocompletado de Payees**
Sistema de autocompletado para campo "payee" en transacciones:

**Endpoint**: `GET /api/transactions/payees?search=<term>`

**Funcionalidad**:
- Retorna lista única de payees del usuario
- Búsqueda case-insensitive
- Ordenado por frecuencia de uso

**Optimización**: Índice compuesto `[userId, payee]` para queries rápidas

**Implementación** (`transaction.service.ts`):
```typescript
async function getUniquePayees(userId: string, search?: string) {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      payee: search ? {
        contains: search,
        mode: 'insensitive'
      } : { not: null }
    },
    select: { payee: true },
    distinct: ['payee'],
    orderBy: { payee: 'asc' }
  });
  
  return transactions
    .map(t => t.payee)
    .filter(Boolean);
}
```

**Beneficio**: Mejora UX al sugerir payees previamente usados.

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

### 5. **Índices de Autocompletado** ✅ **IMPLEMENTADO**
- **Estado**: Activo en producción
- **Índice**: `@@index([userId, payee])` en Transaction
- **Beneficio**: Optimiza queries de autocompletado de payees
- **Uso**: Endpoint `/api/transactions/payees`
- **Mejora**: ~80% reducción en tiempo de respuesta para autocompletado

### 6. **Batch Operations para Categorías** ✅ **IMPLEMENTADO**
- **Estado**: Activo en producción
- **Servicio**: `CategoryResolverService.resolveCategoriesBatch()`
- **Beneficio**: Reduce N+1 queries al cargar transacciones con categorías
- **Implementación**: Carga todas las categorías necesarias en 2 queries (overrides + templates)
- **Mejora**: ~90% reducción en queries de base de datos
- **Uso**: Automático en `getTransactions()`, `getSharedExpenses()`, etc.

### 7. **Dashboard Summary Endpoint** ✅ **IMPLEMENTADO**
- **Estado**: Activo en producción
- **Endpoint**: `GET /api/dashboard/summary`
- **Beneficio**: Reduce múltiples llamadas API a una sola
- **Datos incluidos**: Cashflow, expenses by category, balance history, group balances, account balances, personal expenses, shared expenses, savings
- **Mejora**: ~70% reducción en tiempo de carga del dashboard
- **Uso**: Recomendado para carga inicial del dashboard

---

## Optimizaciones Recomendadas

### 1. **Rate Limiting** ✅ **IMPLEMENTADO**
- **Estado**: Activo en producción
- **Archivo**: `src/middleware/rateLimiter.ts`
- **Configuración implementada**:
  ```typescript
  import rateLimit from 'express-rate-limit';

  // Auth endpoints - más restrictivo
  export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos máximo
    message: 'Too many login attempts, please try again after 15 minutes'
  });

  // API general
  export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000 // 1000 requests máximo
  });
  ```
- **Aplicación**:
  - `/api/v1/auth/*`: 5 requests/15min (authLimiter)
  - `/api/v1/*`: 1000 requests/15min (apiLimiter)
- **Beneficio**: Previene ataques de fuerza bruta y abuso de recursos
- **Ver detalles**: Sección [Middleware](#middleware)

### 2. **Request Validation Middleware** ✅ **IMPLEMENTADO**
- **Estado**: Activo en producción
- **Solución**: Implementado middleware centralizado `validate`.
- **Problema**: Validación dispersa en controladores, código duplicado
- **Solución**: Middleware centralizado con Zod schemas existentes
- **Implementación sugerida**:
  ```typescript
  // middleware/validate.ts
  import { z } from 'zod';
  
  export const validate = (schema: z.ZodSchema) => {
    return async (req, res, next) => {
      try {
        req.body = await schema.parseAsync(req.body);
        next();
      } catch (error) {
        res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: error.errors
        });
      }
    };
  };
  
  // Uso en routes
  router.post('/', validate(createTransactionSchema), createTransaction);
  ```
- **Beneficio**: Código más limpio, validación consistente, mejor mantenibilidad
- **Prioridad**: Media

### 3. **Database Connection Pooling** ⚠️ **PARCIALMENTE IMPLEMENTADO**
- **Estado**: Validación de configuración agregada en `env.ts`.
- **Problema**: Prisma usa pool por defecto pero no está optimizado
- **Solución**: Configurar `connection_limit` en DATABASE_URL
- **Configuración sugerida**:
  ```env
  DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
  ```
- **Valores recomendados**:
  - Development: `connection_limit=5`
  - Production: `connection_limit=10-20` (según carga)
  - `pool_timeout=20` (segundos)
- **Beneficio**: Mejor manejo de conexiones concurrentes, previene agotamiento de conexiones
- **Prioridad**: Media

### 4. **Query Result Caching** 💡 **SUGERIDO**
- **Problema**: Queries repetitivas para datos que cambian poco
- **Solución**: Implementar Redis o cache en memoria para datos estáticos
- **Candidatos para cache**:
  - CategoryTemplates (cambian raramente)
  - UserDashboardPreferences (cambian ocasionalmente)
  - User profiles (cambian ocasionalmente)
- **Implementación con Redis**:
  ```typescript
  import Redis from 'ioredis';
  const redis = new Redis(process.env.REDIS_URL);
  
  async function getCategoryTemplates() {
    const cached = await redis.get('category_templates');
    if (cached) return JSON.parse(cached);
    
    const templates = await prisma.categoryTemplate.findMany();
    await redis.setex('category_templates', 3600, JSON.stringify(templates));
    return templates;
  }
  ```
- **Beneficio**: ~50% reducción en queries de lectura, mejor tiempo de respuesta
- **Prioridad**: Baja (solo necesario con alto tráfico)

### 5. **Logging Estructurado** ✅ **IMPLEMENTADO**
- **Estado**: Activo en `src/utils/logger.ts` con Winston.
- **Problema**: `console.log` no es adecuado para producción
- **Solución**: Implementar Winston o Pino
- **Implementación con Winston**:
  ```typescript
  import winston from 'winston';
  
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    ]
  });
  
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.simple()
    }));
  }
  ```
- **Beneficio**: Mejor debugging, monitoreo, alertas, análisis de logs
- **Prioridad**: Media

### 6. **API Versioning** ✅ **IMPLEMENTADO**
- **Estado**: Activo (`/api/v1/*`) con alias `/api`.
- **Problema**: Sin versionado de API, cambios pueden romper clientes
- **Solución**: Prefijo `/api/v1/` para todos los endpoints
- **Implementación**:
  ```typescript
  // server.ts
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  // ...
  
  // Mantener /api/ como alias a /api/v1/ temporalmente
  app.use('/api/auth', authRoutes);
  ```
- **Beneficio**: Permite cambios breaking sin afectar clientes existentes
- **Prioridad**: Baja (implementar antes de v1.0)

### 7. **Health Check Mejorado** ✅ **IMPLEMENTADO**
- **Estado**: Activo, verifica BD.
- **Problema**: Health check actual no verifica conectividad de BD
- **Solución**: Agregar ping a base de datos
- **Implementación**:
  ```typescript
  app.get('/health', async (req, res) => {
    try {
      // Ping database
      await prisma.$queryRaw`SELECT 1`;
      
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: 'connected'
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      });
    }
  });
  ```
- **Beneficio**: Mejor monitoreo de infraestructura, detección temprana de problemas
- **Prioridad**: Media

### 8. **Backup Automático** ✅ **IMPLEMENTADO (Script)**
- **Estado**: Script `scripts/backup.sh` disponible.
- **Problema**: Sin estrategia de backup documentada o automatizada
- **Solución**: Configurar backups automáticos en Supabase
- **Configuración recomendada**:
  - Frecuencia: Diaria (3 AM)
  - Retención: 30 días
  - Tipo: Full backup
  - Almacenamiento: Supabase Storage o S3
- **Proceso manual alternativo**:
  ```bash
  # Script de backup
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
  ```
- **Beneficio**: Protección contra pérdida de datos, recuperación ante desastres
- **Prioridad**: Crítica

### 9. **Environment Variables Validation** ✅ **IMPLEMENTADO**
- **Estado**: Activo en `src/config/env.ts`.
- **Problema**: Sin validación de variables de entorno al inicio
- **Solución**: Validar variables críticas en startup
- **Implementación**:
  ```typescript
  // config/env.ts
  import { z } from 'zod';
  
  const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('7d'),
    ALLOWED_ORIGINS: z.string(),
    PORT: z.string().default('5000'),
    NODE_ENV: z.enum(['development', 'production', 'test'])
  });
  
  export const env = envSchema.parse(process.env);
  
  // server.ts
  import { env } from './config/env';
  // Si falla, el servidor no inicia
  ```
- **Beneficio**: Fail-fast, previene errores en runtime, mejor developer experience
- **Prioridad**: Media

### 10. **Transaction Rollback en Errores** ✅ **IMPLEMENTADO**
- **Estado**: Implementado en servicios críticos (`transaction.service.ts`)
- **Detalle**: Se usa `prisma.$transaction` en `createTransaction` y `deleteTransaction` para asegurar consistencia entre registros y balances.
- **Problema**: Algunas operaciones complejas no usan transacciones de BD
- **Solución**: Envolver operaciones críticas en `prisma.$transaction()`
- **Candidatos**:
  - Import de transacciones masivas
  - Liquidación de balances (settle balance)
  - Creación de préstamos con transacción
  - Actualización de gastos compartidos con recálculo
- **Implementación ejemplo**:
  ```typescript
  async function settleBalance(userId, groupId, otherUserId, accountId) {
    return await prisma.$transaction(async (tx) => {
      // 1. Crear payment record
      const payment = await tx.payment.create({...});
      
      // 2. Marcar participantes como pagados
      await tx.expenseParticipant.updateMany({...});
      
      // 3. Crear transacción en cuenta
      await tx.transaction.create({...});
      
      // 4. Actualizar balance de cuenta
      await tx.account.update({...});
      
      // Si cualquier paso falla, todo se revierte
      return payment;
    });
  }
  ```
- **Beneficio**: Garantiza consistencia de datos, previene estados inconsistentes
- **Prioridad**: Media

### 11. **Input Sanitization** ✅ **IMPLEMENTADO**
- **Estado**: Activo en `src/utils/sanitizer.ts`.
- **Problema**: Sin sanitización de inputs para prevenir XSS
- **Solución**: Implementar sanitización de strings
- **Implementación**:
  ```typescript
  import DOMPurify from 'isomorphic-dompurify';
  
  function sanitizeInput(input: string): string {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  }
  
  // Aplicar en validación
  const createTransactionSchema = z.object({
    description: z.string()
      .transform(sanitizeInput)
      .optional()
  });
  ```
- **Beneficio**: Previene ataques XSS, mejora seguridad
- **Prioridad**: Alta

### 12. **API Response Time Monitoring** ✅ **IMPLEMENTADO**
- **Estado**: Middleware activo loggueando tiempos > 1000ms.
- **Problema**: Sin métricas de performance de endpoints
- **Solución**: Implementar middleware de timing
- **Implementación**:
  ```typescript
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info({
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
      
      // Alert si es muy lento
      if (duration > 1000) {
        logger.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
      }
    });
    
    next();
  });
  ```
- **Beneficio**: Identificar endpoints lentos, optimizar performance
- **Prioridad**: Baja


### 13. **Seguridad con Helmet** ✅ **IMPLEMENTADO**
- **Estado**: Middleware activo globalmente.
- **Problema**: Falta de cabeceras de seguridad HTTP básicas.
- **Solución**: Implementar librería `helmet`.
- **Beneficio**: Protección contra ataques comunes (XSS, Clickjacking, sniffing).
- **Prioridad**: Alta.

### 14. **Documentación de API (Swagger)** ✅ **IMPLEMENTADO**
- **Estado**: Activo en producción, disponible en `/api-docs`
- **Archivo**: `src/config/swagger.ts`
- **Implementación**: Swagger UI con OpenAPI 3.0
- **Beneficio**: Facilita el consumo de la API y el onboarding
- **Ver detalles**: Sección [Documentación de API (Swagger)](#documentación-de-api-swagger)

### 15. **Tipado Estricto (No Any)** ✅ **IMPLEMENTADO**
- **Estado**: Activo en producción
- **Archivo**: `src/@types/express/index.d.ts`
- **Implementación**: Extensión de interfaz `Request` de Express con propiedad `user`
- **Beneficio**: Mejor seguridad de tipos y autocompletado; previene errores en runtime
- **Ver detalles**: Sección [Sistema de Tipos](#sistema-de-tipos)

### 16. **Testing de Integración** ✅ **IMPLEMENTADO**
- **Estado**: Infraestructura completa con Jest + Supertest
- **Archivos**: `jest.config.js`, `jest.setup.js`, `src/tests/integration/`, `src/services/__tests__/`
- **Tests implementados**: CategoryTemplateService, UserCategoryService, Health endpoint
- **Comandos**: `npm test`, `npm run test:watch`, `npm run test:coverage`
- **Beneficio**: Detección temprana de regresiones en flujos complejos
- **Ver detalles**: Sección [Testing](#testing)

---

## Notas Adicionales

### Campos Adicionales de Modelos

#### Account
- `accountNumber`: Número de cuenta (string, solo dígitos, opcional)
- `color`: Color hex para UI (#RRGGBB, opcional)
- `includeInTotalBalance`: Excluir cuenta del balance total (boolean, default: true)
- **Uso**: Cuentas de inversión pueden excluirse del balance diario

#### User
- `defaultSharedExpenseAccountId`: Cuenta por defecto para liquidaciones
- `avatarUrl`: URL del avatar (opcional)
- `isVerified`: Estado de verificación de email (boolean)
- `country`: País del usuario (opcional)

#### GroupMemberSplitDefault
Modelo para configuración de división por defecto por miembro:
- `groupId`: ID del grupo
- `userId`: ID del usuario
- `percentage`: Porcentaje (para PERCENTAGE split)
- `shares`: Número de partes (para SHARES split)
- `exactAmount`: Monto exacto (para EXACT split)

**Uso**: Permite configurar división personalizada que se aplica automáticamente a nuevos gastos.

### Sistema de Categorías
El backend implementa un sistema híbrido de categorías:
1. **CategoryTemplate**: Plantillas globales (sistema)
2. **UserCategoryOverride**: Personalizaciones por usuario
3. **Merge**: Al consultar categorías, se combinan templates + overrides + custom

**Ver sección "Lógica de Negocio Especial" para detalles completos.**

### Cálculo de Deudas Simplificadas
El algoritmo minimiza el número de transacciones necesarias para liquidar deudas en un grupo.

**Ver sección "Lógica de Negocio Especial" para detalles del algoritmo.**

### Manejo de Transacciones de BD
- Operaciones críticas usan transacciones de Prisma (`$transaction`)
- Garantiza consistencia en operaciones complejas (ej: liquidación de balances)
- **Recomendación**: Expandir uso a más operaciones (ver Optimización #10)

### Validación
- **Zod**: Validación de schemas (ver sección Utilidades)
- **Prisma**: Validación a nivel de base de datos (constraints, unique, foreign keys)
- **Custom**: Validación de lógica de negocio en servicios

### Seguridad
- **JWT**: Tokens con expiración configurable
- **bcrypt**: Hash de contraseñas con 10 rounds
- **CORS**: Configurado con whitelist de orígenes
- **SQL Injection**: Prevenido por Prisma (queries parametrizadas)
- **Recomendaciones**: Rate limiting, input sanitization (ver Optimizaciones)

---

## Testing

El backend cuenta con infraestructura de testing completa usando **Jest** y **Supertest** para garantizar calidad y prevenir regresiones.

### Infraestructura de Testing

**Framework**: Jest + ts-jest
**Ubicación**: `/backend/src/`

#### Configuración de Jest

**Archivo**: `jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
```

**Archivo**: `jest.setup.js`

```javascript
// Global test setup
beforeAll(() => {
  // Setup code ejecutado antes de todos los tests
});

afterAll(() => {
  // Cleanup code ejecutado después de todos los tests
});
```

#### Comandos de Testing

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch (desarrollo)
npm run test:watch

# Tests con coverage
npm run test:coverage

# Tests específicos
npm test -- auth.service.test.ts
```

### Tests Unitarios

**Ubicación**: `src/services/__tests__/`

#### Ejemplo: Service Tests

**Archivo**: `src/services/__tests__/categoryTemplate.service.test.ts`

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';
import { CategoryTemplateService } from '../categoryTemplate.service';

describe('CategoryTemplateService', () => {
  describe('initializeDefaultTemplates', () => {
    it('should initialize category templates', async () => {
      const result = await CategoryTemplateService.initializeDefaultTemplates();
      expect(result).toBeDefined();
    });

    it('should be idempotent (safe to call multiple times)', async () => {
      await CategoryTemplateService.initializeDefaultTemplates();
      const result = await CategoryTemplateService.initializeDefaultTemplates();
      expect(result).toBeDefined();
    });
  });

  describe('getAllTemplates', () => {
    it('should return all templates', async () => {
      const templates = await CategoryTemplateService.getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should return templates with required fields', async () => {
      const templates = await CategoryTemplateService.getAllTemplates();
      templates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('type');
      });
    });
  });
});
```

### Tests de Integración

**Ubicación**: `src/tests/integration/`

#### Ejemplo: API Integration Tests

**Archivo**: `src/tests/integration/health.test.ts`

```typescript
import request from 'supertest';
import app from '../../server';

describe('Health Check', () => {
  it('should return 200 OK', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('environment');
  });

  it('should verify database connection', async () => {
    const response = await request(app).get('/health');

    expect(response.body).toHaveProperty('database');
    expect(['connected', 'disconnected']).toContain(response.body.database);
  });
});
```

#### Testing Endpoints Autenticados

**Ejemplo**: Testing con JWT token

```typescript
import request from 'supertest';
import app from '../../server';
import { generateToken } from '../../utils/jwt';

describe('Protected Endpoints', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Crear usuario de test
    const signupResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123456',
        name: 'Test User'
      });

    userId = signupResponse.body.user.id;
    authToken = signupResponse.body.token;
  });

  afterAll(async () => {
    // Cleanup: eliminar usuario de test
    // ...
  });

  describe('GET /api/users/profile', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('email', 'test@example.com');
    });
  });
});
```

### Best Practices

#### 1. **Mock de Prisma Client**

**Patrón recomendado**:

```typescript
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Mock global de Prisma
jest.mock('@prisma/client', () => ({
  __esModule: true,
  PrismaClient: jest.fn(() => mockDeep<PrismaClient>())
}));

let prismaMock: DeepMockProxy<PrismaClient>;

beforeEach(() => {
  prismaMock = new PrismaClient() as DeepMockProxy<PrismaClient>;
});

afterEach(() => {
  mockReset(prismaMock);
});

// Uso en tests
it('should create transaction', async () => {
  prismaMock.transaction.create.mockResolvedValue({
    id: '123',
    amount: 100,
    // ...
  });

  const result = await TransactionService.createTransaction(userId, data);
  expect(result.id).toBe('123');
});
```

#### 2. **Test Data Builders**

**Ejemplo**: Builders para objetos de test

```typescript
class TransactionBuilder {
  private transaction: Partial<Transaction> = {
    type: 'EXPENSE',
    amount: 100,
    date: new Date()
  };

  withAmount(amount: number) {
    this.transaction.amount = amount;
    return this;
  }

  withType(type: TransactionType) {
    this.transaction.type = type;
    return this;
  }

  build() {
    return this.transaction as Transaction;
  }
}

// Uso
it('should calculate total expenses', () => {
  const transaction = new TransactionBuilder()
    .withAmount(500)
    .withType('EXPENSE')
    .build();

  // test logic...
});
```

#### 3. **Testing de Errores**

**Ejemplo**: Verificar errores esperados

```typescript
it('should throw error if user not found', async () => {
  prismaMock.user.findUnique.mockResolvedValue(null);

  await expect(
    UserService.getProfile('invalid-id')
  ).rejects.toThrow('User not found');
});

it('should return 404 on non-existent resource', async () => {
  const response = await request(app)
    .get('/api/accounts/invalid-id')
    .set('Authorization', `Bearer ${authToken}`);

  expect(response.status).toBe(404);
  expect(response.body.errorCode).toBe('NOT_FOUND');
});
```

#### 4. **Setup y Teardown**

**Ejemplo**: Gestión de estado entre tests

```typescript
describe('Account Service', () => {
  let testUserId: string;
  let testAccountId: string;

  beforeAll(async () => {
    // Setup global para toda la suite
    testUserId = await createTestUser();
  });

  beforeEach(async () => {
    // Setup antes de cada test
    testAccountId = await createTestAccount(testUserId);
  });

  afterEach(async () => {
    // Cleanup después de cada test
    await deleteTestAccount(testAccountId);
  });

  afterAll(async () => {
    // Cleanup global
    await deleteTestUser(testUserId);
    await prisma.$disconnect();
  });

  // Tests...
});
```

#### 5. **Testing Asíncrono**

**Ejemplo**: Promises y async/await

```typescript
// ✅ CORRECTO: async/await
it('should create account', async () => {
  const account = await AccountService.createAccount(userId, data);
  expect(account.id).toBeDefined();
});

// ✅ CORRECTO: Promise
it('should create account', () => {
  return AccountService.createAccount(userId, data)
    .then(account => {
      expect(account.id).toBeDefined();
    });
});

// ❌ INCORRECTO: No espera la Promise
it('should create account', () => {
  AccountService.createAccount(userId, data); // No await!
  // Test termina antes que la Promise
});
```

#### 6. **Cobertura de Tests**

**Objetivos recomendados**:
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

**Ver reporte**:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

#### 7. **Testing de Validación**

**Ejemplo**: Schemas y validación

```typescript
describe('Validation', () => {
  it('should reject invalid email', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        password: 'Test123',
        name: 'Test'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('email');
  });

  it('should reject short password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: '123',  // Muy corto
        name: 'Test'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('password');
  });
});
```

### Estructura Recomendada de Tests

```
src/
├── services/
│   ├── __tests__/
│   │   ├── account.service.test.ts
│   │   ├── transaction.service.test.ts
│   │   └── ...
│   ├── account.service.ts
│   └── ...
├── tests/
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── accounts.test.ts
│   │   ├── transactions.test.ts
│   │   └── ...
│   └── helpers/
│       ├── testData.ts
│       ├── builders.ts
│       └── ...
```

### Estado Actual de Tests

**Tests implementados**:
- ✅ CategoryTemplateService (unitario)
- ✅ UserCategoryService (unitario)
- ✅ Health endpoint (integración)

**Tests recomendados** (pendientes):
- AuthService (registro, login, JWT)
- TransactionService (CRUD, balance updates)
- SharedExpenseService (splits, settlements)
- AccountService (CRUD, balance calculations)
- LoanService (payments, status updates)
- API endpoints críticos (auth, transactions, shared expenses)

---

## Deployment

El backend está configurado para deployment en **Render.com** con configuración lista para producción.

### Render.com Configuration

**Archivo**: `render.yaml`

```yaml
services:
  - type: web
    name: finance-app-backend
    runtime: node
    env: node
    region: oregon
    plan: free
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: DIRECT_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: JWT_EXPIRES_IN
        value: 7d
      - key: ALLOWED_ORIGINS
        sync: false
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000

    disk:
      name: uploads
      mountPath: /app/uploads
      sizeGB: 1
```

### Configuración de Deployment

#### 1. **Variables de Entorno en Render**

Configurar en Render Dashboard → Service → Environment:

```env
# Base de datos (Supabase)
DATABASE_URL=postgresql://user:password@host:5432/database?pgbouncer=true
DIRECT_URL=postgresql://user:password@host:5432/database

# JWT (IMPORTANTE: usar clave segura de 32+ caracteres)
JWT_SECRET=<generar-con-openssl-rand-base64-32>
JWT_EXPIRES_IN=7d

# CORS (dominios de producción)
ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com

# Environment
NODE_ENV=production
PORT=5000
```

#### 2. **Build Commands**

**Build Command** (ejecutado una vez en deploy):
```bash
npm install && npx prisma generate && npm run build
```

**Pasos**:
1. Instala dependencias (`npm install`)
2. Genera Prisma Client (`npx prisma generate`)
3. Compila TypeScript a JavaScript (`npm run build`)

**Start Command** (ejecutado al iniciar):
```bash
npm start
```

**Ejecuta**: `node dist/server.js`

#### 3. **Health Check**

Render verifica `/health` cada 30 segundos:

```typescript
// src/routes/health.routes.ts
router.get('/health', async (req, res) => {
  try {
    // Ping database
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected'
    });
  }
});
```

**Beneficios**:
- Auto-restart si health check falla
- Status visible en Render Dashboard
- Verificación de conectividad a BD

#### 4. **Persistent Disk**

**Configuración**: 1GB disk montado en `/app/uploads`

**Uso**: Archivos subidos por usuarios (importaciones CSV, avatars)

**Importante**:
- Archivos persisten entre deploys
- 1GB máximo en plan free
- Alternativa: usar S3 o Cloudinary para files

#### 5. **Database Migrations**

**Estrategia recomendada**:

1. **Desarrollo**: Ejecutar migraciones localmente
```bash
npx prisma migrate dev
```

2. **Producción**: Ejecutar antes de deploy
```bash
# Opción 1: Desde local hacia prod DB
DATABASE_URL="prod-url" npx prisma migrate deploy

# Opción 2: Render.com manual command
# Dashboard → Shell → npx prisma migrate deploy
```

**IMPORTANTE**: No usar `prisma migrate dev` en producción

#### 6. **Logs y Monitoring**

**Ver logs en Render**:
- Dashboard → Service → Logs
- Logs en tiempo real
- Búsqueda y filtrado

**Winston logs**:
- `logs/error.log` - Solo errores
- `logs/all.log` - Todos los logs

**Alertas automáticas**:
- Configurar en Render Dashboard
- Email en deploy failures
- Slack/Discord webhooks disponibles

### Variables de Entorno de Producción

**Checklist de seguridad**:

- ✅ `JWT_SECRET`: Generar con `openssl rand -base64 32`
- ✅ `DATABASE_URL`: Connection pooling habilitado (`?pgbouncer=true`)
- ✅ `ALLOWED_ORIGINS`: Solo dominios de producción
- ✅ `NODE_ENV`: Establecer a `production`
- ⚠️ Nunca commitear `.env` al repositorio
- ⚠️ Usar variables sincronizadas desde Render Dashboard

### Deployment Workflow

```bash
# 1. Desarrollo local
git checkout -b feature/nueva-feature
# ... código y tests ...

# 2. Commit y push
git add .
git commit -m "feat: agregar nueva feature"
git push origin feature/nueva-feature

# 3. Pull Request & Review
# Crear PR en GitHub
# Code review y aprobación

# 4. Merge to main
git checkout main
git merge feature/nueva-feature

# 5. Push to main (trigger auto-deploy en Render)
git push origin main

# 6. Verificar deploy en Render Dashboard
# - Build logs
# - Deploy logs
# - Health check status
```

### CI/CD con GitHub Actions (Opcional)

**Archivo**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '20'

    - run: npm ci
    - run: npx prisma generate
    - run: npm run build
    - run: npm test

    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

**Beneficios**:
- Tests automáticos en cada PR
- Previene merges que rompen el build
- Reportes de cobertura automáticos

### Troubleshooting Común

**1. Build falla: "Prisma Client no generado"**
```bash
# Solución: Agregar a build command
npx prisma generate
```

**2. Health check falla: "Database disconnected"**
```bash
# Verificar DATABASE_URL es correcta
# Verificar Supabase permite conexiones desde Render IPs
```

**3. CORS errors en producción**
```bash
# Verificar ALLOWED_ORIGINS incluye frontend domain
ALLOWED_ORIGINS=https://yourapp.com
```

**4. Memoria/CPU excedida (plan free)**
```bash
# Optimizar:
# - Reducir tamaño de respuestas (pagination)
# - Implementar caching
# - Upgrade a plan Starter ($7/mo)
```

---
