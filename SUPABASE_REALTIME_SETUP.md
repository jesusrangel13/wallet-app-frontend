# Configuración de Supabase Realtime para Notificaciones

## 📋 Pasos para Habilitar Realtime

### Opción 1: Vía Supabase Dashboard (Recomendado)

1. **Ir a Supabase Dashboard**
   - Abre: https://app.supabase.com
   - Selecciona tu proyecto

2. **Ir a Database > Replication**
   - En el menú lateral izquierdo, busca "Replication"
   - O ve a: https://app.supabase.com/project/[PROJECT_ID]/database/replication

3. **Habilitar Realtime para tabla `notifications`**
   - En la sección "Realtime", busca la tabla `notifications`
   - Toggle el switch para habilitarla
   - Debería mostrar "Enabled" en verde

4. **Guardar cambios**
   - Los cambios se guardan automáticamente

### Opción 2: Vía SQL (Alternativa)

Ejecuta la siguiente query en el SQL Editor de Supabase:

```sql
-- Habilitar publicación de cambios en tiempo real para la tabla notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

O si ya existe:

```sql
-- Verificar si ya está habilitada
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Si no está, agregarla
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

---

## ✅ Verificación

### Verificar que Realtime está activo:

1. En Supabase Dashboard, ve a "Replication"
2. Busca la tabla `notifications`
3. Debería estar marcada como "Enabled" ✓

### Verificar en la aplicación:

1. Abre http://localhost:3000 en tu navegador
2. Login con tu cuenta
3. Abre la consola de desarrollador (F12)
4. Crea un nuevo gasto compartido desde otra pestaña
5. Deberías ver:
   - Toast con notificación en tiempo real
   - Badge de campana se actualiza automáticamente
   - Notificación aparece en el dropdown sin necesidad de refresh

---

## 🧪 Testing

### Prueba 1: Notificación de Nuevo Gasto

1. **Usuario A**: Crea un gasto compartido incluyendo Usuario B
2. **Usuario B**: Debería ver una notificación en tiempo real sin polling
3. **Resultado esperado**: Toast + Badge se actualiza

### Prueba 2: Notificación de Pago Recibido

1. **Usuario B**: Marca que pagó
2. **Usuario A**: Debería ver notificación en tiempo real
3. **Resultado esperado**: Toast + Notificación aparece

### Prueba 3: Notificación de Balance Saldado

1. **Usuario B**: Salda el balance
2. **Usuario A**: Debería ver notificación en tiempo real
3. **Resultado esperado**: Toast + Notificación aparece

---

## 🔧 Configuración del Cliente

La configuración del cliente ya está lista en:

- `frontend/src/lib/supabase.ts` - Cliente Supabase
- `frontend/src/components/NotificationDropdown.tsx` - Suscripción a Realtime
- `frontend/.env.local` - Variables de entorno

### Variables de Entorno Requeridas:

```
NEXT_PUBLIC_SUPABASE_URL=https://zjjgaspsbqbmuevlnnrt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚠️ Solución de Problemas

### Las notificaciones no llegan en tiempo real

**Problema**: Las notificaciones solo aparecen al refrescar
**Solución**:
1. Verifica que Realtime está habilitado en Supabase Dashboard
2. Recarga la página (Ctrl+F5)
3. Verifica que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` están en `.env.local`
4. Abre la consola (F12) y busca errores de Supabase

### Error: "Missing Supabase environment variables"

**Problema**: Las variables de entorno no están configuradas
**Solución**:
1. Verifica que `.env.local` tiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Reinicia el servidor frontend: `npm run dev`
3. Limpia el caché del navegador

### Toast no aparece para notificaciones en tiempo real

**Problema**: No ves el toast cuando llega una notificación
**Solución**:
1. Verifica que Sonner está instalado (ya lo está)
2. Abre la consola para ver si hay errores
3. Verifica que la suscripción se estableció correctamente

---

## 📊 Flujo de Realtime

```
1. Usuario realiza acción (crear gasto, marcar pago, etc)
   ↓
2. Backend inserta notificación en BD
   ↓
3. PostgreSQL publica cambios (Realtime activado)
   ↓
4. Supabase broadcast cambios a clientes suscritos
   ↓
5. Frontend recibe evento en NotificationDropdown
   ↓
6. Notificación se agrega a store (Zustand)
   ↓
7. Toast aparece + Badge se actualiza
   ↓
8. Usuario ve notificación instantánea
```

---

## 🚀 Beneficios de Realtime vs Polling

| Aspecto | Polling (30s) | Realtime |
|---------|---------------|----------|
| Latencia | ~15s promedio | <100ms |
| Carga servidor | 240 req/hora | 0 req innecesarias |
| Experiencia | Espera notificaciones | Instantáneo |
| Escalabilidad | Limitada | Muy buena |

---

## 📝 Notas Importantes

1. **HTTPS en producción**: Realtime requiere HTTPS/WSS en producción
2. **Autenticación**: Las notificaciones usan el JWT del usuario (filtrado por userId)
3. **Seguridad**: Los Row Level Security policies se aplican automáticamente
4. **Escalabilidad**: Supabase Realtime maneja millones de conexiones

---

## ✨ Fase 2 Completada

Una vez que habilites Realtime en Supabase Dashboard, la Fase 2 estará completamente funcional:

✅ Cliente Supabase creado
✅ Variables de entorno configuradas
✅ NotificationDropdown suscrito a Realtime
✅ Toasts configurados
✅ Store de notificaciones integrado
⏳ Realtime habilitado en Supabase (falta este paso)

---

**Última actualización**: Noviembre 10, 2025
**Estado**: En espera de habilitar Realtime en Supabase Dashboard
