# 🔗 Guía de Integración: Notificaciones + Carga de Archivos

## 🎯 Descripción General

Sistema completo de notificaciones automáticas integrado con la carga de calificaciones, con alertas escalonadas según el número de faltas de cada estudiante.

---

## 🏗️ Arquitectura del Sistema

### Componentes del Sistema

```
/utils/notificationHelper.ts     → Lógica de conteo de faltas
/utils/uploadNotifications.ts    → Generador de notificaciones
/components/FileUploadManagement → Integración con carga
/hooks/useNotifications.tsx      → Context de notificaciones
```

### Flujo Completo

```
1. Docente carga archivo Excel
   ↓
2. Sistema procesa y detecta calificaciones
   ↓
3. Por cada estudiante con "-" (no entregó):
   a. Verifica si fecha límite pasó
   b. Registra la falta en localStorage
   c. Incrementa contador de faltas
   d. Evalúa si alcanzó umbral (3 o 5 faltas)
   ↓
4. Si alcanzó umbral → Envía notificaciones:
   • 3 faltas: Docente + Estudiante
   • 5 faltas: Coordinador + Estudiante
   ↓
5. Muestra toast y actualiza badge de notificaciones
   ↓
6. Guarda todas las notificaciones en localStorage
```

---

## 📊 Sistema de Conteo de Faltas

### Estructura de Datos

El sistema mantiene un registro por estudiante en `localStorage`:

```typescript
{
  "12345678": { // Cédula del estudiante
    cedula: "12345678",
    nombre: "Juan",
    apellido: "Pérez",
    email: "juan@estudiante.edu",
    faltas: 3, // Total acumulado
    ultimaActualizacion: "2024-10-13T14:30:00.000Z",
    materias: {
      "Fundamentos de Programación": {
        tareas: ["Taller 1", "Quiz 2", "Proyecto Final"],
        faltas: 3
      }
    }
  }
}
```

### Key en localStorage

- **Key:** `student-absences`
- **Persistencia:** Permanente hasta limpieza manual
- **Actualización:** Cada vez que se carga un archivo Excel

---

## 🔔 Niveles de Alerta

### Nivel 1: Sin Alerta (1-2 faltas)

**Condición:** Estudiante tiene 1 o 2 tareas no entregadas

**Acción:** 
- ✅ Se registra la falta
- ❌ No se envía notificación
- 📊 Se incluye en resumen de ausencias

**Mensaje en sistema:**
- Toast informativo: "X tareas marcadas como no entregadas"

---

### Nivel 2: Advertencia (3 faltas) ⚠️

**Condición:** Estudiante alcanza exactamente 3 faltas

**Destinatarios:**
1. **Docente** (notificación en sistema)
2. **Estudiante** (simulado por consola, en producción sería email)

**Notificación al Docente:**

```typescript
{
  tipo: 'warning',
  titulo: '⚠️ Alerta de Ausentismo - Juan Pérez',
  mensaje: 'El estudiante acumula 3 tareas no entregadas en Programación. Se recomienda contactarlo.',
  importante: true,
  accion: {
    label: 'Ver Detalles',
    url: '/carga-archivos'
  },
  metadatos: {
    estudiante: 'Juan Pérez',
    cedula: '12345678',
    materia: 'Programación',
    tipo: 'ausentismo',
    nivel: 'warning_3',
    faltas: '3'
  }
}
```

**Email Simulado al Estudiante:**

```
Asunto: Alerta: Tareas Pendientes
Mensaje: Hola Juan, tienes 3 tareas sin entregar en Programación. 
Por favor comunícate con tu docente.
```

---

### Nivel 3: Crítico (5 faltas) 🚨

**Condición:** Estudiante alcanza exactamente 5 faltas

**Destinatarios:**
1. **Coordinador** (notificación en sistema)
2. **Estudiante** (simulado por consola, email urgente)

**Notificación al Coordinador:**

```typescript
{
  tipo: 'error',
  titulo: '🚨 CRÍTICO: Ausentismo Alto - Juan Pérez',
  mensaje: 'El estudiante acumula 5 tareas no entregadas en Programación. Requiere intervención urgente.',
  importante: true,
  accion: {
    label: 'Intervenir Ahora',
    url: '/carga-archivos'
  },
  metadatos: {
    estudiante: 'Juan Pérez',
    cedula: '12345678',
    materia: 'Programación',
    tipo: 'ausentismo_critico',
    nivel: 'critical_5',
    faltas: '5'
  }
}
```

**Email Urgente al Estudiante:**

```
Asunto: 🚨 URGENTE: Situación Académica Crítica
Mensaje: Hola Juan, tienes 5 tareas sin entregar en Programación. 
Tu situación académica es crítica. El coordinador será notificado. 
Por favor contacta urgentemente a tu docente o coordinador.
```

---

## 📥 Tipos de Notificaciones de Carga

### 1. Carga Exitosa ✅

**Cuándo:** Archivo procesado sin errores

```typescript
notifySuccessfulUpload(
  'Fundamentos de Programación', // Materia
  55,                             // Total registros
  42,                             // Evidencias actualizadas
  addNotification
);
```

**Resultado:**
- Tipo: `success`
- Título: "✅ Carga Exitosa"
- Mensaje: "Se cargaron 55 registros y 42 calificaciones para 'Fundamentos de Programación'"
- Acción: "Ver Reporte" → `/reportes`

---

### 2. Error en Carga ❌

**Cuándo:** Archivo con errores de formato o validación

```typescript
notifyFailedUpload(
  'calificaciones.xlsx',  // Nombre archivo
  'Formato inválido',      // Mensaje error
  5,                       // Número de errores
  addNotification
);
```

**Resultado:**
- Tipo: `error`
- Título: "❌ Error en Carga de Archivo"
- Mensaje: "El archivo 'calificaciones.xlsx' tiene 5 error(es): Formato inválido"
- Importante: `true`
- Acción: "Revisar Archivo" → `/carga-archivos`

---

### 3. Advertencias ⚠️

**Cuándo:** Archivo procesado con advertencias (no crítico)

```typescript
notifyUploadWarnings(
  'calificaciones.xlsx',
  3,
  'Algunos estudiantes no encontrados',
  addNotification
);
```

**Resultado:**
- Tipo: `warning`
- Título: "⚠️ Advertencias en Carga"
- Mensaje: "El archivo generó 3 advertencia(s)"
- Importante: `false`

---

### 4. Resumen de Ausencias 📋

**Cuándo:** Hay tareas no entregadas en la carga

```typescript
notifyAbsenceSummary(
  'Fundamentos de Programación',
  12,  // Total no entregadas
  8,   // Estudiantes afectados
  addNotification
);
```

**Resultado:**
- Tipo: `warning`
- Título: "📋 Resumen de Tareas No Entregadas"
- Mensaje: "En Programación: 8 estudiante(s) con 12 tarea(s) sin entregar"
- Importante: `true` si hay más de 5 tareas

---

## 🔄 Proceso de Carga Completo

### Paso 1: Cargar Archivo Excel

```
Usuario → Arrastra/Selecciona archivo → Sistema procesa
```

**Validaciones:**
- ✅ Formato válido (`.xlsx`, `.xls`)
- ✅ Columnas requeridas presentes
- ✅ Datos de estudiantes válidos

**Notificación si falla:**
- ❌ Error de carga con detalles

---

### Paso 2: Mapeo de Columnas

```
Sistema → Auto-detecta columnas → Usuario confirma/ajusta
```

**Columnas detectadas:**
- Cédula
- Nombre
- Apellido
- Email (opcional)
- Evidencias (todas las demás)

---

### Paso 3: Configurar Fechas Límite

```
Usuario → Configura fecha para cada tarea → Guarda
```

**Importante:** 
- Las fechas determinan si se notifica o no
- Solo se notifica si fecha límite pasó
- Sin fecha = se asume que pasó

---

### Paso 4: Validar Datos

```
Sistema → Procesa cada fila → Valida calificaciones
```

**Calificaciones válidas:**
- `A` = Aprobó
- `D` = Desaprobó
- `-` = No entregó (genera notificación si pasó fecha)
- `(vacío)` = Pendiente

**Ejemplo de fila:**

| Cédula | Nombre | Taller 1 | Quiz 1 | Proyecto |
|--------|--------|----------|--------|----------|
| 12345678 | Juan | A | - | D |

**Resultado:**
- Taller 1: ✅ Aprobado
- Quiz 1: ⚠️ No entregó → **Registra falta**
- Proyecto: ❌ Desaprobado

---

### Paso 5: Procesar Ausentismo

```
Sistema → Por cada "-" con fecha pasada:
  1. Registra falta en localStorage
  2. Incrementa contador del estudiante
  3. Evalúa si alcanzó umbral (3 o 5)
  4. Envía notificaciones según nivel
```

**Ejemplo:**

```typescript
Juan Pérez:
  Falta anterior: 2
  Nueva falta: Quiz 1
  Total: 3 ← ALCANZA UMBRAL
  
  ↓
  
  Enviar notificación nivel warning_3
  → Docente + Estudiante
```

---

### Paso 6: Guardar Calificaciones

```
Usuario → Click "Guardar" → Sistema guarda en BD
```

**Notificaciones:**
- ✅ Carga exitosa con resumen
- 📊 Estadísticas guardadas
- 🔔 Badge actualizado

---

## 💻 Implementación Técnica

### Función Principal: `processAbsencesAndNotify`

```typescript
export function processAbsencesAndNotify(
  estudiantes: Array<{
    cedula: string;
    nombre: string;
    apellido: string;
    email?: string;
    evidencias: Array<{
      nombre: string;
      calificacion?: string;
      fechaLimite?: string;
    }>;
  }>,
  materia: string,
  addNotification: (notification: any) => void
): number // Retorna cantidad de notificaciones enviadas
```

**Uso en FileUploadManagement:**

```typescript
// Después de procesar el archivo Excel
const notificacionesEnviadas = processAbsencesAndNotify(
  processedData.map(est => ({
    cedula: est.cedula,
    nombre: est.nombre,
    apellido: est.apellido,
    email: est.email,
    evidencias: est.evidencias
  })),
  materiaNombre,
  addNotification
);

if (notificacionesEnviadas > 0) {
  toast.info(
    `🔔 Se enviaron ${notificacionesEnviadas} notificación(es) de alerta`,
    { duration: 6000 }
  );
}
```

---

## 📊 Estadísticas de Ausencias

### Obtener Contador Individual

```typescript
import { getStudentAbsenceCount } from '../utils/notificationHelper';

const faltas = getStudentAbsenceCount('12345678');
console.log(`Estudiante tiene ${faltas} faltas`);
```

---

### Obtener Detalles Completos

```typescript
import { getStudentAbsenceDetails } from '../utils/notificationHelper';

const details = getStudentAbsenceDetails('12345678');
if (details) {
  console.log(`${details.nombre} ${details.apellido}`);
  console.log(`Total faltas: ${details.faltas}`);
  console.log('Por materia:', details.materias);
}
```

---

### Estudiantes en Riesgo

```typescript
import { getStudentsWithAbsencesAbove } from '../utils/notificationHelper';

// Estudiantes con 3 o más faltas
const enRiesgo = getStudentsWithAbsencesAbove(3);

enRiesgo.forEach(student => {
  console.log(`${student.nombre}: ${student.faltas} faltas`);
});
```

---

### Estadísticas Generales

```typescript
import { getAbsenceStatistics } from '../utils/notificationHelper';

const stats = getAbsenceStatistics();

console.log('Total con ausencias:', stats.totalStudentsWithAbsences);
console.log('Con advertencia (3-4):', stats.studentsWithWarning);
console.log('Críticos (5+):', stats.studentsWithCritical);
console.log('Total ausencias:', stats.totalAbsences);
```

---

## 🧹 Limpieza de Datos

### Limpiar Faltas de un Estudiante

```typescript
import { clearStudentAbsences } from '../utils/notificationHelper';

// Cuando un estudiante recupera todas sus tareas
clearStudentAbsences('12345678');
```

---

## 🎯 Casos de Uso Completos

### Caso 1: Primera Falta

**Escenario:** Juan no entrega el Taller 1

**Flujo:**
1. Docente carga Excel con "-" en Taller 1
2. Sistema verifica fecha límite (pasada)
3. Registra falta #1 para Juan
4. No envía notificación (umbral: 3)
5. Incluye en resumen: "1 estudiante con 1 tarea sin entregar"

**Notificaciones:**
- 📋 Resumen de ausencias (informativo)

---

### Caso 2: Tercera Falta (Alerta)

**Escenario:** Juan no entrega Quiz 2 (ya tenía 2 faltas)

**Flujo:**
1. Docente carga Excel con "-" en Quiz 2
2. Sistema registra falta #3
3. Alcanza umbral → `warning_3`
4. Envía notificación al DOCENTE
5. Simula email al ESTUDIANTE

**Notificaciones:**
- ⚠️ Alerta al docente (importante)
- 📧 Email a estudiante (simulado)
- 📋 Resumen de ausencias

**Lo que ve el docente:**

```
🔔 Badge: +1 notificación

Título: ⚠️ Alerta de Ausentismo - Juan Pérez
Mensaje: El estudiante acumula 3 tareas no entregadas en Programación. 
         Se recomienda contactarlo.
Acción: [Ver Detalles]
```

---

### Caso 3: Quinta Falta (Crítico)

**Escenario:** Juan no entrega Proyecto Final (ya tenía 4 faltas)

**Flujo:**
1. Docente carga Excel con "-" en Proyecto
2. Sistema registra falta #5
3. Alcanza umbral crítico → `critical_5`
4. Envía notificación al COORDINADOR
5. Envía email URGENTE al ESTUDIANTE

**Notificaciones:**
- 🚨 Alerta crítica al coordinador (importante)
- 📧 Email urgente a estudiante (simulado)
- 📋 Resumen de ausencias

**Lo que ve el coordinador:**

```
🔔 Badge: +1 notificación (roja, importante)

Título: 🚨 CRÍTICO: Ausentismo Alto - Juan Pérez
Mensaje: El estudiante acumula 5 tareas no entregadas en Programación. 
         Requiere intervención urgente.
Acción: [Intervenir Ahora]
```

---

### Caso 4: Carga con Errores

**Escenario:** Archivo Excel tiene formato inválido

**Flujo:**
1. Usuario carga archivo mal formado
2. Sistema detecta errores en validación
3. Procesa parcialmente o rechaza
4. Envía notificación de error

**Notificaciones:**
- ❌ Error en carga (importante)
- 📝 Toast con detalle de errores

---

## 🔐 Permisos y Roles

### Quién recibe qué notificación

| Evento | Administrador | Coordinador | Docente | Estudiante |
|--------|---------------|-------------|---------|------------|
| **3 Faltas** | ✅ Ve notificación | ✅ Ve notificación | ✅ **Recibe notificación** | 📧 Email |
| **5 Faltas** | ✅ Ve notificación | ✅ **Recibe notificación** | ✅ Ve notificación | 📧 Email urgente |
| **Carga exitosa** | ✅ | ✅ | ✅ **Recibe** | ❌ |
| **Error de carga** | ✅ | ✅ | ✅ **Recibe** | ❌ |

---

## 🚀 Próximas Mejoras

### Integración con Email Real

Actualmente los emails son simulados (console.log). Para producción:

```typescript
// En uploadNotifications.ts
import { sendEmail } from '../services/emailService';

// Reemplazar console.log por:
await sendEmail({
  to: student.email,
  subject: 'Alerta: Tareas Pendientes',
  body: mensaje,
  priority: level === 'critical_5' ? 'high' : 'normal'
});
```

---

### Dashboard de Ausentismo

Crear un dashboard específico que muestre:

- 📊 Estudiantes con más faltas
- 📈 Tendencias de ausentismo
- 🚨 Alertas activas
- 📧 Historial de notificaciones enviadas

---

### Configuración Personalizable

Permitir configurar:

- Umbrales de alerta (actualmente 3 y 5)
- Destinatarios por nivel
- Plantillas de mensajes
- Frecuencia de recordatorios

---

### Integración con WhatsApp

Para notificaciones más efectivas:

```typescript
await sendWhatsApp({
  to: student.phone,
  message: `Tienes ${faltas} tareas pendientes en ${materia}. Contacta a tu docente.`
});
```

---

## 🐛 Troubleshooting

### No se envían notificaciones

**Problema:** Cargué archivo con "-" pero no veo notificaciones

**Causas posibles:**
1. ✅ Tipo de carga = "Configuración inicial" (no notifica)
2. ✅ Fecha límite no configurada o no pasó
3. ✅ Estudiante no alcanzó umbral (3 o 5 faltas)
4. ✅ Ya se notificó antes (no duplica)

**Solución:**
- Verifica tipo de carga (debe ser "Actualización")
- Configura fechas límite
- Revisa contador en localStorage: `student-absences`

---

### Notificaciones duplicadas

**Problema:** Recibo la misma notificación múltiples veces

**Causa:** Cargaste el mismo archivo varias veces

**Solución:**
- El sistema cuenta cada carga por separado
- Para resetear, limpia localStorage o usa función `clearStudentAbsences`

---

### Badge no actualiza

**Problema:** Envié notificación pero badge sigue igual

**Causa:** NotificationProvider no está montado

**Solución:**
- Verifica que `<NotificationProvider>` esté en App.tsx
- Reload página

---

## 📞 API Completa

### notificationHelper.ts

```typescript
// Registrar falta
registerStudentAbsence(cedula, nombre, apellido, materia, tarea, email?)
  → { shouldNotify, level, previousCount, newCount }

// Obtener contador
getStudentAbsenceCount(cedula) → number

// Obtener detalles
getStudentAbsenceDetails(cedula) → StudentAbsence | null

// Limpiar registro
clearStudentAbsences(cedula) → void

// Listar con umbral
getStudentsWithAbsencesAbove(threshold) → StudentAbsence[]

// Estadísticas
getAbsenceStatistics() → {
  totalStudentsWithAbsences,
  studentsWithWarning,
  studentsWithCritical,
  totalAbsences
}

// Generar mensaje
generateNotificationMessage(student, level) → string
```

---

### uploadNotifications.ts

```typescript
// Procesar ausencias
processAbsencesAndNotify(estudiantes, materia, addNotification) → number

// Carga exitosa
notifySuccessfulUpload(materia, totalRegistros, evidencias, addNotification)

// Error en carga
notifyFailedUpload(archivo, errorMensaje, errores, addNotification)

// Advertencias
notifyUploadWarnings(archivo, advertencias, mensaje, addNotification)

// Resumen
notifyAbsenceSummary(materia, totalNoEntregadas, estudiantes, addNotification)
```

---

**Última actualización:** Octubre 2024  
**Versión:** 1.0.0  
**Módulo:** Integración Notificaciones  
**Estado:** ✅ Operacional