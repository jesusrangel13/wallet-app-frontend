# 🚀 Guía de Despliegue - Finance App

Esta guía te llevará paso a paso por el proceso de despliegue de tu aplicación Finance App en producción.

## 📋 Tabla de Contenidos

1. [Arquitectura de Despliegue](#arquitectura-de-despliegue)
2. [Prerequisitos](#prerequisitos)
3. [Preparación del Proyecto](#preparación-del-proyecto)
4. [Despliegue del Backend (Render.com)](#despliegue-del-backend-rendercom)
5. [Despliegue del Frontend (Vercel)](#despliegue-del-frontend-vercel)
6. [Configuración de CI/CD](#configuración-de-cicd)
7. [Verificación del Despliegue](#verificación-del-despliegue)
8. [Troubleshooting](#troubleshooting)
9. [Rollback y Mantenimiento](#rollback-y-mantenimiento)

---

## 🏗️ Arquitectura de Despliegue

```
┌─────────────────────────────────────────────────────────┐
│                    ARQUITECTURA                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Usuario  →  Vercel (Frontend)  →  Render (Backend)    │
│                      ↓                      ↓            │
│                   Next.js              Express API      │
│                                            ↓             │
│                                     Supabase (DB)       │
│                                                          │
└─────────────────────────────────────────────────────────┘

Componentes:
• Frontend: Next.js 15 en Vercel (https://tu-app.vercel.app)
• Backend: Express + TypeScript en Render.com (https://tu-api.onrender.com)
• Database: PostgreSQL en Supabase (ya configurado)
• CI/CD: GitHub Actions para auto-deployment
```

---

## ✅ Prerequisitos

Antes de comenzar, asegúrate de tener:

### Cuentas Necesarias (todas gratuitas)

- [ ] **GitHub**: Para alojar tu código
  - Crea una en: https://github.com/signup

- [ ] **Render.com**: Para el backend
  - Crea una en: https://dashboard.render.com/register
  - Free tier: 750 horas/mes (suficiente para 1 servicio 24/7)

- [ ] **Vercel**: Para el frontend
  - Crea una en: https://vercel.com/signup
  - Free tier: Unlimited deployments

- [ ] **Supabase**: Base de datos (ya debería estar configurado)
  - Verifica en: https://supabase.com/dashboard

### Software Instalado

- [ ] Git
- [ ] Node.js 18+ y npm
- [ ] Cuenta de GitHub con acceso SSH o HTTPS

---

## 🔧 Preparación del Proyecto

### Paso 1: Inicializar Git (si aún no lo has hecho)

```bash
cd /Users/jesusrangel/finance-app
git init
git add .
git commit -m "Initial commit: Finance App ready for deployment"
```

### Paso 2: Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre del repositorio: `finance-app` (o el que prefieras)
3. Mantén el repositorio como **privado** (recomendado)
4. NO inicialices con README (ya tienes archivos)
5. Click en "Create repository"

### Paso 3: Subir el Código a GitHub

```bash
# Añade el remote
git remote add origin https://github.com/TU-USUARIO/finance-app.git

# O si usas SSH:
git remote add origin git@github.com:TU-USUARIO/finance-app.git

# Sube el código
git branch -M main
git push -u origin main
```

### Paso 4: Verificar Variables de Entorno Locales

Tu proyecto ya incluye archivos `.env.production.example`. Verifica que tus archivos `.env` locales estén correctos:

**Backend (`/backend/.env`):**
```env
DATABASE_URL=postgresql://postgres.[proyecto]:[password]@[host].supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[proyecto]:[password]@[host].supabase.com:5432/postgres
NODE_ENV=development
PORT=3001
JWT_SECRET=tu-jwt-secret-local
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3000
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

**Frontend (`/frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

---

## 🔴 Despliegue del Backend (Render.com)

### Paso 1: Crear Web Service en Render

1. Ve a https://dashboard.render.com/
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub:
   - Click en "Connect account" si es primera vez
   - Autoriza a Render para acceder a tu repo
   - Selecciona el repositorio `finance-app`

### Paso 2: Configurar el Servicio

Render detectará automáticamente el `render.yaml`. Verifica la configuración:

- **Name**: `finance-app-api` (o el que prefieras)
- **Region**: Oregon (o la más cercana a tu ubicación)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: Node
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start`
- **Plan**: Free

### Paso 3: Configurar Variables de Entorno

En la sección "Environment Variables", añade las siguientes:

| Nombre | Valor | Descripción |
|--------|-------|-------------|
| `NODE_ENV` | `production` | Modo de producción |
| `PORT` | `10000` | Puerto (Render usa 10000) |
| `DATABASE_URL` | `postgresql://...` | URL de conexión de Supabase (pooling) |
| `DIRECT_URL` | `postgresql://...` | URL directa de Supabase |
| `JWT_SECRET` | `[generado]` | Usa "Generate" para crear uno seguro |
| `JWT_EXPIRES_IN` | `7d` | Duración del token |
| `ALLOWED_ORIGINS` | `https://tu-app.vercel.app` | **IMPORTANTE: Actualizar después** |
| `MAX_FILE_SIZE` | `5242880` | 5MB |
| `UPLOAD_DIR` | `/var/data/uploads` | Directorio de uploads |

#### 📝 Cómo Obtener las URLs de Supabase:

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **Database**
4. Copia:
   - **Connection pooling URL** → `DATABASE_URL`
   - **Connection string** → `DIRECT_URL`

**Ejemplo de DATABASE_URL:**
```
postgresql://postgres.zjjgaspsbqbmuevlnnrt:[TU_PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Ejemplo de DIRECT_URL:**
```
postgresql://postgres.zjjgaspsbqbmuevlnnrt:[TU_PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

### Paso 4: Configurar Disco Persistente (para uploads)

1. En la configuración del servicio, ve a **"Disks"**
2. Click en **"Add Disk"**
3. Configuración:
   - **Name**: `finance-app-uploads`
   - **Mount Path**: `/var/data/uploads`
   - **Size**: 1 GB (suficiente para free tier)
4. Click en "Save"

### Paso 5: Deploy Inicial

1. Click en **"Create Web Service"**
2. Render comenzará a construir y desplegar tu backend
3. Espera de 5-10 minutos para el primer despliegue
4. Verás logs en tiempo real

### Paso 6: Verificar el Despliegue

Una vez desplegado, tu backend estará disponible en:
```
https://finance-app-api.onrender.com
```

Prueba el health check:
```bash
curl https://finance-app-api.onrender.com/health
```

Deberías recibir:
```json
{
  "status": "ok",
  "timestamp": "2024-01-XX...",
  "environment": "production"
}
```

### Paso 7: Anotar la URL del Backend

**IMPORTANTE**: Guarda esta URL, la necesitarás para configurar el frontend:
```
https://finance-app-api.onrender.com
```

---

## 🔵 Despliegue del Frontend (Vercel)

### Paso 1: Importar Proyecto en Vercel

1. Ve a https://vercel.com/new
2. Click en **"Import Git Repository"**
3. Si es tu primera vez:
   - Click en "Continue with GitHub"
   - Autoriza a Vercel
4. Selecciona el repositorio `finance-app`
5. Click en **"Import"**

### Paso 2: Configurar el Proyecto

En la pantalla de configuración:

- **Project Name**: `finance-app-frontend` (o el que prefieras)
- **Framework Preset**: Next.js (detectado automáticamente)
- **Root Directory**: Click en **"Edit"** → Selecciona `frontend`
- **Build Command**: `npm run build` (por defecto)
- **Output Directory**: `.next` (por defecto)
- **Install Command**: `npm install` (por defecto)

### Paso 3: Configurar Variables de Entorno

En la sección **"Environment Variables"**, añade:

| Nombre | Valor | Descripción |
|--------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://finance-app-api.onrender.com/api` | URL de tu backend |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tu-proyecto.supabase.co` | URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `tu-anon-key` | Anon key de Supabase |

#### 📝 Cómo Obtener las Keys de Supabase:

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Paso 4: Deploy Inicial

1. Click en **"Deploy"**
2. Vercel construirá y desplegará tu frontend
3. Espera de 2-5 minutos
4. Verás el progreso en tiempo real

### Paso 5: Verificar el Despliegue

Una vez desplegado, Vercel te dará una URL como:
```
https://finance-app-frontend.vercel.app
```

O si elegiste un nombre diferente:
```
https://tu-nombre-elegido.vercel.app
```

### Paso 6: Actualizar CORS en el Backend

**IMPORTANTE**: Ahora que tienes la URL del frontend, debes actualizarla en Render:

1. Ve a https://dashboard.render.com/
2. Selecciona tu servicio `finance-app-api`
3. Ve a **"Environment"**
4. Edita la variable `ALLOWED_ORIGINS`
5. Cambia el valor a tu URL de Vercel:
   ```
   https://finance-app-frontend.vercel.app
   ```
6. Click en **"Save Changes"**
7. El servicio se reiniciará automáticamente (toma ~30 segundos)

---

## 🤖 Configuración de CI/CD

Tu proyecto ya incluye workflows de GitHub Actions para auto-deployment. Ahora necesitas configurar los secrets.

### Configurar Secrets para Backend (Render)

#### Paso 1: Obtener API Key de Render

1. Ve a https://dashboard.render.com/
2. Click en tu avatar (esquina superior derecha)
3. Click en **"Account Settings"**
4. Ve a **"API Keys"**
5. Click en **"Create API Key"**
6. Dale un nombre: `GitHub Actions - Finance App`
7. Click en **"Create"**
8. **COPIA LA KEY** (solo se muestra una vez)

#### Paso 2: Obtener Service ID

1. Ve a tu servicio en Render
2. La URL será algo como:
   ```
   https://dashboard.render.com/web/srv-XXXXXXXXXXXXX
   ```
3. El Service ID es: `srv-XXXXXXXXXXXXX`

#### Paso 3: Añadir Secrets a GitHub

1. Ve a tu repositorio en GitHub
2. Click en **"Settings"** → **"Secrets and variables"** → **"Actions"**
3. Click en **"New repository secret"**
4. Añade estos dos secrets:

| Nombre | Valor |
|--------|-------|
| `RENDER_API_KEY` | La API Key que copiaste |
| `RENDER_SERVICE_ID` | El Service ID (srv-...) |

### Configurar Secrets para Frontend (Vercel)

#### Paso 1: Obtener Token de Vercel

1. Ve a https://vercel.com/account/tokens
2. Click en **"Create Token"**
3. Nombre: `GitHub Actions - Finance App`
4. Scope: Full Account
5. Expiration: No expiration (o el tiempo que prefieras)
6. Click en **"Create"**
7. **COPIA EL TOKEN**

#### Paso 2: Obtener IDs del Proyecto

1. Ve a tu proyecto en Vercel
2. Click en **"Settings"**
3. En la pestaña **"General"**, encuentra:
   - **Project ID**: Copia el ID del proyecto
   - **Team ID** (u **Org ID**): Ve a tu perfil → Settings → General

También puedes usar Vercel CLI:
```bash
npm i -g vercel
vercel login
cd frontend
vercel link
# Esto creará .vercel/project.json con los IDs
cat .vercel/project.json
```

#### Paso 3: Añadir Secrets a GitHub

En el mismo lugar (Settings → Secrets → Actions), añade:

| Nombre | Valor |
|--------|-------|
| `VERCEL_TOKEN` | El token que copiaste |
| `VERCEL_ORG_ID` | Tu Org/Team ID |
| `VERCEL_PROJECT_ID` | El Project ID |
| `NEXT_PUBLIC_API_URL` | `https://finance-app-api.onrender.com/api` |
| `NEXT_PUBLIC_SUPABASE_URL` | Tu URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu Anon Key de Supabase |

### Probar el CI/CD

Una vez configurados los secrets:

1. Haz un cambio pequeño en tu código
2. Commit y push:
   ```bash
   git add .
   git commit -m "test: Probar CI/CD"
   git push origin main
   ```
3. Ve a **"Actions"** en tu repo de GitHub
4. Verás los workflows ejecutándose
5. El backend se desplegará automáticamente en Render
6. El frontend se desplegará automáticamente en Vercel

---

## ✅ Verificación del Despliegue

### Checklist de Verificación

- [ ] **Backend Health Check**
  ```bash
  curl https://tu-backend.onrender.com/health
  ```

- [ ] **Frontend Carga Correctamente**
  - Abre https://tu-frontend.vercel.app
  - Deberías ver la página de login/registro

- [ ] **Autenticación Funciona**
  - Registra un nuevo usuario
  - Inicia sesión
  - Verifica que el token se guarde

- [ ] **API Calls Funcionan**
  - Crea una cuenta
  - Añade una transacción
  - Verifica que los datos se guarden en Supabase

- [ ] **CORS Está Configurado**
  - Abre las DevTools del navegador (F12)
  - Ve a la pestaña Network
  - No deberías ver errores de CORS

- [ ] **CI/CD Funciona**
  - Haz un pequeño cambio
  - Push a main
  - Verifica que se despliegue automáticamente

### Comandos de Prueba

```bash
# Prueba el health check del backend
curl https://tu-backend.onrender.com/health

# Prueba el registro
curl -X POST https://tu-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "name": "Test User"
  }'

# Prueba el login
curl -X POST https://tu-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

---

## 🔧 Troubleshooting

### Problema 1: Error 503 en Render (Service Unavailable)

**Causa**: El servicio está en "sleeping" (free tier de Render duerme después de 15 min de inactividad)

**Solución**:
- Espera 30-60 segundos, Render despertará el servicio automáticamente
- Considera usar UptimeRobot (gratuito) para mantener el servicio activo: https://uptimerobot.com/

### Problema 2: CORS Errors en el Frontend

**Síntomas**: Ves errores como "Access-Control-Allow-Origin" en la consola del navegador

**Solución**:
1. Verifica que `ALLOWED_ORIGINS` en Render incluya tu URL de Vercel
2. Asegúrate de incluir el protocolo `https://`
3. NO incluyas barra al final: ❌ `https://app.vercel.app/` ✅ `https://app.vercel.app`
4. Reinicia el servicio en Render después de cambiar variables

### Problema 3: Variables de Entorno No Se Aplican

**Síntomas**: La app no se conecta a la API o a Supabase

**Solución en Vercel**:
1. Ve a Project Settings → Environment Variables
2. Verifica que todas las variables estén presentes
3. Asegúrate de que estén en el environment correcto (Production)
4. Redeploy: Settings → Deployments → Click en el último → "Redeploy"

**Solución en Render**:
1. Ve a Environment en tu servicio
2. Verifica las variables
3. Click en "Save Changes" (esto reinicia el servicio)

### Problema 4: Build Fails en Render

**Síntomas**: El build falla con errores de TypeScript o Prisma

**Solución**:
```bash
# Localmente, prueba el build
cd backend
npm run build

# Si falla localmente, arregla los errores
# Si funciona localmente pero falla en Render, verifica:
# 1. Node version en Render (debe ser 18+)
# 2. Variables de entorno DATABASE_URL y DIRECT_URL
```

### Problema 5: Database Connection Errors

**Síntomas**: Errores como "Can't reach database server"

**Solución**:
1. Verifica que las URLs de Supabase sean correctas
2. Asegúrate de usar:
   - `DATABASE_URL`: La URL con pooling (puerto 6543)
   - `DIRECT_URL`: La URL directa (puerto 5432)
3. Verifica que no haya espacios o caracteres extraños
4. Prueba la conexión desde tu local con las mismas URLs

### Problema 6: GitHub Actions Fails

**Síntomas**: Los workflows fallan en GitHub Actions

**Solución**:
1. Ve a Actions en GitHub
2. Click en el workflow fallido
3. Lee el error específico
4. Verifica que todos los secrets estén configurados
5. Para Render: Verifica `RENDER_API_KEY` y `RENDER_SERVICE_ID`
6. Para Vercel: Verifica `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

### Problema 7: File Uploads No Funcionan

**Síntomas**: Error al subir archivos CSV/Excel

**Solución**:
1. Verifica que el disco persistente esté montado en Render
2. Ruta correcta: `/var/data/uploads`
3. Ve a Render → Tu servicio → Disks → Verifica configuración
4. El disco debe estar en el mismo region que el servicio

---

## 🔄 Rollback y Mantenimiento

### Hacer Rollback en Render

Si un deployment causa problemas:

1. Ve a https://dashboard.render.com/
2. Selecciona tu servicio
3. Ve a **"Events"** o **"Deploys"**
4. Encuentra el último deployment exitoso
5. Click en el menú de tres puntos → **"Redeploy"**

### Hacer Rollback en Vercel

1. Ve a tu proyecto en Vercel
2. Ve a **"Deployments"**
3. Encuentra el último deployment exitoso
4. Click en el menú de tres puntos → **"Promote to Production"**

### Monitoreo

#### Render
- Dashboard: https://dashboard.render.com/
- Logs en tiempo real: Click en tu servicio → "Logs"
- Métricas: Click en tu servicio → "Metrics"

#### Vercel
- Dashboard: https://vercel.com/dashboard
- Analytics: Tu proyecto → "Analytics"
- Logs: Tu proyecto → "Deployments" → Click en un deployment → "Functions"

#### Supabase
- Dashboard: https://supabase.com/dashboard
- Database: Monitoring de queries y performance
- Logs: Logs de todas las operaciones

### Mantenimiento Regular

**Semanal:**
- [ ] Revisar logs de errores en Render y Vercel
- [ ] Verificar que la app esté funcionando correctamente
- [ ] Revisar uso de base de datos en Supabase

**Mensual:**
- [ ] Actualizar dependencias (npm update)
- [ ] Revisar seguridad (npm audit)
- [ ] Backup de base de datos en Supabase
- [ ] Revisar límites de free tier

### Límites de Free Tier

**Render:**
- 750 horas/mes (suficiente para 1 servicio 24/7)
- 512 MB RAM
- 0.1 CPU compartido
- El servicio duerme después de 15 min de inactividad
- Tiempo de wake-up: 30-60 segundos

**Vercel:**
- 100 GB bandwidth/mes
- 100 horas de ejecución/mes
- Deployments ilimitados
- Dominios custom ilimitados

**Supabase:**
- 500 MB database
- 1 GB bandwidth/mes
- 2 GB file storage
- 50,000 monthly active users

---

## 📚 Recursos Adicionales

### Documentación Oficial

- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs
- **Next.js**: https://nextjs.org/docs
- **Express**: https://expressjs.com/
- **Prisma**: https://www.prisma.io/docs
- **Supabase**: https://supabase.com/docs

### Soporte

- **Render Community**: https://community.render.com/
- **Vercel Discord**: https://vercel.com/discord
- **Supabase Discord**: https://discord.supabase.com/

### Herramientas Útiles

- **UptimeRobot**: Mantén tu backend activo (https://uptimerobot.com/)
- **GitHub Actions**: Automatización (https://github.com/features/actions)
- **Postman**: Testing de API (https://www.postman.com/)

---

## 🎉 ¡Felicidades!

Tu aplicación Finance App ahora está desplegada en producción con:

✅ Backend en Render.com
✅ Frontend en Vercel
✅ Database en Supabase
✅ CI/CD automatizado con GitHub Actions
✅ HTTPS automático
✅ Dominios gratis

**URLs de tu aplicación:**
- Frontend: `https://tu-app.vercel.app`
- Backend: `https://tu-api.onrender.com`
- API Docs: `https://tu-api.onrender.com/health`

---

**Notas Finales:**

1. Guarda este documento para referencia futura
2. Mantén tus secrets seguros (nunca los compartas)
3. Haz backups regulares de tu base de datos
4. Monitorea el uso de los free tiers
5. Considera upgradear a planes pagos cuando tu app crezca

**¿Necesitas ayuda?**
Si encuentras algún problema, revisa la sección de [Troubleshooting](#troubleshooting) o consulta la documentación oficial de cada plataforma.

---

*Última actualización: 2024*
