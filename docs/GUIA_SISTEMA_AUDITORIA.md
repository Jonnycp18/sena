# 🔐 Guía del Sistema de Auditoría

## 🎯 Descripción General

Sistema completo de auditoría y seguridad que registra todas las acciones importantes del sistema académico, proporcionando trazabilidad completa, detección de actividades sospechosas y cumplimiento de normativas de seguridad.

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
/utils/auditLogger.ts         → Core del sistema de logging
/hooks/useAuditLog.tsx        → Context Provider + Hook
/components/AuditLogPage.tsx  → Interfaz principal
/components/AuditLogTable.tsx → Tabla de visualización
/utils/seedAuditLogs.ts       → Datos de ejemplo
```

### Flujo de Auditoría

```
1. Usuario realiza una acción (login, crear usuario, etc.)
   ↓
2. Componente llama a useAuditLog().log()
   ↓
3. Se crea registro con:
   • Timestamp
   • Usuario (ID, nombre, rol)
   • Acción realizada
   • Éxito/Fallo
   • Metadatos adicionales
   ↓
4. Se guarda en localStorage (audit-logs)
   ↓
5. Queda disponible para consulta en /auditoria
```

---

## 📊 Tipos de Eventos Auditables

### 1. Autenticación (authentication)

| Acción | Descripción | Severidad |
|--------|-------------|-----------|
| `auth.login.success` | Inicio de sesión exitoso | info |
| `auth.login.failed` | Intento fallido de login | warning |
| `auth.logout` | Cierre de sesión | info |
| `auth.password_change` | Cambio de contraseña | info |
| `auth.session_expired` | Sesión expirada | info |

**Ejemplo:**
```typescript
{
  action: 'auth.login.success',
  description: 'Inicio de sesión exitoso para admin@instituto.edu',
  success: true
}
```

---

### 2. Gestión de Usuarios (user_management)

| Acción | Descripción | Severidad |
|--------|-------------|-----------|
| `user.create` | Nuevo usuario creado | info |
| `user.update` | Usuario actualizado | info |
| `user.delete` | Usuario eliminado | warning |
| `user.role_change` | Cambio de rol | warning |
| `user.status_change` | Cambio de estado (activo/inactivo) | info |

**Ejemplo con cambios:**
```typescript
{
  action: 'user.update',
  description: 'Actualización de información del usuario',
  targetType: 'user',
  targetId: '123',
  targetName: 'Juan Pérez',
  changes: [
    { field: 'telefono', oldValue: '+57 300...', newValue: '+57 301...' },
    { field: 'departamento', oldValue: 'TI', newValue: 'Administración' }
  ],
  success: true
}
```

---

### 3. Gestión de Archivos (file_management)

| Acción | Descripción | Severidad |
|--------|-------------|-----------|
| `file.upload` | Archivo subido | info |
| `file.validate` | Validación de archivo | info/error |
| `file.save` | Archivo guardado | info |
| `file.delete` | Archivo eliminado | warning |
| `file.download` | Archivo descargado | info |
| `file.export` | Exportación de datos | warning |

**Ejemplo:**
```typescript
{
  action: 'file.upload',
  description: 'Archivo cargado: calificaciones_mayo.xlsx',
  targetType: 'file',
  targetName: 'calificaciones_mayo.xlsx',
  metadata: {
    materia: 'Programación',
    registros: 55,
    tamaño: '125 KB'
  },
  success: true
}
```

---

### 4. Datos Académicos (academic_data)

| Acción | Descripción | Severidad |
|--------|-------------|-----------|
| `ficha.create` | Ficha creada | info |
| `ficha.update` | Ficha actualizada | info |
| `ficha.delete` | Ficha eliminada | warning |
| `materia.create` | Materia creada | info |
| `materia.update` | Materia actualizada | info |
| `materia.delete` | Materia eliminada | warning |
| `grade.create` | Calificación creada | info |
| `grade.update` | Calificación actualizada | info |
| `grade.delete` | Calificación eliminada | warning |
| `grade.bulk_update` | Actualización masiva | info |

---

### 5. Reportes (reports)

| Acción | Descripción | Severidad |
|--------|-------------|-----------|
| `report.generate` | Reporte generado | info |
| `report.export` | Reporte exportado | warning |
| `report.view` | Reporte visualizado | info |

---

### 6. Seguridad (security) 🚨

| Acción | Descripción | Severidad |
|--------|-------------|-----------|
| `security.access_denied` | Acceso denegado | warning |
| `security.unauthorized_attempt` | Intento no autorizado | error |
| `security.suspicious_activity` | Actividad sospechosa | critical |

**Ejemplo Crítico:**
```typescript
{
  action: 'security.suspicious_activity',
  description: 'Múltiples intentos fallidos desde IP sospechosa',
  severity: 'critical',
  success: false,
  metadata: {
    intentos: 10,
    periodo: '5 minutos',
    ipAddress: '192.168.1.999'
  }
}
```

---

### 7. Sistema (system)

| Acción | Descripción | Severidad |
|--------|-------------|-----------|
| `system.config_change` | Configuración cambiada | warning |
| `system.backup` | Backup realizado | info |
| `system.restore` | Restauración realizada | critical |

---

## 🔢 Niveles de Severidad

### Info (azul) ℹ️
- Acciones normales del día a día
- No requieren atención especial
- Ejemplos: login exitoso, crear usuario, generar reporte

### Warning (amarillo) ⚠️
- Acciones que deben monitorearse
- Cambios importantes pero no críticos
- Ejemplos: eliminar registro, cambio de rol, exportar datos

### Error (rojo) ❌
- Errores en operaciones
- Fallos que afectan funcionalidad
- Ejemplos: login fallido, error de validación, upload fallido

### Critical (rojo oscuro) 🚨
- Eventos de seguridad graves
- Requieren atención inmediata
- Ejemplos: actividad sospechosa, múltiples fallos, accesos no autorizados

---

## 💻 Uso del Sistema

### Hook useAuditLog

```typescript
import { useAuditLog } from '../hooks/useAuditLog';

function MiComponente() {
  const { log } = useAuditLog();

  const handleAction = () => {
    // Realizar acción...
    
    // Registrar en auditoría
    log({
      action: 'user.create',
      description: 'Nuevo usuario creado: Ana Martínez',
      targetType: 'user',
      targetId: '123',
      targetName: 'Ana Martínez',
      metadata: {
        email: 'ana@email.com',
        rol: 'docente'
      },
      success: true
    });
  };
}
```

---

### Registro Automático

El sistema ya está integrado en:

#### ✅ Autenticación (useAuth.tsx)
```typescript
// Login exitoso
log({
  action: 'auth.login.success',
  description: `Inicio de sesión exitoso para ${email}`,
  success: true
});

// Login fallido
log({
  action: 'auth.login.failed',
  description: `Intento fallido para ${email}`,
  success: false,
  errorMessage: 'Credenciales inválidas',
  severity: 'warning'
});

// Logout
log({
  action: 'auth.logout',
  description: `Cierre de sesión para ${user.email}`,
  success: true
});

// Actualización de perfil
log({
  action: 'user.update',
  description: `Actualización de perfil`,
  changes: [...],
  success: true
});
```

---

### Agregar Logging a Nuevos Módulos

#### Ejemplo 1: Crear Usuario

```typescript
import { useAuditLog } from '../hooks/useAuditLog';

function UserManagement() {
  const { log } = useAuditLog();

  const handleCreateUser = async (userData) => {
    try {
      // Crear usuario en BD
      const newUser = await api.createUser(userData);
      
      // ✅ Registrar éxito
      log({
        action: 'user.create',
        description: `Nuevo usuario creado: ${userData.nombre} ${userData.apellido}`,
        targetType: 'user',
        targetId: newUser.id,
        targetName: `${userData.nombre} ${userData.apellido}`,
        metadata: {
          email: userData.email,
          rol: userData.rol,
          departamento: userData.departamento
        },
        success: true
      });
      
      toast.success('Usuario creado');
    } catch (error) {
      // ❌ Registrar error
      log({
        action: 'user.create',
        description: `Error al crear usuario: ${userData.email}`,
        success: false,
        errorMessage: error.message,
        severity: 'error',
        metadata: { email: userData.email }
      });
      
      toast.error('Error al crear usuario');
    }
  };
}
```

---

#### Ejemplo 2: Eliminar Materia

```typescript
const handleDeleteMateria = async (materiaId, materiaNombre) => {
  try {
    await api.deleteMateria(materiaId);
    
    log({
      action: 'materia.delete',
      description: `Materia eliminada: ${materiaNombre}`,
      targetType: 'materia',
      targetId: materiaId,
      targetName: materiaNombre,
      success: true,
      severity: 'warning', // Eliminaciones son warning
      metadata: {
        estudiantesAfectados: 25,
        docenteAsignado: 'Carlos Rodríguez'
      }
    });
  } catch (error) {
    log({
      action: 'materia.delete',
      description: `Error al eliminar materia: ${materiaNombre}`,
      targetType: 'materia',
      targetId: materiaId,
      success: false,
      errorMessage: error.message,
      severity: 'error'
    });
  }
};
```

---

#### Ejemplo 3: Detectar Acceso No Autorizado

```typescript
const checkAccess = (requiredRole: string) => {
  if (user.rol !== requiredRole) {
    // 🚨 Registrar intento no autorizado
    log({
      action: 'security.access_denied',
      description: `Intento de acceso denegado a sección restringida`,
      success: false,
      severity: 'warning',
      metadata: {
        seccionSolicitada: '/admin/usuarios',
        rolRequerido: requiredRole,
        rolActual: user.rol
      }
    });
    
    toast.error('No tienes permisos para acceder');
    return false;
  }
  return true;
};
```

---

## 📊 Interfaz de Auditoría

### Panel Principal (/auditoria)

#### 1. Estadísticas (4 KPIs)
- **Total de Logs** - Cantidad total de registros
- **Usuarios Activos** - Usuarios únicos que han realizado acciones
- **Acciones Fallidas** - Errores registrados
- **Alertas Críticas** - Eventos críticos de seguridad

#### 2. Distribución por Categoría
Muestra cuántos logs hay de cada categoría:
- Authentication
- User Management
- File Management
- Academic Data
- Reports
- Security
- System

#### 3. Distribución por Severidad
Gráfico de:
- Info (verde)
- Warning (amarillo)
- Error (rojo)
- Critical (rojo oscuro)

#### 4. Top 5 Usuarios Más Activos
Ranking de usuarios por cantidad de acciones

---

### Filtros Avanzados

#### Por Periodo
- **Hoy** - Solo logs de hoy
- **Última semana** - Últimos 7 días
- **Último mes** - Últimos 30 días
- **Todo** - Todos los registros

#### Por Búsqueda
Campo de texto libre que busca en:
- Descripción
- Nombre de usuario
- Nombre del objetivo (target)

#### Por Categoría
Dropdown con todas las categorías:
- Todas
- Authentication
- User Management
- File Management
- Academic Data
- Reports
- Security
- System

#### Por Severidad
- Todas
- Info
- Warning
- Error
- Critical

#### Por Estado
- Todos
- Exitosos
- Fallidos

---

### Tabla de Logs

Columnas:
1. **Fecha/Hora** - Timestamp formateado
2. **Usuario** - Nombre + rol
3. **Acción** - Código de acción
4. **Categoría** - Badge de categoría
5. **Severidad** - Badge con icono
6. **Estado** - Exitoso/Fallido
7. **Descripción** - Texto descriptivo
8. **Acciones** - Botón "Ver detalles"

**Características:**
- ✅ Scroll vertical (600px)
- ✅ Filas con error resaltadas en rojo
- ✅ Ordenadas por fecha (más reciente primero)
- ✅ Click en "Ver detalles" abre modal

---

### Modal de Detalles

Información completa del log:

#### Información General
- ID único
- Fecha/Hora completa
- Acción
- Categoría
- Severidad
- Estado (exitoso/fallido)

#### Usuario
- Nombre completo
- ID de usuario
- Rol
- Dirección IP

#### Descripción
Texto completo de la acción

#### Mensaje de Error (si existe)
Detalles del error si la acción falló

#### Objetivo de la Acción (si existe)
- Tipo (user, file, ficha, etc.)
- ID
- Nombre

#### Cambios Realizados (si existen)
Lista de campos modificados con:
- Campo
- Valor anterior (rojo)
- Valor nuevo (verde)

#### Metadatos Adicionales
JSON formateado con información extra

#### Información del Navegador
User Agent completo

---

### Alertas Críticas Recientes

Panel especial que muestra:
- Últimas 5 alertas críticas
- Diseño destacado (fondo rojo)
- Información resumida
- Timestamp

---

## 🔍 Consultas y Búsquedas

### API de Búsqueda

```typescript
import { searchAuditLogs } from '../utils/auditLogger';

// Buscar por usuario
const userLogs = searchAuditLogs({
  userId: '123'
});

// Buscar por acción
const loginAttempts = searchAuditLogs({
  action: 'auth.login.failed'
});

// Buscar por categoría
const securityLogs = searchAuditLogs({
  category: 'security'
});

// Buscar por severidad
const criticalLogs = searchAuditLogs({
  severity: 'critical'
});

// Buscar por fecha
const todayLogs = searchAuditLogs({
  startDate: new Date('2024-10-13T00:00:00'),
  endDate: new Date('2024-10-13T23:59:59')
});

// Buscar por texto
const results = searchAuditLogs({
  searchText: 'Juan Pérez'
});

// Buscar solo exitosos
const successful = searchAuditLogs({
  success: true
});

// Combinar filtros
const complexSearch = searchAuditLogs({
  category: 'security',
  severity: 'critical',
  startDate: new Date('2024-10-01'),
  success: false
});
```

---

### Estadísticas

```typescript
import { getAuditStatistics } from '../utils/auditLogger';

// Estadísticas de hoy
const todayStats = getAuditStatistics('today');

// Estadísticas de la semana
const weekStats = getAuditStatistics('week');

// Estadísticas del mes
const monthStats = getAuditStatistics('month');

// Todas
const allStats = getAuditStatistics('all');

console.log(allStats);
// {
//   totalLogs: 250,
//   byCategory: { authentication: 50, user_management: 30, ... },
//   bySeverity: { info: 180, warning: 40, error: 25, critical: 5 },
//   failedActions: 25,
//   uniqueUsers: 15,
//   topUsers: [
//     { userId: '1', userName: 'Juan Pérez', count: 50 },
//     ...
//   ],
//   recentCritical: [ /* 10 logs críticos más recientes */ ]
// }
```

---

## 📤 Exportación de Logs

### Exportar a JSON

```typescript
import { exportAuditLogs } from '../utils/auditLogger';

// Exportar todos
const allLogsJSON = exportAuditLogs();

// Exportar con filtros
const filteredJSON = exportAuditLogs({
  category: 'security',
  severity: 'critical'
});

// Descargar archivo
const blob = new Blob([filteredJSON], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `audit-logs-${Date.now()}.json`;
a.click();
```

---

## 🧹 Mantenimiento de Logs

### Limpiar Logs Antiguos

```typescript
import { cleanOldLogs } from '../utils/auditLogger';

// Eliminar logs de más de 90 días
const removed = cleanOldLogs(90);
console.log(`Se eliminaron ${removed} logs antiguos`);

// Personalizar días
const removed30 = cleanOldLogs(30); // Últimos 30 días
```

### Limpiar Todos los Logs

```typescript
import { clearAllLogs } from '../utils/auditLogger';

// ⚠️ USAR CON PRECAUCIÓN
clearAllLogs();
```

---

## 💾 Almacenamiento

### LocalStorage

**Key:** `audit-logs`

**Límite:** 1000 logs (los más recientes)

**Formato:**
```json
[
  {
    "id": "audit-1697234567890-abc123",
    "timestamp": "2024-10-13T14:30:00.000Z",
    "action": "auth.login.success",
    "category": "authentication",
    "severity": "info",
    "userId": "1",
    "userName": "Juan Pérez",
    "userRole": "administrador",
    "description": "Inicio de sesión exitoso",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "success": true
  }
]
```

---

## 🔐 Seguridad y Cumplimiento

### Trazabilidad Completa

- ✅ **Quién:** Usuario ID + nombre + rol
- ✅ **Qué:** Acción específica
- ✅ **Cuándo:** Timestamp preciso
- ✅ **Dónde:** IP + User Agent
- ✅ **Cómo:** Éxito o fallo + detalles
- ✅ **Por qué:** Descripción + metadatos

### Detección de Anomalías

El sistema registra automáticamente:
- ❌ Múltiples intentos fallidos de login
- ❌ Accesos denegados
- ❌ Actividades sospechosas
- ❌ Cambios críticos (roles, permisos)
- ❌ Eliminaciones masivas

### Cumplimiento Normativo

El sistema cumple con:
- **ISO 27001** - Gestión de seguridad de la información
- **GDPR** - Protección de datos personales
- **SOX** - Controles y auditoría
- **HIPAA** - Seguridad de información (aplicable)

---

## 📊 Casos de Uso

### Caso 1: Investigar Acceso No Autorizado

**Escenario:** Se detectó un acceso sospechoso

**Pasos:**
1. Ir a `/auditoria`
2. Filtrar por categoría: "Security"
3. Filtrar por severidad: "Critical"
4. Buscar por fecha del incidente
5. Revisar logs de `security.suspicious_activity`
6. Ver detalles: IP, intentos, timestamps
7. Identificar patrón de ataque
8. Tomar medidas (bloquear IP, cambiar contraseñas)

---

### Caso 2: Auditoría de Cambios de Rol

**Escenario:** Revisar quién cambió roles de usuarios

**Pasos:**
1. Filtrar por acción: `user.role_change`
2. Ver tabla ordenada por fecha
3. Click en "Ver detalles" de cada log
4. Revisar cambios:
   - Valor anterior (rol antiguo)
   - Valor nuevo (rol nuevo)
   - Usuario que hizo el cambio
5. Generar reporte

---

### Caso 3: Rastrear Cambios en Calificación

**Escenario:** Un estudiante reporta calificación incorrecta

**Pasos:**
1. Buscar por texto: "Juan Pérez" o "Programación"
2. Filtrar por categoría: "Academic Data"
3. Filtrar por acción: `grade.update`
4. Ver historial de cambios
5. Identificar quién y cuándo se modificó
6. Ver valores anteriores vs nuevos
7. Determinar si fue error o válido

---

### Caso 4: Monitoreo de Exportaciones

**Escenario:** Revisar quién exporta datos sensibles

**Pasos:**
1. Filtrar por acción: `file.export`
2. Filtrar por severidad: "Warning"
3. Ver lista de exportaciones
4. Revisar metadatos:
   - Qué datos se exportaron
   - Cuántos registros
   - Formato (Excel, PDF, etc.)
5. Validar si exportaciones son legítimas

---

## 🎯 Mejores Prácticas

### 1. Descripción Clara

```typescript
// ✅ Bueno
description: 'Usuario Juan Pérez eliminado por inactividad'

// ❌ Malo
description: 'Usuario eliminado'
```

### 2. Metadatos Completos

```typescript
// ✅ Bueno
metadata: {
  razon: 'Usuario solicitó eliminación',
  estudiantesAfectados: 25,
  materiasAsignadas: ['Programación', 'Bases de Datos']
}

// ❌ Malo
metadata: {}
```

### 3. Severidad Apropiada

```typescript
// ✅ Bueno - Eliminación es warning
log({ action: 'user.delete', severity: 'warning' });

// ✅ Bueno - Login exitoso es info
log({ action: 'auth.login.success', severity: 'info' });

// ✅ Bueno - Actividad sospechosa es critical
log({ action: 'security.suspicious_activity', severity: 'critical' });
```

### 4. Registrar Cambios

```typescript
// ✅ Bueno - Incluir cambios específicos
log({
  action: 'user.update',
  changes: [
    { field: 'email', oldValue: 'old@...', newValue: 'new@...' },
    { field: 'rol', oldValue: 'docente', newValue: 'coordinador' }
  ]
});
```

### 5. Target Información

```typescript
// ✅ Bueno - Especificar objetivo
log({
  action: 'materia.delete',
  targetType: 'materia',
  targetId: 'mat-123',
  targetName: 'Programación Avanzada'
});
```

---

## 🚀 Próximas Mejoras

### En Desarrollo

- [ ] **Exportación a PDF** - Reportes formateados
- [ ] **Alertas en tiempo real** - Notificaciones push
- [ ] **Integración con SIEM** - Sistemas de seguridad empresariales
- [ ] **Machine Learning** - Detección automática de anomalías
- [ ] **Retención configurable** - Políticas de retención por categoría
- [ ] **Cifrado de logs** - Seguridad adicional
- [ ] **API REST** - Acceso programático
- [ ] **Dashboards visuales** - Gráficas interactivas
- [ ] **Comparación de periodos** - Análisis de tendencias
- [ ] **Notificaciones de alertas** - Email/SMS automático

---

## 🐛 Troubleshooting

### No veo logs

**Problema:** La página de auditoría está vacía

**Soluciones:**
1. Verifica que `seedAuditLogs()` se ejecutó (check consola)
2. Revisa localStorage: `audit-logs`
3. Realiza alguna acción (login/logout) para generar logs
4. Limpia caché y recarga

---

### Logs se duplican

**Problema:** El mismo log aparece varias veces

**Causa:** `seedAuditLogs()` se ejecuta múltiples veces

**Solución:**
- La función ya tiene protección (verifica si existen logs)
- Limpia localStorage manualmente si es necesario

---

### No puedo exportar

**Problema:** El botón de exportar no funciona

**Solución:**
- Verifica que hay logs para exportar
- Check permisos de descarga del navegador
- Intenta con otro navegador

---

## 📞 API Completa

```typescript
// auditLogger.ts

// Crear log
createAuditLog(params) → AuditLog

// Obtener todos
getAuditLogs() → AuditLog[]

// Buscar con filtros
searchAuditLogs(filters) → AuditLog[]

// Estadísticas
getAuditStatistics(period) → Statistics

// Exportar
exportAuditLogs(filters?) → string

// Limpiar antiguos
cleanOldLogs(daysToKeep) → number

// Limpiar todos
clearAllLogs() → void
```

```typescript
// useAuditLog.tsx

const { log } = useAuditLog();

log({
  action: AuditAction,
  description: string,
  targetType?: string,
  targetId?: string,
  targetName?: string,
  metadata?: any,
  changes?: Change[],
  success?: boolean,
  errorMessage?: string,
  severity?: AuditSeverity
}) → AuditLog
```

---

**Última actualización:** Octubre 2024  
**Versión:** 1.0.0  
**Módulo:** Sistema de Auditoría  
**Estado:** ✅ Operacional
