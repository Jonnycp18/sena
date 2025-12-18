# 🔔 Guía del Sistema de Notificaciones

## 🎯 Descripción General

El Sistema de Notificaciones proporciona alertas en tiempo real sobre eventos importantes del sistema académico, incluyendo tareas no entregadas, cargas de archivos, cambios de usuarios y más.

---

## 🏗️ Arquitectura

### Componentes Principales

```
hooks/useNotifications.tsx        → Context Provider + Hook
components/NotificationBell.tsx   → Campana con badge en navbar
components/NotificationList.tsx   → Lista de notificaciones
components/NotificationItem.tsx   → Item individual
components/NotificationCenter.tsx → Página completa de notificaciones
```

### Flujo de Datos

```
1. Evento ocurre (ej: tarea no entregada)
   ↓
2. Se llama a addNotification()
   ↓
3. NotificationProvider actualiza el estado
   ↓
4. NotificationBell muestra badge actualizado
   ↓
5. Toast aparece en pantalla
   ↓
6. Notificación guardada en localStorage
```

---

## 📦 Tipos de Notificaciones

| Tipo | Color | Uso | Icono |
|------|-------|-----|-------|
| **info** | Azul | Información general | ℹ️ Info |
| **success** | Verde | Operaciones exitosas | ✅ CheckCircle |
| **warning** | Amarillo | Advertencias importantes | ⚠️ AlertCircle |
| **error** | Rojo | Errores del sistema | ❌ XCircle |
| **task** | Azul | Tareas/recordatorios | ⏰ Clock |

---

## 🔧 Uso del Sistema

### 1. Agregar Notificación

```tsx
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const { addNotification } = useNotifications();

  const handleEvent = () => {
    addNotification({
      tipo: 'warning',
      titulo: 'Tarea sin entregar',
      mensaje: 'Juan Pérez no entregó "Taller 3"',
      importante: true,
      accion: {
        label: 'Ver Detalles',
        url: '/carga-archivos'
      },
      metadatos: {
        estudiante: 'Juan Pérez',
        cedula: '12345678',
        materia: 'Programación',
        tarea: 'Taller 3'
      }
    });
  };
}
```

### 2. Leer Todas las Notificaciones

```tsx
const { notifications, unreadCount } = useNotifications();

console.log(`Tienes ${unreadCount} notificaciones sin leer`);
console.log('Todas:', notifications);
```

### 3. Marcar como Leída

```tsx
const { markAsRead, markAllAsRead } = useNotifications();

// Marcar una
markAsRead('notification-id');

// Marcar todas
markAllAsRead();
```

### 4. Eliminar Notificaciones

```tsx
const { deleteNotification, clearAll } = useNotifications();

// Eliminar una
deleteNotification('notification-id');

// Eliminar todas
clearAll();
```

---

## 🎨 Componentes UI

### NotificationBell

Campana con badge que aparece en el navbar.

**Props:**
- `onNavigateToCenter?: () => void` - Callback para ir al centro de notificaciones

**Características:**
- Badge con contador (hasta 99+)
- Popover con últimas 5 notificaciones
- Botón "Ver todas" para ir al centro completo

**Ejemplo:**
```tsx
<NotificationBell 
  onNavigateToCenter={() => setCurrentPage('/notificaciones')} 
/>
```

---

### NotificationList

Lista de notificaciones con filtros.

**Props:**
- `compact?: boolean` - Modo compacto (para popover)
- `maxItems?: number` - Máximo de items a mostrar
- `onViewAll?: () => void` - Callback para "Ver todas"
- `filter?: 'all' | 'unread' | 'important'` - Filtro aplicado

**Estados:**
- Sin notificaciones: Muestra mensaje placeholder
- Con notificaciones: Lista scrolleable
- Modo compacto: Altura limitada (h-96)

---

### NotificationItem

Item individual de notificación.

**Características:**
- Icono según tipo
- Badge "Importante" si aplica
- Indicador de no leída (punto azul)
- Metadatos (estudiante, materia, tarea)
- Tiempo relativo (ej: "hace 2 horas")
- Botón de acción (si existe)
- Botón para eliminar

**Interacciones:**
- Click: Marca como leída
- Botón acción: Navega a URL
- Botón eliminar: Borra notificación

---

### NotificationCenter

Página completa de gestión de notificaciones.

**Secciones:**

1. **Header con Acciones**
   - Marcar todas como leídas
   - Limpiar todo (con confirmación)

2. **Estadísticas (4 cards)**
   - Total de notificaciones
   - Sin leer
   - Importantes
   - Leídas

3. **Tabs de Filtrado**
   - Todas
   - Sin leer
   - Importantes

4. **Preferencias**
   - Configuración de qué notificaciones recibir
   - Estados activo/inactivo

---

## 🔄 Integración con Módulos

### Carga de Archivos

Cuando se detecta una tarea no entregada (valor "-" después de fecha límite):

```tsx
// En FileUploadManagement.tsx
if (valor === '-' && fechaLimitePasada) {
  addNotification({
    tipo: 'warning',
    titulo: 'Tarea sin entregar',
    mensaje: `${nombreEstudiante} no entregó "${nombreTarea}" después de la fecha límite`,
    importante: true,
    accion: {
      label: 'Ver Detalles',
      url: '/carga-archivos'
    },
    metadatos: {
      estudiante: nombreEstudiante,
      cedula: cedula,
      materia: nombreMateria,
      tarea: nombreTarea
    }
  });
}
```

### Gestión de Usuarios

Cuando se crea/modifica un usuario:

```tsx
// En UserManagement.tsx
addNotification({
  tipo: 'success',
  titulo: 'Usuario creado',
  mensaje: `El usuario "${nombre}" fue agregado como ${rol}`,
  importante: false
});
```

### Reportes

Cuando se genera un reporte:

```tsx
// En ReportsPage.tsx
addNotification({
  tipo: 'success',
  titulo: 'Reporte generado',
  mensaje: 'El reporte mensual está listo para descargar',
  importante: false,
  accion: {
    label: 'Descargar',
    url: '/reportes'
  }
});
```

---

## 💾 Persistencia

### LocalStorage

Las notificaciones se guardan automáticamente en `localStorage`:

**Key:** `academic-notifications`

**Formato:**
```json
[
  {
    "id": "notif-1234567890-abc123",
    "tipo": "warning",
    "titulo": "Tarea sin entregar",
    "mensaje": "...",
    "fecha": "2024-10-13T14:30:00.000Z",
    "leido": false,
    "importante": true,
    "accion": {...},
    "metadatos": {...}
  }
]
```

**Comportamiento:**
- Se carga al iniciar la aplicación
- Se guarda en cada cambio (agregar, marcar leída, eliminar)
- Si hay error de lectura, usa datos mock

---

## 🔊 Toasts

Cada notificación genera un **toast** (sonner) automáticamente:

```tsx
// Mapa de tipos a funciones de toast
const typeMap = {
  info: toast.info,
  success: toast.success,
  warning: toast.warning,
  error: toast.error,
  task: toast.warning
};

typeMap[notification.tipo](notification.titulo, {
  description: notification.mensaje,
  duration: 5000, // 5 segundos
});
```

**Posición:** Bottom-right (configurado en `<Toaster />`)

---

## 📊 Estadísticas

### Contador de No Leídas

```tsx
const { unreadCount } = useNotifications();
// unreadCount = cantidad de notificaciones con leido: false
```

### Filtrado

```tsx
// En NotificationList
let filteredNotifications = notifications;

if (filter === 'unread') {
  filteredNotifications = notifications.filter(n => !n.leido);
} else if (filter === 'important') {
  filteredNotifications = notifications.filter(n => n.importante);
}
```

---

## 🎯 Casos de Uso

### Caso 1: Tarea No Entregada

**Escenario:** Un docente carga calificaciones y 3 estudiantes tienen "-" (no entregaron)

**Flujo:**
1. Sistema detecta "-" con fecha límite pasada
2. Se crean 3 notificaciones (una por estudiante)
3. Badge muestra "3"
4. Se muestran 3 toasts
5. Coordinador ve las notificaciones
6. Click en "Ver Detalles" → Va a carga de archivos

**Código:**
```tsx
estudiantes.forEach(est => {
  if (est.tarea === '-' && fechaLimitePasada) {
    addNotification({
      tipo: 'warning',
      titulo: 'Tarea sin entregar',
      mensaje: `${est.nombre} no entregó "${nombreTarea}"`,
      importante: true,
      metadatos: {
        estudiante: est.nombre,
        cedula: est.cedula,
        materia: materia,
        tarea: nombreTarea
      }
    });
  }
});
```

---

### Caso 2: Carga Exitosa de Archivo

**Escenario:** Un docente sube un archivo Excel con 55 calificaciones

**Flujo:**
1. Archivo se procesa exitosamente
2. Se crea notificación de éxito
3. Badge incrementa en 1
4. Toast verde aparece
5. Usuario puede ver reporte

**Código:**
```tsx
addNotification({
  tipo: 'success',
  titulo: 'Carga exitosa',
  mensaje: `Se cargaron ${count} calificaciones para "${materia}"`,
  importante: false,
  accion: {
    label: 'Ver Reporte',
    url: '/reportes'
  },
  metadatos: {
    materia: materia
  }
});
```

---

### Caso 3: Error en Validación

**Escenario:** Un docente sube un archivo con errores

**Flujo:**
1. Sistema detecta errores de formato
2. Se crea notificación de error
3. Toast rojo aparece
4. Usuario puede revisar el archivo

**Código:**
```tsx
addNotification({
  tipo: 'error',
  titulo: 'Error en archivo',
  mensaje: `El archivo tiene ${errorCount} errores de formato`,
  importante: true,
  accion: {
    label: 'Revisar',
    url: '/carga-archivos'
  }
});
```

---

## 🔐 Permisos

### Por Rol

| Rol | Puede Ver Notificaciones |
|-----|--------------------------|
| **Administrador** | ✅ Todas las notificaciones del sistema |
| **Coordinador** | ✅ Notificaciones de su área |
| **Docente** | ✅ Solo notificaciones propias (cargas, errores) |

**Nota:** La lógica de filtrado por rol debe implementarse en el futuro.

---

## 🎨 Personalización

### Colores por Tipo

```css
/* Success */
--color-success: #22c55e;

/* Warning */
--color-warning: #f59e0b;

/* Error */
--color-error: #ef4444;

/* Info */
--color-info: #3b82f6;
```

### Iconos

Los iconos provienen de `lucide-react`:
- `Info`
- `CheckCircle`
- `AlertCircle`
- `XCircle`
- `Clock`

---

## 🚀 Próximas Funcionalidades

### En Desarrollo

- [ ] **Filtrado por rol** - Solo mostrar notificaciones relevantes
- [ ] **Notificaciones push** - Alertas del navegador
- [ ] **Sonido personalizado** - Audio al recibir notificación
- [ ] **Agrupamiento** - Agrupar notificaciones similares
- [ ] **Prioridades** - Sistema de prioridad (alta/media/baja)
- [ ] **Snooze** - Posponer notificación
- [ ] **Acciones rápidas** - Acciones directas desde notificación
- [ ] **Notificaciones programadas** - Enviar en horario específico
- [ ] **Integración email** - Enviar por correo también
- [ ] **Historial completo** - Ver notificaciones antiguas
- [ ] **Búsqueda** - Buscar en notificaciones
- [ ] **Exportación** - Exportar historial

---

## 📱 Responsive

### Desktop
- Popover completo con 5 notificaciones
- Página completa con todas las características
- Tabs horizontales

### Tablet
- Popover adaptado
- Cards en grid 2x2
- Navegación fluida

### Mobile
- Popover full-screen
- Cards apiladas (1 columna)
- Tabs scrolleables

---

## 🐛 Troubleshooting

### Problema: No veo el badge

**Causa:** No hay notificaciones sin leer

**Solución:** El badge solo aparece cuando `unreadCount > 0`

---

### Problema: Las notificaciones no persisten

**Causa:** localStorage no está disponible

**Solución:** Verifica que el navegador permita localStorage

---

### Problema: No aparece el toast

**Causa:** `<Toaster />` no está en el árbol de componentes

**Solución:** Verifica que `<Toaster />` esté en `App.tsx`

```tsx
<NotificationProvider>
  <AppContent />
  <Toaster /> {/* Debe estar aquí */}
</NotificationProvider>
```

---

## 📝 Mejores Prácticas

### 1. Títulos Concisos

```tsx
// ✅ Bueno
titulo: 'Tarea sin entregar'

// ❌ Malo
titulo: 'Se ha detectado que un estudiante no ha entregado la tarea asignada'
```

### 2. Mensajes Descriptivos

```tsx
// ✅ Bueno
mensaje: 'Juan Pérez no entregó "Taller 3 - Algoritmos" después de la fecha límite'

// ❌ Malo
mensaje: 'No entregado'
```

### 3. Usar Metadatos

```tsx
// ✅ Bueno
metadatos: {
  estudiante: 'Juan Pérez',
  cedula: '12345678',
  materia: 'Programación',
  tarea: 'Taller 3'
}

// ❌ Malo
metadatos: undefined
```

### 4. Acciones Relevantes

```tsx
// ✅ Bueno - Acción específica
accion: {
  label: 'Ver Detalles',
  url: '/carga-archivos'
}

// ❌ Malo - Acción genérica
accion: {
  label: 'OK',
  url: '/'
}
```

### 5. Importancia Correcta

```tsx
// ✅ Tareas no entregadas = Importante
importante: true

// ✅ Carga exitosa = No importante
importante: false
```

---

## 🔗 Referencias

- **Context API:** React Context para estado global
- **LocalStorage:** Persistencia del navegador
- **Sonner:** Librería de toasts
- **date-fns:** Formateo de fechas
- **Lucide React:** Iconos

---

## 📞 API del Hook

### `useNotifications()`

Retorna un objeto con:

```typescript
{
  notifications: Notification[],      // Array de todas las notificaciones
  unreadCount: number,                 // Cantidad de no leídas
  addNotification: (notif) => void,   // Agregar nueva
  markAsRead: (id) => void,           // Marcar como leída
  markAllAsRead: () => void,          // Marcar todas
  deleteNotification: (id) => void,   // Eliminar una
  clearAll: () => void                // Eliminar todas
}
```

### Interfaz `Notification`

```typescript
interface Notification {
  id: string;                    // ID único generado automáticamente
  tipo: NotificationType;        // 'info' | 'warning' | 'error' | 'success' | 'task'
  titulo: string;                // Título corto
  mensaje: string;               // Descripción detallada
  fecha: string;                 // ISO string generado automáticamente
  leido: boolean;                // Estado de lectura (auto: false)
  importante: boolean;           // Si requiere atención inmediata
  accion?: {                     // Botón de acción (opcional)
    label: string;
    url: string;
  };
  metadatos?: {                  // Información adicional (opcional)
    estudiante?: string;
    materia?: string;
    tarea?: string;
    cedula?: string;
  };
}
```

---

**Última actualización:** Octubre 2024  
**Versión:** 1.0.0  
**Módulo:** Sistema de Notificaciones  
**Estado:** ✅ Operacional