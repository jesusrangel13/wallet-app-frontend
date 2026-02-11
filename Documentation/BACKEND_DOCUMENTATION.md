# Backend Documentation - Finance App

## 📋 Tabla de Contenidos
- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
  - [Estructura del Proyecto](#estructura-del-proyecto)
  - [Patrón de Diseño](#patrón-de-diseño)
  - [Sistema de Tipos](#sistema-de-tipos)
- [Stack Tecnológico](#stack-tecnológico)
  - [Core y AI](#core-y-ai)
  - [Dependencias Principales](#dependencias-principales)
  - [Características de Seguridad](#características-de-seguridad)
- [Configuración y Entorno](#configuración-y-entorno)
  - [Validación de Variables de Entorno](#validación-de-variables-de-entorno)
  - [Variables de Entorno Requeridas](#variables-de-entorno-requeridas)
- [Base de Datos](#base-de-datos)
- [API Endpoints](#api-endpoints)
- [Documentación de API (Swagger)](#documentación-de-api-swagger)
- [Servicios Principales](#servicios-principales)
  - [Smart Insights (AI)](#smart-insights-ai)
  - [Voice Processing](#voice-processing)
  - [Finance Analysis](#finance-analysis)
- [Tareas Programadas (Cron)](#tareas-programadas-cron)
- [Middleware](#middleware)
- [Manejo de Errores](#manejo-de-errores)

---

## Descripción General

El backend de Finance App es una API RESTful construida con **Express.js** y **TypeScript** que proporciona funcionalidades completas de gestión financiera. Se destaca por la integración de **Inteligencia Artificial (Groq/Llama-3)** para generar insights financieros personalizados y procesar comandos de voz naturales.

---

## Arquitectura

### Estructura del Proyecto
```
backend/
├── src/
│   ├── controllers/      # Controladores HTTP
│   ├── services/         # Lógica de negocio modular
│   │   ├── voice/        # Servicios específicos de voz
│   ├── routes/           # Rutas API
│   ├── middleware/       # Middleware (auth, validation)
│   ├── cron/             # Tareas programadas
│   ├── config/           # Configuración (env, swagger)
│   ├── utils/            # Utilidades (logger, prisma)
│   └── server.ts         # Entry point
```

---

## Stack Tecnológico

### Core y AI
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Prisma ORM)
- **AI Engine**: **Groq SDK** (Llama-3-70b-versatile) para generación de texto ultra-rápida.
- **Scheduling**: `node-cron` para tareas periódicas.

### Dependencias Principales
```json
{
  "groq-sdk": "^0.37.0",       // Cliente AI para Insights
  "node-cron": "^4.2.1",       // Scheduler
  "@prisma/client": "^6.18.0", // ORM
  "zod": "^3.22.4",            // Validación
  "winston": "^3.19.0"         // Logging
}
```

---

## Configuración y Entorno

### Variables de Entorno Requeridas

Se ha añadido la configuración para el motor de IA. Validado en `src/config/env.ts`:

```env
# AI Configuration
GROQ_API_KEY=gsk_...  # API Key de Groq para generación de insights
```

---

## Servicios Principales

### Smart Insights (AI) (`smartInsights.service.ts`)
Servicio encargado de analizar el comportamiento financiero del usuario y generar consejos personalizados usando IA.

- **Generación Diaria**: Analiza si ya existen insights para el día actual para evitar duplicados y llamadas innecesarias a la API.
- **Contexto Enriquecido**: Recopila un contexto financiero profundo antes de llamar a la IA:
  - Flujo de caja del mes actual.
  - Top 5 categorías de gasto.
  - Top comerciantes por monto y frecuencia.
  - Tasa de ahorro actual.
- **Prompt Engineering**: Utiliza un prompt estructurado para forzar respuestas en formato JSON con tipos específicos ('tip', 'warning', 'achievement').

### Voice Processing (`services/voice/`)
Módulo dedicado al procesamiento de lenguaje natural para transacciones.

- **`ContextAssemblyService`**: Construye el contexto necesario para que la IA entienda referencias vagas.
  - *Cuentas activas*: "Pagar con la de crédito" -> Detecta tarjeta de crédito específica.
  - *Grupos frecuentes*: "Gasto de la casa" -> Detecta grupo "Casa".
  - *Historial de Payees*: "Uber" -> Asocia categoría Transporte automáticamente.
- **`SmartMatcherService`**: Utiliza algoritmos de **Fuzzy Matching** (Levenshtein) para vincular nombres detectados por la IA con entidades reales de la base de datos (IDs de grupos, cuentas, categorías).

### Finance Analysis (`financeAnalysis.service.ts`)
Motor de análisis financiero puro (sin IA) que alimenta los widgets y al servicio de Smart Insights.
- `getCashFlow()`: Ingresos vs Gastos diarios/mensuales.
- `getTopTags()`: Análisis de etiquetas más usadas.
- `getExpensesByCategory()`: Distribución porcentual de gastos.

---

## Tareas Programadas (Cron)

El backend utiliza `node-cron` para procesos de mantenimiento y generación proactiva de datos.

### Generación de Insights Diarios (`src/cron/generateDailyInsights.ts`)
- **Frecuencia**: Todos los días a las 00:00 UTC.
- **Lógica**: Recorre todos los usuarios activos y pre-genera sus "Smart Insights" para que estén listos cuando abran la app por la mañana.
- **Optimización**: Utiliza `generateDailyInsightsForBatch` para procesar en lote y manejar errores individualmente sin detener el cron job.

---

## API Endpoints (Nuevos/Actualizados)

### 🧠 AI & Insights (`/api/insights`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/daily` | Obtener insights del día (Genera si no existen) |
| POST | `/force` | Forzar regeneración (Dev/Admin) |

### 🎤 Voz (`/api/voice`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/parse` | Procesa audio/texto -> Devuelve transacción estructurada con intención de grupo detectada |

---

## Manejo de Errores

Se utiliza una estrategia centralizada con `AppError` que soporta códigos de error operacionales y traducción en el frontend.
- **AI Failures**: Si Groq falla o excede el timeout, el servicio de insights retorna un array vacío o insights cacheados previos, asegurando que la app no colapse (Graceful Degradation).
