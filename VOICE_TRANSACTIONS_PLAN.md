# Plan de Implementación: Transacciones por Voz

**Estado**: 📋 Planificado (implementar después de probar la app actual)
**Fecha de creación**: 2025-11-10
**Costo estimado**: $0 USD/mes (usando free tiers)
**Tiempo estimado**: 5 días de desarrollo

---

## 📚 Tabla de Contenidos

1. [Objetivo y Motivación](#objetivo-y-motivación)
2. [Investigación: MonAi](#investigación-monai)
3. [Análisis del Sistema Actual](#análisis-del-sistema-actual)
4. [Opciones de Tecnología](#opciones-de-tecnología)
5. [Arquitectura Propuesta](#arquitectura-propuesta)
6. [Plan de Implementación](#plan-de-implementación)
7. [Estructura de Archivos](#estructura-de-archivos)
8. [Flujo de Usuario](#flujo-de-usuario)
9. [Manejo de Gastos Compartidos](#manejo-de-gastos-compartidos)
10. [Sistema de Aprendizaje](#sistema-de-aprendizaje)
11. [Ejemplos de Uso](#ejemplos-de-uso)
12. [Métricas de Éxito](#métricas-de-éxito)
13. [Roadmap Futuro](#roadmap-futuro)

---

## Objetivo y Motivación

Implementar un sistema de entrada de transacciones por voz similar a MonAi, permitiendo que los usuarios registren gastos de forma natural y conversacional:

**Ejemplo**: "Ayer gasté 25 mil en Starbucks"
**Resultado**: Transacción creada automáticamente con:
- Monto: $25,000 CLP
- Descripción: Starbucks
- Fecha: Ayer
- Categoría: Comida y Bebidas (autodetectada)
- Estado: Confirmada (con opción de editar)

### Beneficios

✅ Experiencia de usuario similar a MonAi
✅ Entrada rápida sin llenar formularios
✅ Costo $0 (sin pagar por IA)
✅ Aprendizaje continuo de patrones del usuario
✅ Soporte para gastos compartidos ("Dividí 50k entre 3")
✅ Completamente en español

---

## Investigación: MonAi

### ¿Qué es MonAi?

MonAi es una app de registro de gastos que revoluciona cómo se registran transacciones usando entrada de voz natural.

### Características Clave de MonAi

| Característica | Detalle |
|---|---|
| **Entrada de voz** | Hablas naturalmente como si le contaras a un amigo |
| **IA Backend** | GPT-3.5-turbo de OpenAI (elegido por costo-efectividad) |
| **Procesamiento** | Extrae: monto, fecha, descripción, categoría automáticamente |
| **Privacidad** | Usa iCloud (Apple) - sin login, datos privados |
| **Lenguajes** | Español, inglés y otros |
| **Categorización** | IA automática con confirmación del usuario |

### Stack Tecnológico de MonAi

- **Speech-to-Text**: Web Speech API (navegador) + Whisper (profesional)
- **NLP**: OpenAI GPT-3.5-turbo
- **Backend**: Servidor privado
- **Storage**: iCloud
- **Plataformas**: iOS y Android

---

## Análisis del Sistema Actual

### Estructura de Transacciones (Tu App)

Tu aplicación ya tiene un sistema robusto de transacciones con:

**Campos soportados**:
- `amount` - Monto (requerido)
- `accountId` - Cuenta (requerido)
- `type` - Tipo: EXPENSE, INCOME, TRANSFER
- `date` - Fecha (opcional, default: ahora)
- `categoryId` - Categoría (opcional)
- `description` - Descripción (opcional)
- `payee` - A quién se le pagó (opcional)
- `receiptUrl` - URL de recibo (opcional)
- `sharedExpenseId` - Para gastos compartidos (opcional)
- `tags` - Etiquetas (opcional)

**Categorías disponibles** (10 para EXPENSE):
- Comida y Bebidas
- Transporte
- Compras
- Entretenimiento
- Servicios (luz, agua, internet)
- Salud
- Educación
- Vivienda
- Viajes
- Otros Gastos

**Gastos Compartidos** (SharedExpense):
- Soporta 4 tipos de split: EQUAL, PERCENTAGE, EXACT, SHARES
- Tracking de balances entre usuarios
- Sistema de pagos y asentamientos

### UI Actual para Crear Transacciones

Tu app ya tiene `TransactionFormModal.tsx` con:
- Selector de tipo (Expense/Income/Transfer)
- Selector de cuenta (filtrado por moneda)
- Selector de categoría visual
- Campo de descripción
- Picker de fecha/hora
- Integración con gastos compartidos
- Validación robusta

**Ventaja**: Podemos reutilizar toda esta lógica, solo agregando un parser de voz al inicio.

---

## Opciones de Tecnología

### Criterios de Evaluación

✅ **Costo**: Preferencia a opciones gratuitas
✅ **Precisión**: 85%+ de accuracy en parsing
✅ **Velocidad**: <500ms de latencia
✅ **Soporte español**: Multiidioma
✅ **Integración**: Fácil de implementar

### Opción 1: Hybrid Rule-Based (⭐ RECOMENDADO PARA MVP)

**Componentes**:
- Web Speech API (navegador) → voz a texto ($0)
- Regex + Sugar.js (NPM) → extracción de patrones ($0)
- Currency.js (NPM) → parsing de montos ($0)
- GROQ API Free Tier → fallback para casos complejos ($0)

**Ventajas**:
- 85-92% accuracy
- $0 costo total
- <50ms rule-based, <300ms con GROQ
- Control total de la lógica
- Funciona en español nativo
- Puede mejorar continuamente

**Desventajas**:
- Requiere mantener reglas/patrones
- 15% casos necesitan IA
- Dependencia de GROQ (pequeño rate limit)

**Recomendación**: ✅ EMPEZAR CON ESTO

---

### Opción 2: GROQ API (Free Tier) - Llama 3.3 70B

**Costo**: Gratis (250 requests/día, 70,000 tokens/min)
**Accuracy**: 85-92%
**Speed**: 100-300ms

```javascript
// Ejemplo
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'user',
      content: `Extrae info de: "Pagué $25,000 en Starbucks ayer"

      Retorna JSON: { amount, currency, date, merchant, category, description }`
    }]
  })
});
```

**Ventaja**: Excelente precisión, muy rápido, sin mantenimiento
**Desventaja**: Rate limits si muchos usuarios

---

### Opción 3: Ollama + Llama 3.3 8B (Self-hosted)

**Costo**: $0 (requiere servidor)
**Accuracy**: 85-95%
**Speed**: 200-800ms (depende hardware)

Ejecutar modelo localmente en tu servidor backend.

**Ventaja**: Privacidad total, sin límites, sin costos API
**Desventaja**: Requiere GPU, configuración más compleja

**Recomendación futuro**: Migrar aquí si escalas

---

### Opción 4: Google Gemini API (Free Tier)

**Costo**: Gratis (limitado a 5 req/min, 25 req/día)
**Accuracy**: 88-94%
**Speed**: 500-1500ms

**Ventaja**: Alta precisión
**Desventaja**: Rate limits muy bajos

---

### Opción 5: Anthropic Claude (Pago)

**Costo**: $5 crédito inicial gratuito
**Accuracy**: 92-96% (mejor precisión)
**Speed**: 400-1000ms

**Ventaja**: Razonamiento excelente, estructura confiable
**Desventaja**: Costo después de créditos iniciales

**Recomendación**: Comparar después de MVP exitoso

---

### Comparativa Final

| Opción | Costo | Accuracy | Speed | Español | Recomendación |
|--------|-------|----------|-------|---------|---------------|
| **Hybrid (MVP)** | $0 | 85-92% | <50ms | ⭐⭐⭐⭐⭐ | ✅ AHORA |
| GROQ Fallback | $0 | 90-95% | 300ms | ⭐⭐⭐⭐⭐ | ✅ AHORA |
| Ollama | $0* | 85-95% | 500ms | ⭐⭐⭐⭐⭐ | Futuro |
| Gemini | $0† | 88-94% | 1000ms | ⭐⭐⭐⭐⭐ | Test |
| Claude | $5-25 | 92-96% | 600ms | ⭐⭐⭐⭐⭐ | Comparar |

*Requiere servidor GPU
†Rate limits muy bajos

---

## Arquitectura Propuesta

### Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Navegador)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  VoiceTransactionButton (botón flotante)                   │
│           ↓                                                 │
│  useVoiceRecognition hook (Web Speech API)                 │
│           ↓ (transcripción en español)                     │
│  VoiceTransactionModal (confirmación)                      │
│           ↓                                                 │
│  POST /api/voice-transactions/parse → Backend              │
│           ↓ (datos pre-llenados)                           │
│  TransactionFormModal (editable)                           │
│           ↓ (usuario confirma)                             │
│  POST /api/transactions → Crear transacción               │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  POST /api/voice-transactions/parse                        │
│         ↓                                                   │
│  TransactionParserService (Hybrid Logic)                   │
│         ├→ RegexParser (85% casos) → retornar rápido      │
│         └→ GroqParser (15% casos) → IA fallback           │
│         ↓                                                   │
│  TransactionLearnerService                                 │
│         └→ Consultar patrones aprendidos del usuario       │
│         ↓                                                   │
│  Retornar JSON estructurado con sugerencias                │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  UserTransactionPattern                                    │
│  - pattern: "starbucks"                                    │
│  - categoryId: "..." (Comida y Bebidas)                    │
│  - accountId: "..." (preferida)                            │
│  - confidence: 0.95                                        │
│  - useCount: 23                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Componentes Principales

#### 1. **Frontend**

**VoiceTransactionButton.tsx** (Global floating button)
- Ubicación: esquina inferior derecha
- Icono micrófono con pulsación animada
- Estados: idle → listening → processing → confirmed
- Hotkey opcional (Ctrl+Shift+V)

**VoiceTransactionModal.tsx** (Confirmation)
- Muestra transcripción en tiempo real
- Pre-rellena formulario con datos extraídos
- Permite editar antes de confirmar
- Opciones: Confirmar / Cancelar / Re-grabar

**useVoiceRecognition hook**
- Wrapper Web Speech API
- Manejo de permisos
- Detección idioma español
- Gestión de estados

#### 2. **Backend Services**

**nlp-transaction-parser.service.ts** (Rule-based)
- Parsing de montos (multi-moneda: CLP, USD, EUR)
- Parsing de fechas naturales en español (Sugar.js)
- Extracción de comercios/payees (regex)
- Inferencia de categorías por keywords
- Confidence score (0-1)

**ai-transaction-parser.service.ts** (IA Fallback)
- Integración con GROQ API
- Structured JSON output
- Detección de gastos compartidos
- Error handling y fallbacks

**transaction-learning.service.ts** (ML local)
- Almacenar correcciones del usuario
- Aprender asociaciones comercio → categoría
- Sugerir categorías por historial
- Mejorar accuracy con cada uso

#### 3. **API Endpoints**

```
POST /api/voice-transactions/parse
  Input: { text: string }
  Output: {
    amount: number,
    currency: 'CLP' | 'USD' | 'EUR',
    date: Date,
    description: string,
    merchant?: string,
    category?: string,
    confidence: number,
    isSharedExpense: boolean,
    sharedExpenseData?: {
      groupId?: string,
      splitType?: 'EQUAL' | 'PERCENTAGE' | 'EXACT' | 'SHARES',
      participants?: number
    }
  }

POST /api/voice-transactions/create
  Input: { parsed transaction data }
  Output: { success: boolean, transactionId: string }

GET /api/voice-transactions/suggestions
  Output: { patterns: UserTransactionPattern[] }
```

---

## Plan de Implementación

### Fase 1: Backend - Sistema de Parsing (Día 1-2)

#### 1.1 Dependencias NPM

```bash
npm install sugar-date currency.js
npm install --save-dev @types/sugar-date
```

#### 1.2 Crear Servicio de Parsing Rule-Based

**Archivo**: `backend/src/services/nlp-transaction-parser.service.ts`

**Responsabilidades**:
- Parsing de montos con detección de moneda (CLP, USD, EUR)
- Parsing de fechas en español (ayer, hace 3 días, el 15 de enero)
- Extracción de comercios mediante regex y patrones
- Inferencia de categorías basada en keywords
- Cálculo de confidence score
- Detección de palabras clave de gastos compartidos

**Ejemplo de parsing**:
```javascript
Input: "Pagué 25 mil en Starbucks ayer"
Output: {
  amount: 25000,
  currency: 'CLP',
  date: Date(yesterday),
  merchant: 'Starbucks',
  category: 'Comida y Bebidas',
  description: 'Starbucks',
  confidence: 0.95,
  isSharedExpense: false
}
```

#### 1.3 Crear Servicio de Parsing con IA (GROQ)

**Archivo**: `backend/src/services/ai-transaction-parser.service.ts`

**Responsabilidades**:
- Integración con GROQ API (Llama 3.3 70B)
- Manejo de casos complejos que rule-based no puede
- Extracción de gastos compartidos
- Structured JSON output
- Rate limiting y error handling

**Uso**:
```javascript
// Se usa como fallback cuando confidence < 0.7
if (ruleBasedResult.confidence < 0.7) {
  return await groqParser.parse(text);
}
```

#### 1.4 Crear Servicio de Aprendizaje de Patrones

**Archivo**: `backend/src/services/transaction-learning.service.ts`

**Responsabilidades**:
- Guardar patrones aprendidos en DB
- Retornar sugerencias basadas en historial
- Mejorar confidence cuando detecta patrón conocido
- Tracking de accuracy

**Ejemplo**:
```javascript
// Usuario corrige categoría "Starbucks" → "Comida"
learner.savePattern({
  pattern: 'starbucks',
  categoryId: '...', // Comida y Bebidas
  confidence: 0.95,
  accountId: '...' // Cuenta preferida
});

// Próxima vez que ve "Starbucks":
const suggestion = learner.getSuggestion('starbucks');
// → { categoryId: '...', confidence: 0.95 }
```

#### 1.5 Agregar Tabla en Base de Datos

**Archivo**: `backend/prisma/schema.prisma`

```prisma
model UserTransactionPattern {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Pattern to match (lowercase)
  pattern     String   // "starbucks", "uber", "supermercado"

  // Learned associations
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id])

  accountId   String?
  account     Account? @relation(fields: [accountId], references: [id])

  // Metadata
  confidence  Float    @default(0.5) // 0-1
  useCount    Int      @default(1)   // Times used

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, pattern])
  @@index([userId])
  @@index([pattern])
}
```

#### 1.6 Crear Controller y Routes

**Archivo**: `backend/src/controllers/voiceTransaction.controller.ts`

```typescript
export class VoiceTransactionController {
  async parseTransaction(req: Request, res: Response) {
    const { text } = req.body;
    const userId = req.userId; // from auth middleware

    // Parse with rule-based first
    const result = await parserService.parse(text);

    // If low confidence, try IA
    if (result.confidence < 0.7) {
      const aiResult = await groqService.parse(text);
      result = { ...result, ...aiResult, confidence: aiResult.confidence };
    }

    // Check learned patterns
    const suggestions = await learnerService.getSuggestions(userId, result);
    result.suggestions = suggestions;

    return res.json(result);
  }

  async createVoiceTransaction(req: Request, res: Response) {
    // Create transaction normally
    // Then save patterns from corrections
  }
}
```

**Archivo**: `backend/src/routes/voiceTransaction.routes.ts`

```typescript
router.post('/api/voice-transactions/parse', voiceController.parseTransaction);
router.post('/api/voice-transactions/create', voiceController.createVoiceTransaction);
router.get('/api/voice-transactions/suggestions', voiceController.getPatterns);
```

#### 1.7 Registrar Rutas en Server

**Archivo**: `backend/src/server.ts`

```typescript
import voiceTransactionRoutes from './routes/voiceTransaction.routes';

app.use('/api', voiceTransactionRoutes);
```

---

### Fase 2: Frontend - Botón Flotante y UI (Día 2-3)

#### 2.1 Crear Hook de Web Speech API

**Archivo**: `frontend/src/hooks/useVoiceRecognition.ts`

```typescript
export interface UseVoiceRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceRecognition(): UseVoiceRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Verificar soporte
  const isSupported = typeof window !== 'undefined' &&
    'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  // Inicializar reconocedor
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    // Configurar para español
    recognitionRef.current.language = 'es-ES';
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognitionRef.current.onresult = (event: any) => {
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        final += event.results[i][0].transcript;
      }
      setTranscript(final);
    };

    recognitionRef.current.onerror = (event: any) => {
      setError(`Error de micrófono: ${event.error}`);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };
  }, [isSupported]);

  return {
    isListening,
    isSupported,
    transcript,
    error,
    startListening: () => recognitionRef.current?.start(),
    stopListening: () => recognitionRef.current?.stop(),
    resetTranscript: () => setTranscript(''),
  };
}
```

#### 2.2 Crear Botón Flotante

**Archivo**: `frontend/src/components/VoiceTransactionButton.tsx`

```typescript
import { Mic } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { VoiceTransactionModal } from './VoiceTransactionModal';
import { useState } from 'react';

export function VoiceTransactionButton() {
  const { isListening, transcript, startListening, stopListening } = useVoiceRecognition();
  const [showModal, setShowModal] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');

  const handleStart = () => {
    startListening();
  };

  const handleStop = () => {
    stopListening();
    setFinalTranscript(transcript);
    setShowModal(true);
  };

  return (
    <>
      <button
        onClick={isListening ? handleStop : handleStart}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center transition-all ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        title={isListening ? 'Detener grabación' : 'Iniciar grabación de voz'}
      >
        <Mic className="w-6 h-6 text-white" />
      </button>

      {showModal && (
        <VoiceTransactionModal
          transcript={finalTranscript}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
```

#### 2.3 Crear Modal de Confirmación

**Archivo**: `frontend/src/components/VoiceTransactionModal.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { voiceTransactionAPI } from '@/lib/voiceTransactionAPI';
import { TransactionFormModal } from './TransactionFormModal';
import { toast } from 'sonner';

interface VoiceTransactionModalProps {
  transcript: string;
  onClose: () => void;
}

export function VoiceTransactionModal({ transcript, onClose }: VoiceTransactionModalProps) {
  const [parsedData, setParsedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parseTranscript = async () => {
      try {
        setLoading(true);
        const result = await voiceTransactionAPI.parseTransaction(transcript);
        setParsedData(result);
      } catch (err) {
        setError('Error al procesar el audio. Intenta de nuevo.');
        toast.error('Error al procesar la transacción');
      } finally {
        setLoading(false);
      }
    };

    parseTranscript();
  }, [transcript]);

  if (loading) {
    return (
      <Modal isOpen={true} onClose={onClose}>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Procesando audio...</p>
          </div>
        </div>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal isOpen={true} onClose={onClose}>
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cerrar
          </button>
        </div>
      </Modal>
    );
  }

  // Mostrar transacción pre-llenada para confirmación
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Confirmar Transacción</h2>

        {/* Mostrar transcripción */}
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <p className="text-sm text-gray-600">Lo que escuchaste:</p>
          <p className="font-medium">"{transcript}"</p>
        </div>

        {/* Mostrar confianza */}
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-gray-600">Confianza en extracción:</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-300 rounded-full h-2">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{ width: `${parsedData.confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium">{Math.round(parsedData.confidence * 100)}%</span>
          </div>
        </div>

        {/* Datos extraídos (resumen) */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
            <p className="font-bold text-lg">{parsedData.amount} {parsedData.currency}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <p className="font-bold">{new Date(parsedData.date).toLocaleDateString('es-ES')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comercio</label>
            <p className="font-bold">{parsedData.merchant || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <p className="font-bold">{parsedData.category || 'Por asignar'}</p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              // Pasar a formulario completo para editar
              // Mostrar TransactionFormModal con datos pre-llenados
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Editar y Confirmar
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 2.4 Crear Cliente API

**Archivo**: `frontend/src/lib/voiceTransactionAPI.ts`

```typescript
export const voiceTransactionAPI = {
  async parseTransaction(text: string) {
    const response = await fetch('/api/voice-transactions/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) throw new Error('Parse failed');
    return response.json();
  },

  async createVoiceTransaction(data: any) {
    const response = await fetch('/api/voice-transactions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Create failed');
    return response.json();
  },

  async getPatterns() {
    const response = await fetch('/api/voice-transactions/suggestions');
    if (!response.ok) throw new Error('Get patterns failed');
    return response.json();
  }
};
```

#### 2.5 Agregar Botón a Layout Global

**Archivo**: `frontend/src/app/layout.tsx`

```typescript
import { VoiceTransactionButton } from '@/components/VoiceTransactionButton';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <VoiceTransactionButton />
      </body>
    </html>
  );
}
```

---

### Fase 3: Funcionalidades Avanzadas (Día 4)

#### 3.1 Detección de Gastos Compartidos

Detectar en el texto parseado si contiene palabras clave como:
- "split con [grupo]"
- "dividir entre [N]"
- "compartido con"
- "gasto del grupo"

#### 3.2 Sistema de Aprendizaje Completo

Cuando usuario edita/confirma:
1. Guardar patrón si cambió categoría
2. Guardar preferencia de cuenta
3. Incrementar `useCount`
4. Recalcular `confidence` basado en uso

#### 3.3 Sugerencias en Tiempo Real

Mientras usuario digita/habla:
- Mostrar sugerencias de categoría
- Mostrar cuenta preferida
- Mostrar comercios similares detectados

---

### Fase 4: Pulido y Optimizaciones (Día 5)

#### 4.1 UX Improvements

- Animación de ondas de audio mientras escucha
- Notificaciones toast con contador de transacciones creadas
- Keyboard shortcut (Ctrl+Shift+V)
- Tutorial para primera vez
- Feedback visual de confianza

#### 4.2 Error Handling

- Sin permisos micrófono → instrucciones claras
- API caída → fallback a rule-based parser
- Sin internet → modo offline básico
- Ruido alto → pedir repetir

#### 4.3 Accesibilidad

- ARIA labels completos
- Navegación por teclado
- Estados claros para screen readers
- Contraste de colores suficiente

---

## Estructura de Archivos

### Archivos a Crear

```
backend/
├── src/
│   ├── services/
│   │   ├── nlp-transaction-parser.service.ts (NEW)
│   │   ├── ai-transaction-parser.service.ts (NEW)
│   │   └── transaction-learning.service.ts (NEW)
│   ├── controllers/
│   │   └── voiceTransaction.controller.ts (NEW)
│   ├── routes/
│   │   └── voiceTransaction.routes.ts (NEW)
│   └── utils/
│       └── voice-patterns.ts (NEW)
└── prisma/
    └── schema.prisma (MODIFY: add UserTransactionPattern)

frontend/
├── src/
│   ├── components/
│   │   ├── VoiceTransactionButton.tsx (NEW)
│   │   └── VoiceTransactionModal.tsx (NEW)
│   ├── hooks/
│   │   └── useVoiceRecognition.ts (NEW)
│   ├── lib/
│   │   └── voiceTransactionAPI.ts (NEW)
│   ├── types/
│   │   └── voice.ts (NEW)
│   └── app/
│       └── layout.tsx (MODIFY: add button)
```

### Archivos a Modificar

```
backend/
├── src/
│   └── server.ts (add routes)
└── package.json (add: sugar-date, currency.js)

frontend/
└── package.json (no new deps needed)
```

---

## Flujo de Usuario

### Escenario 1: Gasto Simple

```
1. Usuario presiona botón flotante 🎤
2. Navegador pide permiso micrófono (primera vez)
3. Usuario habla: "Pagué 25 mil en Starbucks ayer"
4. Web Speech API transcribe en español
5. Backend recibe: "Pagué 25 mil en Starbucks ayer"
6. Rule-based parser:
   - Extrae: $25000 CLP
   - Detecta: fecha = ayer
   - Extrae: merchant = "Starbucks"
   - Infiere: categoría = "Comida y Bebidas"
   - Confidence: 0.95 ✅
7. Consulta patrones aprendidos: "starbucks" → "Comida" (98% confianza)
8. Modal muestra:
   - Transcripción: "Pagué 25 mil en Starbucks ayer"
   - Monto: $25,000 CLP
   - Fecha: 09/11/2025
   - Comercio: Starbucks
   - Categoría: Comida y Bebidas (sugerida)
   - Confianza: 95%
9. Usuario hace clic en "Confirmar"
10. Transacción creada ✅
11. Toast: "Transacción registrada: Starbucks, $25,000"
```

### Escenario 2: Gasto Complejo

```
1. Usuario habla: "Dividí 60 mil con mis roommates el viernes pasado"
2. Rule-based parser confidence: 0.65 (bajo - ambiguo)
3. Fallback a GROQ API
4. GROQ procesa y retorna:
   - Amount: 60000 CLP
   - Date: Friday last week
   - IsSharedExpense: true
   - MissingInfo: cuenta, categoría, grupo exacto
5. Modal muestra formulario completo para completar
6. Usuario selecciona:
   - Grupo: "Roommates"
   - Split: EQUAL (3 personas)
   - Categoría: "Comida y Bebidas"
   - Cuenta: "Tarjeta Crédito"
7. Confirma → Crea shared expense + transacción
```

### Escenario 3: Gasto con Aprendizaje

```
1. Usuario habla: "Uber a casa, 8 mil"
2. Rule-based detecta: Uber → Transporte (historial)
3. Sugiere categoría: "Transporte"
4. Usuario edita: cambiaría a "Otros" (si es diferente)
5. Sistema aprende: "Uber en viernes noche" → "Otros"
6. Próxima vez: Ofrece sugerencia actualizada
```

---

## Manejo de Gastos Compartidos

### Detección de Palabras Clave

```javascript
const sharedExpenseKeywords = {
  es: [
    'split',
    'dividir',
    'compartir',
    'repartir',
    'entre',
    'roommates',
    'grupo',
    'gasto del grupo'
  ],
  en: ['split', 'share', 'divide', 'between', 'group']
};
```

### Ejemplos de Procesamiento

| Input | Detección | Resultado |
|-------|-----------|-----------|
| "Dividí 60k entre 3" | ✅ Shared | 3 personas, EQUAL split |
| "Split con roommates 50k" | ✅ Shared | Group: roommates, EQUAL split |
| "Gasto grupo 100k, yo pagué 70" | ✅ Shared | EXACT split: yo 70k, otros 30k |
| "Compré 25k en supermercado" | ❌ No shared | Expense normal |

### Flujo de Creación

1. Detectar palabras clave compartidas
2. Obtener lista de grupos del usuario
3. Intentar matchear nombre de grupo en texto
4. Si no matchea, listar grupos para seleccionar
5. Pre-llenar SharedExpenseForm con datos extraídos
6. Usuario ajusta split type si necesario
7. Crear shared expense + transaction

---

## Sistema de Aprendizaje

### Estructura de Patrón

```typescript
interface UserTransactionPattern {
  id: string;
  userId: string;
  pattern: string;           // "starbucks", "uber", "enel"
  categoryId?: string;       // Categoría aprendida
  accountId?: string;        // Cuenta preferida
  confidence: number;        // 0-1, basado en use count
  useCount: number;          // Veces usado
  createdAt: Date;
  updatedAt: Date;
}
```

### Lógica de Confianza

```
confidence = min(1.0, 0.5 + (useCount * 0.05))

useCount=1:   confidence = 0.55 (bajo)
useCount=5:   confidence = 0.75 (medio)
useCount=10:  confidence = 1.0 (alto)
```

### Cuando Guardar

```javascript
// Cuando usuario confirma transacción:
if (merchant && category && confirmado) {
  await learnerService.savePattern({
    pattern: merchant.toLowerCase(),
    categoryId: category.id,
    accountId: transaction.accountId,
    confidence: 0.7 // Comenzar bajo
  });
}

// Cuando usuario edita categoría:
if (suggeridaCategory !== selectedCategory) {
  await learnerService.updatePattern({
    pattern: merchant.toLowerCase(),
    categoryId: selectedCategory.id,
    useCount: currentUseCount + 1
  });
}
```

### Cuando Usar

```javascript
// Al extraer transacción:
const pattern = await learnerService.getPattern(userId, merchant);
if (pattern && pattern.confidence > 0.7) {
  suggestion.categoryId = pattern.categoryId;
  suggestion.accountId = pattern.accountId;
  suggestion.confidence += pattern.confidence * 0.2;
}
```

---

## Ejemplos de Uso

### Ejemplos en Español (Casos Cubiertos)

#### Básicos
- "Pagué 25 mil en Starbucks"
- "Gasté 50 dólares en Uber"
- "Compré 15 euros en tienda"

#### Con Fechas
- "Ayer gasté 30k en supermercado"
- "Hace 3 días pagué 100k de luz"
- "El 15 de octubre compré 50k en ropa"
- "La semana pasada gasté 200k en viajes"

#### Con Comercios Específicos
- "McDonald's, 12 mil"
- "Pago de Netflix, 9 mil"
- "Compra en Jumbo, 45 mil"

#### Gastos Compartidos
- "Dividí 60 mil entre 3 en el restaurante"
- "Split con roommates de 120 mil"
- "Gasto grupo de 80 mil en pizza"
- "Compartí 100 mil entre Juan, María y yo"

#### Complejos
- "Ayer dividí 150 mil entre mis 4 compañeros de oficina en almuerzo"
- "Pagué 25 dólares en Uber a las 11 de la noche hace 2 días"
- "Gasto del grupo de viajes: 500 mil, el 20% me corresponde"

### Ejemplos de Salida

```json
// Caso 1: Simple
{
  "amount": 25000,
  "currency": "CLP",
  "date": "2025-11-10T00:00:00Z",
  "description": "Starbucks",
  "merchant": "Starbucks",
  "category": "Comida y Bebidas",
  "confidence": 0.95,
  "isSharedExpense": false
}

// Caso 2: Compartido
{
  "amount": 60000,
  "currency": "CLP",
  "date": "2025-11-10T00:00:00Z",
  "description": "Dividí 60 mil entre 3",
  "merchant": "Restaurante",
  "category": "Comida y Bebidas",
  "confidence": 0.88,
  "isSharedExpense": true,
  "sharedExpenseData": {
    "groupId": "group-123",
    "splitType": "EQUAL",
    "participants": 3,
    "estimatedPerPerson": 20000
  }
}

// Caso 3: Fallback a IA (baja confianza rule-based)
{
  "amount": 500000,
  "currency": "CLP",
  "date": "2025-11-08T00:00:00Z",
  "description": "Gasto grupo viajes",
  "merchant": "null",
  "category": "Viajes",
  "confidence": 0.72,
  "isSharedExpense": true,
  "sharedExpenseData": {
    "groupId": "group-456",
    "splitType": "PERCENTAGE",
    "userPercentage": 20
  },
  "aiPowered": true,
  "aiModel": "llama-3.3-70b"
}
```

---

## Métricas de Éxito

### Accuracy (Parsing)

- ✅ **Rule-based**: 85-92% accuracy
- ✅ **Con AI fallback**: 90-95% accuracy
- ✅ **Con aprendizaje**: 95%+ para usuarios activos

### Performance

- ✅ **Rule-based latency**: <50ms
- ✅ **Total latency (con IA)**: <500ms
- ✅ **Modal display**: Instant (<100ms)

### Cobertura

- ✅ **Cubre 85%+ de inputs** con rule-based
- ✅ **Detecta gastos compartidos**: 80%+ de casos
- ✅ **Extrae fechas naturales**: 90%+ en español

### Costo

- ✅ **Costo mensual**: $0 USD
- ✅ **Rate limits**: 250+ requests/día (GROQ free)
- ✅ **Escalabilidad**: Gratuita hasta 10,000 requests/mes

### Adopción

- ✅ **TBD**: % de transacciones creadas por voz
- ✅ **TBD**: % de usuarios que activan la feature
- ✅ **TBD**: % de ediciones post-parsing

---

## Roadmap Futuro

### Fase 5: Ollama Self-Hosted (Mes 2)

**Objetivo**: Independencia de APIs externas

- Deployer Ollama en server
- Pre-cargar Llama 3.3 8B
- Reemplazar GROQ fallback con local model
- Fine-tuning en datos históricos del usuario
- Benchmark: 95%+ accuracy, 0$ costo

### Fase 6: Comandos de Voz Adicionales (Mes 3)

**Nuevos comandos**:
- "¿Cuál es mi balance?" → Mostrar balances
- "Últimas transacciones" → Listar últimas
- "Gasto en Comida este mes" → Analítica
- "¿Cuánto me debe María?" → Balances compartidos

### Fase 7: Integración Asistentes (Mes 4)

- Siri (iOS)
- Google Assistant (Android)
- Alexa (Amazon)

### Fase 8: Modo Offline (Mes 5)

- Modo offline completo
- Sincronización cuando regresa internet
- Local database (SQLite)

### Fase 9: Machine Learning Avanzado (Mes 6+)

- Fine-tuning modelo local en datos usuario
- Detección de anomalías
- Predicción automática de categorías
- Análisis de patrones de gasto

---

## Resumen Ejecutivo

### ¿Por qué implementar esto?

1. **UX**: Feature moderna, similar a MonAi (trending)
2. **Velocidad**: Crear transacción en <10 segundos (vs 30-60s con formulario)
3. **Costo**: $0 mensual usando free tiers
4. **Aprendizaje**: Mejora continua con patrones de usuario
5. **Diferenciador**: Pocos apps de finanzas personales tienen esto

### Esfuerzo de Implementación

- **Backend**: 1-2 días (parsers + API)
- **Frontend**: 1-2 días (UI + hooks)
- **Testing**: 1 día
- **Total**: 5 días con un developer

### Impacto Esperado

- 📈 +20-30% más transacciones registradas
- 🚀 Mejor retención (feature viral)
- ⭐ Mejor reviews en app stores
- 💰 Preparación para monetización (upgrade a IA premium)

### Dependencias

- ✅ Backend funcionando (ya existe)
- ✅ Frontend funcionando (ya existe)
- ✅ Auth middleware (ya existe)
- ✅ APIs de transacciones (ya existen)
- ❌ Base de datos migrada (crear UserTransactionPattern)

---

## Referencias

- MonAi App: https://monai.app
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- Sugar.js Date Parsing: https://sugarjs.com/
- Currency.js: https://currency.js.org/
- GROQ API: https://groq.com/
- Ollama: https://ollama.ai/

---

**Documento actualizado**: 2025-11-10
**Preparado para implementación**: Después de probar la app actual
