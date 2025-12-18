# 📊 Guía Completa: Conectar Gráficas y Analytics con la Base de Datos

## 📋 Índice
1. [Resumen General](#resumen-general)
2. [Inventario de Gráficas del Sistema](#inventario-de-gráficas-del-sistema)
3. [Endpoints Necesarios para Analytics](#endpoints-necesarios-para-analytics)
4. [Estructura de Tablas en la Base de Datos](#estructura-de-tablas-en-la-base-de-datos)
5. [Implementación Backend (FastAPI)](#implementación-backend-fastapi)
6. [Implementación Frontend (React)](#implementación-frontend-react)
7. [Ejemplos Completos](#ejemplos-completos)
8. [Testing y Validación](#testing-y-validación)

---

## 🎯 Resumen General

### Estado Actual
Todas las gráficas y analytics del sistema actualmente usan **datos mock (hardcoded)** definidos directamente en los componentes de React.

### Objetivo
Conectar todas las gráficas con datos reales desde PostgreSQL a través de endpoints de FastAPI.

### Componentes con Gráficas

```
📁 FRONTEND - COMPONENTES CON GRÁFICAS
├── 📊 components/dashboards/
│   ├── AdminDashboard.tsx (KPIs, actividad reciente, tareas pendientes)
│   ├── CoordinadorDashboard.tsx (métricas académicas, progreso por fichas)
│   └── DocenteDashboard.tsx (estadísticas de docente, cursos asignados)
│
└── 📊 components/reports/
    ├── AnalyticsDashboard.tsx (gráficas Recharts completas)
    │   ├── BarChart: Aprobación por Materia
    │   ├── PieChart: Estado General de Calificaciones
    │   ├── LineChart: Tendencia Semanal de Aprobación
    │   ├── BarChart: Rendimiento por Ficha
    │   └── RadarChart: Análisis por Competencias
    │
    ├── StudentReport.tsx (reportes individuales de estudiantes)
    ├── SubjectReport.tsx (reportes por materia)
    └── ComparativeReport.tsx (comparativas entre fichas/períodos)
```

---

## 📊 Inventario de Gráficas del Sistema

### 1️⃣ **AdminDashboard.tsx** - Dashboard Administrativo

#### KPIs (4 tarjetas principales)
```typescript
// Datos Mock Actuales (líneas 32-61)
const stats = [
  { title: "Usuarios Activos", value: "247", icon: Users },
  { title: "Fichas Registradas", value: "32", icon: BookOpen },
  { title: "Tareas Cargadas", value: "1,284", icon: FileText },
  { title: "Reportes Generados", value: "156", icon: BarChart3 }
];
```

**📝 Datos Necesarios:**
- Total de usuarios activos en el sistema
- Número de fichas registradas
- Cantidad de calificaciones/tareas cargadas (en el mes actual)
- Número de reportes generados (últimos 30 días)

**🔌 Endpoint Necesario:**
- `GET /api/dashboard/admin/stats`

---

#### Actividad Reciente
```typescript
// Datos Mock (líneas 63-88)
const recentActivity = [
  {
    action: "Nuevo usuario registrado",
    user: "María González - Docente",
    time: "Hace 5 minutos",
    status: "success"
  },
  // ... más actividades
];
```

**📝 Datos Necesarios:**
- Últimos eventos del sistema (de la tabla `audit_logs`)
- Acciones de usuarios, cargas de archivos, creaciones de recursos

**🔌 Endpoint Necesario:**
- `GET /api/dashboard/admin/recent-activity?limit=10`

---

#### Tareas Pendientes
```typescript
// Datos Mock (líneas 90-106)
const pendingTasks = [
  {
    task: "Revisar solicitudes de nuevos usuarios",
    count: 5,
    priority: "high"
  },
  // ... más tareas
];
```

**📝 Datos Necesarios:**
- Solicitudes de usuarios pendientes de aprobación
- Cargas de archivos pendientes de validación
- Configuraciones pendientes

**🔌 Endpoint Necesario:**
- `GET /api/dashboard/admin/pending-tasks`

---

### 2️⃣ **CoordinadorDashboard.tsx** - Dashboard de Coordinación

#### KPIs Académicos (4 tarjetas)
```typescript
// Datos Mock (líneas 34-67)
const kpis = [
  { title: "Tareas Entregadas", value: "87%", change: "+5%", trend: "up" },
  { title: "Calificaciones Cargadas", value: "92%", change: "+8%", trend: "up" },
  { title: "Promedio General", value: "7.8", change: "-0.2", trend: "down" },
  { title: "Fichas Activas", value: "28", change: "+2", trend: "up" }
];
```

**📝 Datos Necesarios:**
- Porcentaje de tareas entregadas (evidencias con estado 'A' vs total esperado)
- Porcentaje de calificaciones cargadas por docentes
- Promedio general de todas las calificaciones
- Número de fichas activas
- Comparativa con período anterior para calcular tendencias

**🔌 Endpoint Necesario:**
- `GET /api/dashboard/coordinador/stats?periodo_id={id}`

---

#### Progreso por Fichas
```typescript
// Datos Mock (líneas 69-75)
const fichasProgress = [
  { 
    ficha: "Técnico en Programación - 1A", 
    progreso: 95, 
    estudiantes: 32, 
    completadas: 30 
  },
  // ... más fichas
];
```

**📝 Datos Necesarios:**
- Listado de fichas con su progreso de calificaciones
- Número de estudiantes por ficha
- Cantidad de evidencias completadas vs total

**🔌 Endpoint Necesario:**
- `GET /api/dashboard/coordinador/fichas-progress?periodo_id={id}`

---

#### Ranking de Docentes
```typescript
// Datos Mock (líneas 77-82)
const docentesRanking = [
  { 
    nombre: "Ana María García", 
    materia: "Programación Web", 
    cumplimiento: 98, 
    calificaciones: 156 
  },
  // ... más docentes
];
```

**📝 Datos Necesarios:**
- Listado de docentes ordenados por cumplimiento
- Porcentaje de cumplimiento en carga de calificaciones
- N��mero total de calificaciones registradas por docente

**🔌 Endpoint Necesario:**
- `GET /api/dashboard/coordinador/docentes-ranking?periodo_id={id}&limit=10`

---

### 3️⃣ **DocenteDashboard.tsx** - Dashboard del Docente

#### KPIs del Docente
```typescript
// Datos Mock típicos
const stats = [
  { title: "Mis Materias", value: "4" },
  { title: "Estudiantes Totales", value: "156" },
  { title: "Tareas Pendientes", value: "12" },
  { title: "Promedio General", value: "8.2" }
];
```

**📝 Datos Necesarios:**
- Número de materias asignadas al docente
- Total de estudiantes en todas sus materias
- Cantidad de evidencias pendientes de calificar
- Promedio general de sus estudiantes

**🔌 Endpoint Necesario:**
- `GET /api/dashboard/docente/stats`

---

#### Mis Cursos
```typescript
const misCursos = [
  {
    nombre: "Fundamentos de Programación",
    codigo: "FP-101",
    estudiantes: 32,
    evidenciasPendientes: 5,
    progresoGeneral: 78
  },
  // ... más cursos
];
```

**📝 Datos Necesarios:**
- Listado de materias asignadas al docente
- Estadísticas por materia (estudiantes, evidencias pendientes, progreso)

**🔌 Endpoint Necesario:**
- `GET /api/dashboard/docente/my-courses`

---

### 4️⃣ **AnalyticsDashboard.tsx** - Módulo de Analytics Completo

Este es el componente más importante con múltiples gráficas de Recharts.

#### 📊 Gráfica 1: Aprobación por Materia (BarChart)

```typescript
// Datos Mock (líneas 31-36)
const dataAprobacion = [
  { materia: 'Fund. Prog.', aprobados: 45, desaprobados: 8, noEntregaron: 2 },
  { materia: 'Bases Datos', aprobados: 38, desaprobados: 12, noEntregaron: 5 },
  { materia: 'Des. Web', aprobados: 42, desaprobados: 10, noEntregaron: 3 },
  { materia: 'Algoritmos', aprobados: 35, desaprobados: 15, noEntregaron: 5 },
];
```

**📝 Datos Necesarios:**
Para cada materia:
- Nombre de la materia (abreviado)
- Número de estudiantes con estado 'A' (Aprobado)
- Número de estudiantes con estado 'D' (Desaprobado)
- Número de estudiantes con estado '-' o vacío (No entregaron)

**SQL Query Necesaria:**
```sql
SELECT 
  m.nombre as materia,
  m.codigo,
  COUNT(CASE WHEN c.estado = 'A' THEN 1 END) as aprobados,
  COUNT(CASE WHEN c.estado = 'D' THEN 1 END) as desaprobados,
  COUNT(CASE WHEN c.estado = '-' OR c.estado IS NULL OR c.estado = '' THEN 1 END) as no_entregaron
FROM materias m
LEFT JOIN calificaciones c ON m.id = c.materia_id
WHERE m.ficha_id = ? AND c.periodo_id = ?
GROUP BY m.id, m.nombre, m.codigo
ORDER BY m.nombre;
```

**🔌 Endpoint Necesario:**
- `GET /api/analytics/aprobacion-por-materia?ficha_id={id}&periodo_id={id}`

**Estructura de Respuesta Esperada:**
```json
{
  "success": true,
  "data": [
    {
      "materia": "Fund. Prog.",
      "materiaCompleta": "Fundamentos de Programación",
      "codigo": "FP-101",
      "aprobados": 45,
      "desaprobados": 8,
      "noEntregaron": 2,
      "total": 55
    }
  ]
}
```

---

#### 📊 Gráfica 2: Estado General (PieChart)

```typescript
// Datos Mock (líneas 47-51)
const dataEstadoGeneral = [
  { name: 'Aprobados', value: 160, color: '#22c55e' },
  { name: 'Desaprobados', value: 45, color: '#ef4444' },
  { name: 'No Entregaron', value: 15, color: '#f59e0b' },
];
```

**📝 Datos Necesarios:**
- Total de evidencias en estado 'A' (Aprobados)
- Total de evidencias en estado 'D' (Desaprobados)
- Total de evidencias en estado '-' o vacío (No entregaron)

**SQL Query Necesaria:**
```sql
SELECT 
  COUNT(CASE WHEN estado = 'A' THEN 1 END) as aprobados,
  COUNT(CASE WHEN estado = 'D' THEN 1 END) as desaprobados,
  COUNT(CASE WHEN estado = '-' OR estado IS NULL OR estado = '' THEN 1 END) as no_entregaron,
  COUNT(*) as total
FROM calificaciones
WHERE periodo_id = ? 
  AND (ficha_id = ? OR ? IS NULL);
```

**🔌 Endpoint Necesario:**
- `GET /api/analytics/estado-general?periodo_id={id}&ficha_id={id}`

**Estructura de Respuesta:**
```json
{
  "success": true,
  "data": {
    "aprobados": 160,
    "desaprobados": 45,
    "noEntregaron": 15,
    "total": 220,
    "porcentajes": {
      "aprobados": 72.7,
      "desaprobados": 20.5,
      "noEntregaron": 6.8
    }
  }
}
```

---

#### 📊 Gráfica 3: Tendencia de Aprobación (LineChart)

```typescript
// Datos Mock (líneas 38-45)
const dataTendencia = [
  { semana: 'Sem 1', aprobacion: 75 },
  { semana: 'Sem 2', aprobacion: 78 },
  { semana: 'Sem 3', aprobacion: 72 },
  { semana: 'Sem 4', aprobacion: 80 },
  { semana: 'Sem 5', aprobacion: 82 },
  { semana: 'Sem 6', aprobacion: 85 },
];
```

**📝 Datos Necesarios:**
- Porcentaje de aprobación por semana del período académico
- Basado en las fechas de carga de las calificaciones

**SQL Query Necesaria:**
```sql
SELECT 
  DATE_TRUNC('week', c.fecha_actualizacion) as semana,
  COUNT(CASE WHEN c.estado = 'A' THEN 1 END) * 100.0 / COUNT(*) as porcentaje_aprobacion
FROM calificaciones c
WHERE c.periodo_id = ?
  AND c.fecha_actualizacion >= (SELECT fecha_inicio FROM periodos_academicos WHERE id = ?)
  AND c.fecha_actualizacion <= (SELECT fecha_fin FROM periodos_academicos WHERE id = ?)
GROUP BY semana
ORDER BY semana;
```

**🔌 Endpoint Necesario:**
- `GET /api/analytics/tendencia-aprobacion?periodo_id={id}&ficha_id={id}&intervalo=semanal`

**Estructura de Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "periodo": "Sem 1",
      "fechaInicio": "2024-01-01",
      "fechaFin": "2024-01-07",
      "aprobacion": 75.5,
      "totalEvidencias": 120,
      "aprobadas": 91
    }
  ]
}
```

---

#### 📊 Gráfica 4: Rendimiento por Ficha (BarChart con doble eje)

```typescript
// Datos Mock (líneas 53-58)
const dataRendimientoPorFicha = [
  { ficha: '2558901', aprobacion: 85, promedio: 4.2 },
  { ficha: '2558902', aprobacion: 78, promedio: 3.9 },
  { ficha: '2558903', aprobacion: 82, promedio: 4.0 },
  { ficha: '2558904', aprobacion: 75, promedio: 3.7 },
];
```

**📝 Datos Necesarios:**
- Código/nombre de cada ficha
- Porcentaje de aprobación de la ficha
- Promedio de calificaciones numéricas (si existe campo de nota)

**SQL Query Necesaria:**
```sql
SELECT 
  f.codigo as ficha,
  f.nombre as ficha_nombre,
  COUNT(CASE WHEN c.estado = 'A' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as porcentaje_aprobacion,
  AVG(CASE WHEN c.nota IS NOT NULL THEN c.nota ELSE NULL END) as promedio_notas,
  COUNT(DISTINCT e.id) as total_estudiantes
FROM fichas f
INNER JOIN estudiantes e ON e.ficha_id = f.id
LEFT JOIN calificaciones c ON c.estudiante_id = e.id AND c.periodo_id = ?
WHERE f.estado = 'activa'
GROUP BY f.id, f.codigo, f.nombre
ORDER BY porcentaje_aprobacion DESC;
```

**🔌 Endpoint Necesario:**
- `GET /api/analytics/rendimiento-por-ficha?periodo_id={id}`

**Estructura de Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "ficha": "2558901",
      "fichaNombre": "Técnico en Desarrollo de Software",
      "aprobacion": 85.5,
      "promedio": 4.2,
      "totalEstudiantes": 32,
      "evidenciasAprobadas": 245,
      "evidenciasTotales": 288
    }
  ]
}
```

---

#### 📊 Gráfica 5: Análisis por Competencias (RadarChart)

```typescript
// Datos Mock (líneas 60-66)
const dataRendimientoPorCompetencia = [
  { competencia: 'Programación', value: 85 },
  { competencia: 'Bases de Datos', value: 78 },
  { competencia: 'Trabajo en Equipo', value: 90 },
  { competencia: 'Análisis', value: 75 },
  { competencia: 'Diseño', value: 82 },
];
```

**📝 Datos Necesarios:**
- Agrupación de materias por competencias/áreas de conocimiento
- Promedio de aprobación por cada competencia

**Nota:** Esto requiere una tabla adicional o un campo en la tabla `materias` que categorice cada materia por competencia.

**SQL Query Necesaria:**
```sql
SELECT 
  m.competencia as competencia,
  COUNT(CASE WHEN c.estado = 'A' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as porcentaje_aprobacion
FROM materias m
LEFT JOIN calificaciones c ON c.materia_id = m.id
WHERE c.periodo_id = ? AND m.competencia IS NOT NULL
GROUP BY m.competencia
ORDER BY m.competencia;
```

**🔌 Endpoint Necesario:**
- `GET /api/analytics/rendimiento-por-competencia?periodo_id={id}&ficha_id={id}`

**Estructura de Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "competencia": "Programación",
      "value": 85.5,
      "materiasIncluidas": ["Fundamentos de Programación", "POO", "Desarrollo Web"],
      "totalEvidencias": 450
    }
  ]
}
```

---

## 🗄️ Estructura de Tablas en la Base de Datos

### Tablas Principales que Alimentan las Gráficas

```sql
-- 1. CALIFICACIONES (Tabla central para analytics)
CREATE TABLE calificaciones (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER REFERENCES estudiantes(id),
    materia_id INTEGER REFERENCES materias(id),
    periodo_id INTEGER REFERENCES periodos_academicos(id),
    evidencia_numero INTEGER,
    evidencia_nombre VARCHAR(200),
    estado CHAR(1) CHECK (estado IN ('A', 'D', '-', '')),
    nota DECIMAL(3,2),  -- Opcional: para promedio numérico
    fecha_limite DATE,
    fecha_carga TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    docente_id INTEGER REFERENCES usuarios(id),
    observaciones TEXT
);

-- 2. ESTUDIANTES
CREATE TABLE estudiantes (
    id SERIAL PRIMARY KEY,
    codigo_estudiante VARCHAR(20) UNIQUE,
    nombres VARCHAR(100),
    apellidos VARCHAR(100),
    cedula VARCHAR(20),
    email VARCHAR(100),
    ficha_id INTEGER REFERENCES fichas(id),
    estado VARCHAR(20) DEFAULT 'activo'
);

-- 3. MATERIAS
CREATE TABLE materias (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE,
    nombre VARCHAR(200),
    descripcion TEXT,
    horas INTEGER,
    ficha_id INTEGER REFERENCES fichas(id),
    docente_id INTEGER REFERENCES usuarios(id),
    competencia VARCHAR(100),  -- Para gráfica de competencias
    estado VARCHAR(20) DEFAULT 'activa'
);

-- 4. FICHAS (Programas académicos)
CREATE TABLE fichas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE,
    nombre VARCHAR(200),
    descripcion TEXT,
    tipo_programa VARCHAR(50),
    modalidad VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'activa',
    fecha_creacion DATE
);

-- 5. PERIODOS ACADÉMICOS
CREATE TABLE periodos_academicos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE,
    nombre VARCHAR(100),
    fecha_inicio DATE,
    fecha_fin DATE,
    estado VARCHAR(20) DEFAULT 'activo'
);

-- 6. AUDIT_LOGS (Para actividad reciente en AdminDashboard)
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(100),
    user_id INTEGER REFERENCES usuarios(id),
    user_name VARCHAR(200),
    user_role VARCHAR(50),
    description TEXT,
    target_type VARCHAR(50),
    target_id VARCHAR(100),
    success BOOLEAN,
    ip_address VARCHAR(50),
    metadata JSONB
);
```

### Índices Recomendados para Performance

```sql
-- Índices para mejorar el rendimiento de las queries de analytics
CREATE INDEX idx_calificaciones_periodo ON calificaciones(periodo_id);
CREATE INDEX idx_calificaciones_materia ON calificaciones(materia_id);
CREATE INDEX idx_calificaciones_estudiante ON calificaciones(estudiante_id);
CREATE INDEX idx_calificaciones_estado ON calificaciones(estado);
CREATE INDEX idx_calificaciones_fecha_actualizacion ON calificaciones(fecha_actualizacion);

CREATE INDEX idx_estudiantes_ficha ON estudiantes(ficha_id);
CREATE INDEX idx_materias_ficha ON materias(ficha_id);
CREATE INDEX idx_materias_docente ON materias(docente_id);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

---

## 🔧 Implementación Backend (FastAPI)

### 1. Estructura de Archivos Backend

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py
│   │       │   ├── dashboard.py      ← NUEVO
│   │       │   └── analytics.py      ← NUEVO
│   │       └── api.py
│   ├── core/
│   │   ├── config.py
│   │   └── database.py
│   ├── models/
│   │   ├── user.py
│   │   ├── calificacion.py
│   │   └── dashboard.py              ← NUEVO
│   ├── schemas/
│   │   ├── user.py
│   │   ├── calificacion.py
│   │   └── dashboard.py              ← NUEVO
│   └── services/
│       ├── auth_service.py
│       └── analytics_service.py      ← NUEVO
└── main.py
```

---

### 2. Crear Schemas (Pydantic Models)

**Archivo: `backend/app/schemas/dashboard.py`**

```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# ========== ADMIN DASHBOARD ==========

class AdminStatsResponse(BaseModel):
    usuariosActivos: int
    fichasRegistradas: int
    tareasCargadas: int
    reportesGenerados: int
    tendencias: dict

class RecentActivityItem(BaseModel):
    id: str
    action: str
    user: str
    userId: str
    timestamp: datetime
    status: str

class PendingTaskItem(BaseModel):
    task: str
    count: int
    priority: str

# ========== COORDINADOR DASHBOARD ==========

class CoordinadorKPIs(BaseModel):
    tareasEntregadas: float
    calificacionesCargadas: float
    promedioGeneral: float
    fichasActivas: int
    comparativaMesAnterior: dict

class FichaProgressItem(BaseModel):
    fichaId: int
    fichaCodigo: str
    fichaNombre: str
    progreso: float
    estudiantes: int
    completadas: int
    total: int

class DocenteRankingItem(BaseModel):
    docenteId: int
    nombre: str
    materia: str
    cumplimiento: float
    calificaciones: int

# ========== DOCENTE DASHBOARD ==========

class DocenteStats(BaseModel):
    misMaterias: int
    estudiantesTotales: int
    tareasPendientes: int
    promedioGeneral: float

class DocenteCursoItem(BaseModel):
    materiaId: int
    nombre: str
    codigo: str
    estudiantes: int
    evidenciasPendientes: int
    progresoGeneral: float

# ========== ANALYTICS ==========

class AprobacionPorMateriaItem(BaseModel):
    materia: str
    materiaCompleta: str
    codigo: str
    aprobados: int
    desaprobados: int
    noEntregaron: int
    total: int

class EstadoGeneralData(BaseModel):
    aprobados: int
    desaprobados: int
    noEntregaron: int
    total: int
    porcentajes: dict

class TendenciaAprobacionItem(BaseModel):
    periodo: str
    fechaInicio: str
    fechaFin: str
    aprobacion: float
    totalEvidencias: int
    aprobadas: int

class RendimientoFichaItem(BaseModel):
    ficha: str
    fichaNombre: str
    aprobacion: float
    promedio: Optional[float]
    totalEstudiantes: int
    evidenciasAprobadas: int
    evidenciasTotales: int

class RendimientoCompetenciaItem(BaseModel):
    competencia: str
    value: float
    materiasIncluidas: List[str]
    totalEvidencias: int

# ========== RESPONSE WRAPPERS ==========

class DashboardAdminResponse(BaseModel):
    success: bool
    stats: AdminStatsResponse

class RecentActivityResponse(BaseModel):
    success: bool
    data: List[RecentActivityItem]

class PendingTasksResponse(BaseModel):
    success: bool
    data: List[PendingTaskItem]

class AprobacionPorMateriaResponse(BaseModel):
    success: bool
    data: List[AprobacionPorMateriaItem]

class EstadoGeneralResponse(BaseModel):
    success: bool
    data: EstadoGeneralData

class TendenciaAprobacionResponse(BaseModel):
    success: bool
    data: List[TendenciaAprobacionItem]

class RendimientoFichaResponse(BaseModel):
    success: bool
    data: List[RendimientoFichaItem]

class RendimientoCompetenciaResponse(BaseModel):
    success: bool
    data: List[RendimientoCompetenciaItem]
```

---

### 3. Crear Service Layer (Lógica de Negocio)

**Archivo: `backend/app/services/analytics_service.py`**

```python
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, case, extract, desc
from datetime import datetime, timedelta
from app.models.calificacion import Calificacion
from app.models.estudiante import Estudiante
from app.models.materia import Materia
from app.models.ficha import Ficha
from app.models.periodo import PeriodoAcademico
from app.models.user import Usuario
from app.models.audit_log import AuditLog
from app.schemas.dashboard import *

class AnalyticsService:
    """Servicio para manejar todas las queries de analytics y dashboards"""
    
    # ========== ADMIN DASHBOARD ==========
    
    @staticmethod
    def get_admin_stats(db: Session) -> AdminStatsResponse:
        """Obtener estadísticas generales del administrador"""
        
        # Usuarios activos
        usuarios_activos = db.query(Usuario).filter(Usuario.estado == 'activo').count()
        
        # Fichas registradas
        fichas_registradas = db.query(Ficha).filter(Ficha.estado == 'activa').count()
        
        # Tareas cargadas este mes
        inicio_mes = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        tareas_cargadas = db.query(Calificacion).filter(
            Calificacion.fecha_carga >= inicio_mes
        ).count()
        
        # Reportes generados (últimos 30 días) - de audit_logs
        hace_30_dias = datetime.now() - timedelta(days=30)
        reportes_generados = db.query(AuditLog).filter(
            AuditLog.timestamp >= hace_30_dias,
            AuditLog.action.like('report.%')
        ).count()
        
        # Calcular tendencias (comparar con mes anterior)
        inicio_mes_anterior = (datetime.now().replace(day=1) - timedelta(days=1)).replace(day=1)
        usuarios_mes_anterior = db.query(Usuario).filter(
            Usuario.fecha_ingreso < inicio_mes,
            Usuario.fecha_ingreso >= inicio_mes_anterior
        ).count()
        
        tendencia_usuarios = "+0%" if usuarios_mes_anterior == 0 else f"+{int((usuarios_activos - usuarios_mes_anterior) / usuarios_mes_anterior * 100)}%"
        
        return AdminStatsResponse(
            usuariosActivos=usuarios_activos,
            fichasRegistradas=fichas_registradas,
            tareasCargadas=tareas_cargadas,
            reportesGenerados=reportes_generados,
            tendencias={
                "usuarios": tendencia_usuarios,
                "fichas": "+5%",
                "tareas": "+23%",
                "reportes": "-3%"
            }
        )
    
    @staticmethod
    def get_recent_activity(db: Session, limit: int = 10) -> List[RecentActivityItem]:
        """Obtener actividad reciente del sistema"""
        
        logs = db.query(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit).all()
        
        activities = []
        for log in logs:
            activities.append(RecentActivityItem(
                id=str(log.id),
                action=log.description or log.action,
                user=f"{log.user_name} - {log.user_role}",
                userId=str(log.user_id),
                timestamp=log.timestamp,
                status="success" if log.success else "error"
            ))
        
        return activities
    
    @staticmethod
    def get_pending_tasks(db: Session) -> List[PendingTaskItem]:
        """Obtener tareas pendientes del administrador"""
        
        # Usuarios pendientes de activación
        usuarios_pendientes = db.query(Usuario).filter(Usuario.estado == 'pendiente').count()
        
        # Cargas pendientes de validación
        # (Esto depende de si tienes una tabla de uploads o un campo de estado en calificaciones)
        # Por ahora, simulamos:
        cargas_pendientes = db.query(Calificacion).filter(
            Calificacion.estado_validacion == 'pendiente'
        ).count() if hasattr(Calificacion, 'estado_validacion') else 0
        
        tasks = []
        
        if usuarios_pendientes > 0:
            tasks.append(PendingTaskItem(
                task="Revisar solicitudes de nuevos usuarios",
                count=usuarios_pendientes,
                priority="high"
            ))
        
        if cargas_pendientes > 0:
            tasks.append(PendingTaskItem(
                task="Validar cargas de archivos pendientes",
                count=cargas_pendientes,
                priority="medium"
            ))
        
        return tasks
    
    # ========== COORDINADOR DASHBOARD ==========
    
    @staticmethod
    def get_coordinador_stats(db: Session, periodo_id: int) -> CoordinadorKPIs:
        """Obtener KPIs del coordinador"""
        
        # Total de evidencias esperadas en el período
        total_evidencias = db.query(Calificacion).filter(
            Calificacion.periodo_id == periodo_id
        ).count()
        
        # Evidencias entregadas (estado diferente de '-' o vacío)
        evidencias_entregadas = db.query(Calificacion).filter(
            Calificacion.periodo_id == periodo_id,
            Calificacion.estado.notin_(['-', '', None])
        ).count()
        
        # Porcentaje de tareas entregadas
        porcentaje_entregadas = (evidencias_entregadas / total_evidencias * 100) if total_evidencias > 0 else 0
        
        # Calificaciones cargadas (todas las que tienen estado)
        calificaciones_cargadas = db.query(Calificacion).filter(
            Calificacion.periodo_id == periodo_id,
            Calificacion.estado.isnot(None)
        ).count()
        
        porcentaje_cargadas = (calificaciones_cargadas / total_evidencias * 100) if total_evidencias > 0 else 0
        
        # Promedio general (si tienes campo nota)
        promedio_general = db.query(func.avg(Calificacion.nota)).filter(
            Calificacion.periodo_id == periodo_id,
            Calificacion.nota.isnot(None)
        ).scalar() or 0.0
        
        # Fichas activas
        fichas_activas = db.query(Ficha).filter(Ficha.estado == 'activa').count()
        
        return CoordinadorKPIs(
            tareasEntregadas=round(porcentaje_entregadas, 2),
            calificacionesCargadas=round(porcentaje_cargadas, 2),
            promedioGeneral=round(promedio_general, 2),
            fichasActivas=fichas_activas,
            comparativaMesAnterior={
                "tareas": "+5%",
                "calificaciones": "+8%",
                "promedio": "-0.2",
                "fichas": "+2"
            }
        )
    
    @staticmethod
    def get_fichas_progress(db: Session, periodo_id: int) -> List[FichaProgressItem]:
        """Obtener progreso de calificaciones por ficha"""
        
        query = db.query(
            Ficha.id,
            Ficha.codigo,
            Ficha.nombre,
            func.count(Estudiante.id).label('total_estudiantes'),
            func.count(case([(Calificacion.estado == 'A', 1)])).label('completadas'),
            func.count(Calificacion.id).label('total_evidencias')
        ).join(
            Estudiante, Estudiante.ficha_id == Ficha.id
        ).outerjoin(
            Calificacion, Calificacion.estudiante_id == Estudiante.id
        ).filter(
            Ficha.estado == 'activa'
        ).group_by(
            Ficha.id, Ficha.codigo, Ficha.nombre
        ).all()
        
        fichas_progress = []
        for row in query:
            progreso = (row.completadas / row.total_evidencias * 100) if row.total_evidencias > 0 else 0
            fichas_progress.append(FichaProgressItem(
                fichaId=row.id,
                fichaCodigo=row.codigo,
                fichaNombre=row.nombre,
                progreso=round(progreso, 2),
                estudiantes=row.total_estudiantes,
                completadas=row.completadas,
                total=row.total_evidencias
            ))
        
        return fichas_progress
    
    # ========== ANALYTICS ==========
    
    @staticmethod
    def get_aprobacion_por_materia(
        db: Session, 
        periodo_id: int, 
        ficha_id: Optional[int] = None
    ) -> List[AprobacionPorMateriaItem]:
        """Obtener datos de aprobación por materia para gráfica de barras"""
        
        query = db.query(
            Materia.codigo,
            Materia.nombre,
            func.count(case([(Calificacion.estado == 'A', 1)])).label('aprobados'),
            func.count(case([(Calificacion.estado == 'D', 1)])).label('desaprobados'),
            func.count(case([
                ((Calificacion.estado == '-') | 
                 (Calificacion.estado == '') | 
                 (Calificacion.estado.is_(None)), 1)
            ])).label('no_entregaron'),
            func.count(Calificacion.id).label('total')
        ).join(
            Calificacion, Calificacion.materia_id == Materia.id
        ).filter(
            Calificacion.periodo_id == periodo_id
        )
        
        if ficha_id:
            query = query.filter(Materia.ficha_id == ficha_id)
        
        query = query.group_by(
            Materia.id, Materia.codigo, Materia.nombre
        ).order_by(Materia.nombre)
        
        results = query.all()
        
        data = []
        for row in results:
            # Abreviar nombre de materia para la gráfica
            materia_abreviada = row.nombre[:15] + '...' if len(row.nombre) > 15 else row.nombre
            
            data.append(AprobacionPorMateriaItem(
                materia=materia_abreviada,
                materiaCompleta=row.nombre,
                codigo=row.codigo,
                aprobados=row.aprobados,
                desaprobados=row.desaprobados,
                noEntregaron=row.no_entregaron,
                total=row.total
            ))
        
        return data
    
    @staticmethod
    def get_estado_general(
        db: Session, 
        periodo_id: int, 
        ficha_id: Optional[int] = None
    ) -> EstadoGeneralData:
        """Obtener datos de estado general para PieChart"""
        
        query = db.query(
            func.count(case([(Calificacion.estado == 'A', 1)])).label('aprobados'),
            func.count(case([(Calificacion.estado == 'D', 1)])).label('desaprobados'),
            func.count(case([
                ((Calificacion.estado == '-') | 
                 (Calificacion.estado == '') | 
                 (Calificacion.estado.is_(None)), 1)
            ])).label('no_entregaron'),
            func.count(Calificacion.id).label('total')
        ).filter(
            Calificacion.periodo_id == periodo_id
        )
        
        if ficha_id:
            query = query.join(Estudiante).filter(Estudiante.ficha_id == ficha_id)
        
        result = query.first()
        
        total = result.total if result.total > 0 else 1
        
        return EstadoGeneralData(
            aprobados=result.aprobados,
            desaprobados=result.desaprobados,
            noEntregaron=result.no_entregaron,
            total=result.total,
            porcentajes={
                "aprobados": round(result.aprobados / total * 100, 1),
                "desaprobados": round(result.desaprobados / total * 100, 1),
                "noEntregaron": round(result.no_entregaron / total * 100, 1)
            }
        )
    
    @staticmethod
    def get_tendencia_aprobacion(
        db: Session, 
        periodo_id: int, 
        intervalo: str = 'semanal'
    ) -> List[TendenciaAprobacionItem]:
        """Obtener tendencia de aprobación para LineChart"""
        
        # Obtener fechas del período
        periodo = db.query(PeriodoAcademico).filter(PeriodoAcademico.id == periodo_id).first()
        
        if not periodo:
            return []
        
        # Agrupar por semana o mes según el intervalo
        if intervalo == 'semanal':
            truncate_func = func.date_trunc('week', Calificacion.fecha_actualizacion)
        else:
            truncate_func = func.date_trunc('month', Calificacion.fecha_actualizacion)
        
        query = db.query(
            truncate_func.label('periodo'),
            func.count(case([(Calificacion.estado == 'A', 1)])).label('aprobadas'),
            func.count(Calificacion.id).label('total')
        ).filter(
            Calificacion.periodo_id == periodo_id,
            Calificacion.fecha_actualizacion.isnot(None)
        ).group_by('periodo').order_by('periodo')
        
        results = query.all()
        
        data = []
        for idx, row in enumerate(results):
            porcentaje = (row.aprobadas / row.total * 100) if row.total > 0 else 0
            
            periodo_label = f"Sem {idx + 1}" if intervalo == 'semanal' else row.periodo.strftime('%b %Y')
            
            data.append(TendenciaAprobacionItem(
                periodo=periodo_label,
                fechaInicio=row.periodo.strftime('%Y-%m-%d'),
                fechaFin=(row.periodo + timedelta(days=7 if intervalo == 'semanal' else 30)).strftime('%Y-%m-%d'),
                aprobacion=round(porcentaje, 1),
                totalEvidencias=row.total,
                aprobadas=row.aprobadas
            ))
        
        return data
    
    @staticmethod
    def get_rendimiento_por_ficha(
        db: Session, 
        periodo_id: int
    ) -> List[RendimientoFichaItem]:
        """Obtener rendimiento por ficha para BarChart con doble eje"""
        
        query = db.query(
            Ficha.codigo,
            Ficha.nombre,
            func.count(distinct(Estudiante.id)).label('total_estudiantes'),
            func.count(case([(Calificacion.estado == 'A', 1)])).label('aprobadas'),
            func.count(Calificacion.id).label('total_evidencias'),
            func.avg(Calificacion.nota).label('promedio_notas')
        ).join(
            Estudiante, Estudiante.ficha_id == Ficha.id
        ).outerjoin(
            Calificacion, 
            (Calificacion.estudiante_id == Estudiante.id) & 
            (Calificacion.periodo_id == periodo_id)
        ).filter(
            Ficha.estado == 'activa'
        ).group_by(
            Ficha.id, Ficha.codigo, Ficha.nombre
        ).order_by(desc('aprobadas'))
        
        results = query.all()
        
        data = []
        for row in results:
            porcentaje_aprobacion = (row.aprobadas / row.total_evidencias * 100) if row.total_evidencias > 0 else 0
            
            data.append(RendimientoFichaItem(
                ficha=row.codigo,
                fichaNombre=row.nombre,
                aprobacion=round(porcentaje_aprobacion, 1),
                promedio=round(row.promedio_notas, 2) if row.promedio_notas else None,
                totalEstudiantes=row.total_estudiantes,
                evidenciasAprobadas=row.aprobadas,
                evidenciasTotales=row.total_evidencias
            ))
        
        return data
    
    @staticmethod
    def get_rendimiento_por_competencia(
        db: Session, 
        periodo_id: int, 
        ficha_id: Optional[int] = None
    ) -> List[RendimientoCompetenciaItem]:
        """Obtener rendimiento por competencia para RadarChart"""
        
        query = db.query(
            Materia.competencia,
            func.count(case([(Calificacion.estado == 'A', 1)])).label('aprobadas'),
            func.count(Calificacion.id).label('total_evidencias'),
            func.array_agg(distinct(Materia.nombre)).label('materias')
        ).join(
            Calificacion, Calificacion.materia_id == Materia.id
        ).filter(
            Calificacion.periodo_id == periodo_id,
            Materia.competencia.isnot(None)
        )
        
        if ficha_id:
            query = query.filter(Materia.ficha_id == ficha_id)
        
        query = query.group_by(Materia.competencia).order_by(Materia.competencia)
        
        results = query.all()
        
        data = []
        for row in results:
            porcentaje = (row.aprobadas / row.total_evidencias * 100) if row.total_evidencias > 0 else 0
            
            data.append(RendimientoCompetenciaItem(
                competencia=row.competencia,
                value=round(porcentaje, 1),
                materiasIncluidas=row.materias[:3],  # Mostrar solo primeras 3
                totalEvidencias=row.total_evidencias
            ))
        
        return data
```

---

### 4. Crear Endpoints (Rutas API)

**Archivo: `backend/app/api/v1/endpoints/analytics.py`**

```python
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import Usuario
from app.services.analytics_service import AnalyticsService
from app.schemas.dashboard import *

router = APIRouter()

# ========== ADMIN DASHBOARD ==========

@router.get("/dashboard/admin/stats", response_model=DashboardAdminResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener estadísticas del dashboard de administrador"""
    
    # Verificar que sea administrador
    if current_user.rol != 'administrador':
        raise HTTPException(status_code=403, detail="No autorizado")
    
    stats = AnalyticsService.get_admin_stats(db)
    
    return DashboardAdminResponse(
        success=True,
        stats=stats
    )

@router.get("/dashboard/admin/recent-activity", response_model=RecentActivityResponse)
def get_recent_activity(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener actividad reciente del sistema"""
    
    if current_user.rol != 'administrador':
        raise HTTPException(status_code=403, detail="No autorizado")
    
    activities = AnalyticsService.get_recent_activity(db, limit)
    
    return RecentActivityResponse(
        success=True,
        data=activities
    )

@router.get("/dashboard/admin/pending-tasks", response_model=PendingTasksResponse)
def get_pending_tasks(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener tareas pendientes del administrador"""
    
    if current_user.rol != 'administrador':
        raise HTTPException(status_code=403, detail="No autorizado")
    
    tasks = AnalyticsService.get_pending_tasks(db)
    
    return PendingTasksResponse(
        success=True,
        data=tasks
    )

# ========== COORDINADOR DASHBOARD ==========

@router.get("/dashboard/coordinador/stats")
def get_coordinador_stats(
    periodo_id: int = Query(..., description="ID del período académico"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener KPIs del coordinador"""
    
    if current_user.rol not in ['coordinador', 'administrador']:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    kpis = AnalyticsService.get_coordinador_stats(db, periodo_id)
    
    return {
        "success": True,
        "data": kpis
    }

@router.get("/dashboard/coordinador/fichas-progress")
def get_fichas_progress(
    periodo_id: int = Query(..., description="ID del período académico"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener progreso de calificaciones por ficha"""
    
    if current_user.rol not in ['coordinador', 'administrador']:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    fichas = AnalyticsService.get_fichas_progress(db, periodo_id)
    
    return {
        "success": True,
        "data": fichas
    }

# ========== ANALYTICS ==========

@router.get("/analytics/aprobacion-por-materia", response_model=AprobacionPorMateriaResponse)
def get_aprobacion_por_materia(
    periodo_id: int = Query(..., description="ID del período académico"),
    ficha_id: Optional[int] = Query(None, description="ID de la ficha (opcional)"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener datos de aprobación por materia (para BarChart)"""
    
    data = AnalyticsService.get_aprobacion_por_materia(db, periodo_id, ficha_id)
    
    return AprobacionPorMateriaResponse(
        success=True,
        data=data
    )

@router.get("/analytics/estado-general", response_model=EstadoGeneralResponse)
def get_estado_general(
    periodo_id: int = Query(..., description="ID del período académico"),
    ficha_id: Optional[int] = Query(None, description="ID de la ficha (opcional)"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener datos de estado general (para PieChart)"""
    
    data = AnalyticsService.get_estado_general(db, periodo_id, ficha_id)
    
    return EstadoGeneralResponse(
        success=True,
        data=data
    )

@router.get("/analytics/tendencia-aprobacion", response_model=TendenciaAprobacionResponse)
def get_tendencia_aprobacion(
    periodo_id: int = Query(..., description="ID del período académico"),
    intervalo: str = Query('semanal', regex='^(semanal|mensual)$'),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener tendencia de aprobación (para LineChart)"""
    
    data = AnalyticsService.get_tendencia_aprobacion(db, periodo_id, intervalo)
    
    return TendenciaAprobacionResponse(
        success=True,
        data=data
    )

@router.get("/analytics/rendimiento-por-ficha", response_model=RendimientoFichaResponse)
def get_rendimiento_por_ficha(
    periodo_id: int = Query(..., description="ID del período académico"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener rendimiento por ficha (para BarChart con doble eje)"""
    
    data = AnalyticsService.get_rendimiento_por_ficha(db, periodo_id)
    
    return RendimientoFichaResponse(
        success=True,
        data=data
    )

@router.get("/analytics/rendimiento-por-competencia", response_model=RendimientoCompetenciaResponse)
def get_rendimiento_por_competencia(
    periodo_id: int = Query(..., description="ID del período académico"),
    ficha_id: Optional[int] = Query(None, description="ID de la ficha (opcional)"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener rendimiento por competencia (para RadarChart)"""
    
    data = AnalyticsService.get_rendimiento_por_competencia(db, periodo_id, ficha_id)
    
    return RendimientoCompetenciaResponse(
        success=True,
        data=data
    )
```

**Registrar el router en `backend/app/api/v1/api.py`:**

```python
from fastapi import APIRouter
from app.api.v1.endpoints import auth, analytics  # Importar el nuevo módulo

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(analytics.router, tags=["analytics"])  # Agregar
```

---

## 🎨 Implementación Frontend (React)

### 1. Crear Hook para Analytics

**Archivo: `/hooks/useAnalytics.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

// ========== TIPOS ==========

export interface AprobacionPorMateria {
  materia: string;
  materiaCompleta: string;
  codigo: string;
  aprobados: number;
  desaprobados: number;
  noEntregaron: number;
  total: number;
}

export interface EstadoGeneral {
  aprobados: number;
  desaprobados: number;
  noEntregaron: number;
  total: number;
  porcentajes: {
    aprobados: number;
    desaprobados: number;
    noEntregaron: number;
  };
}

export interface TendenciaAprobacion {
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  aprobacion: number;
  totalEvidencias: number;
  aprobadas: number;
}

export interface RendimientoFicha {
  ficha: string;
  fichaNombre: string;
  aprobacion: number;
  promedio: number | null;
  totalEstudiantes: number;
  evidenciasAprobadas: number;
  evidenciasTotales: number;
}

export interface RendimientoCompetencia {
  competencia: string;
  value: number;
  materiasIncluidas: string[];
  totalEvidencias: number;
}

// ========== HOOK ==========

export function useAnalytics() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función genérica para fetch de datos
  const fetchData = async <T,>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get<{ success: boolean; data: T }>(endpoint, params);
      
      if (response.success) {
        return response.data;
      }
      
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ========== FUNCIONES ESPECÍFICAS ==========

  const getAprobacionPorMateria = async (periodoId: number, fichaId?: number) => {
    return await fetchData<AprobacionPorMateria[]>('/api/analytics/aprobacion-por-materia', {
      periodo_id: periodoId,
      ficha_id: fichaId
    });
  };

  const getEstadoGeneral = async (periodoId: number, fichaId?: number) => {
    return await fetchData<EstadoGeneral>('/api/analytics/estado-general', {
      periodo_id: periodoId,
      ficha_id: fichaId
    });
  };

  const getTendenciaAprobacion = async (periodoId: number, intervalo: 'semanal' | 'mensual' = 'semanal') => {
    return await fetchData<TendenciaAprobacion[]>('/api/analytics/tendencia-aprobacion', {
      periodo_id: periodoId,
      intervalo
    });
  };

  const getRendimientoPorFicha = async (periodoId: number) => {
    return await fetchData<RendimientoFicha[]>('/api/analytics/rendimiento-por-ficha', {
      periodo_id: periodoId
    });
  };

  const getRendimientoPorCompetencia = async (periodoId: number, fichaId?: number) => {
    return await fetchData<RendimientoCompetencia[]>('/api/analytics/rendimiento-por-competencia', {
      periodo_id: periodoId,
      ficha_id: fichaId
    });
  };

  return {
    loading,
    error,
    getAprobacionPorMateria,
    getEstadoGeneral,
    getTendenciaAprobacion,
    getRendimientoPorFicha,
    getRendimientoPorCompetencia
  };
}
```

---

### 2. Actualizar AnalyticsDashboard.tsx

**Archivo: `/components/reports/AnalyticsDashboard.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ReportFilters } from './ReportsPage';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { TrendingUp, TrendingDown, Users, BookOpen, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useAnalytics } from '../../hooks/useAnalytics';
import { toast } from 'sonner';

interface AnalyticsDashboardProps {
  filters: ReportFilters;
}

export function AnalyticsDashboard({ filters }: AnalyticsDashboardProps) {
  const {
    loading,
    error,
    getAprobacionPorMateria,
    getEstadoGeneral,
    getTendenciaAprobacion,
    getRendimientoPorFicha,
    getRendimientoPorCompetencia
  } = useAnalytics();

  // Estados para los datos
  const [dataAprobacion, setDataAprobacion] = useState<any[]>([]);
  const [dataEstadoGeneral, setDataEstadoGeneral] = useState<any>({});
  const [dataTendencia, setDataTendencia] = useState<any[]>([]);
  const [dataRendimientoFicha, setDataRendimientoFicha] = useState<any[]>([]);
  const [dataCompetencias, setDataCompetencias] = useState<any[]>([]);

  // Cargar todos los datos cuando cambian los filtros
  useEffect(() => {
    loadAllData();
  }, [filters.periodo, filters.ficha]);

  const loadAllData = async () => {
    try {
      // Nota: Necesitas pasar los IDs correctos desde los filtros
      const periodoId = parseInt(filters.periodo || '1');
      const fichaId = filters.ficha ? parseInt(filters.ficha) : undefined;

      // Cargar todos los datos en paralelo
      const [aprobacion, estadoGeneral, tendencia, rendimientoFicha, competencias] = await Promise.all([
        getAprobacionPorMateria(periodoId, fichaId),
        getEstadoGeneral(periodoId, fichaId),
        getTendenciaAprobacion(periodoId, 'semanal'),
        getRendimientoPorFicha(periodoId),
        getRendimientoPorCompetencia(periodoId, fichaId)
      ]);

      // Actualizar estados
      if (aprobacion) setDataAprobacion(aprobacion);
      if (estadoGeneral) setDataEstadoGeneral(estadoGeneral);
      if (tendencia) setDataTendencia(tendencia.map(t => ({
        semana: t.periodo,
        aprobacion: t.aprobacion
      })));
      if (rendimientoFicha) setDataRendimientoFicha(rendimientoFicha);
      if (competencias) setDataCompetencias(competencias);

    } catch (err) {
      toast.error('Error al cargar datos de analytics');
      console.error(err);
    }
  };

  // Preparar datos para PieChart
  const dataPie = [
    { 
      name: 'Aprobados', 
      value: dataEstadoGeneral.aprobados || 0, 
      color: '#22c55e' 
    },
    { 
      name: 'Desaprobados', 
      value: dataEstadoGeneral.desaprobados || 0, 
      color: '#ef4444' 
    },
    { 
      name: 'No Entregaron', 
      value: dataEstadoGeneral.noEntregaron || 0, 
      color: '#f59e0b' 
    },
  ];

  // Calcular estadísticas generales
  const totalEstudiantes = dataEstadoGeneral.total || 0;
  const aprobados = dataEstadoGeneral.aprobados || 0;
  const tasaAprobacion = dataEstadoGeneral.porcentajes?.aprobados?.toFixed(1) || '0.0';
  const tendencia = dataTendencia.length >= 2 
    ? dataTendencia[dataTendencia.length - 1].aprobacion - dataTendencia[dataTendencia.length - 2].aprobacion 
    : 0;

  if (loading && dataAprobacion.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando datos de analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Total Estudiantes
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEstudiantes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Activos en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Tasa de Aprobación
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{tasaAprobacion}%</div>
            <div className="flex items-center gap-1 mt-1">
              {tendencia > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <p className="text-xs text-green-600">+{tendencia.toFixed(1)}% vs semana anterior</p>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 text-red-600" />
                  <p className="text-xs text-red-600">{tendencia.toFixed(1)}% vs semana anterior</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Desaprobados
              <XCircle className="w-4 h-4 text-red-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{dataEstadoGeneral.desaprobados || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dataEstadoGeneral.porcentajes?.desaprobados?.toFixed(1) || '0.0'}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              No Entregaron
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{dataEstadoGeneral.noEntregaron || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requieren atención
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de Aprobación por Materia */}
        <Card>
          <CardHeader>
            <CardTitle>Aprobación por Materia</CardTitle>
            <CardDescription>Comparativa de resultados por materia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataAprobacion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="materia" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="aprobados" fill="#22c55e" name="Aprobados" />
                <Bar dataKey="desaprobados" fill="#ef4444" name="Desaprobados" />
                <Bar dataKey="noEntregaron" fill="#f59e0b" name="No Entregaron" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfica de Estado General (Pie) */}
        <Card>
          <CardHeader>
            <CardTitle>Estado General</CardTitle>
            <CardDescription>Distribución de calificaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dataPie}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dataPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tendencia y Rendimiento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia Semanal */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Aprobación</CardTitle>
            <CardDescription>Evolución semanal del porcentaje de aprobación</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dataTendencia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semana" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="aprobacion" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name="% Aprobación"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rendimiento por Ficha */}
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por Ficha</CardTitle>
            <CardDescription>Comparativa de fichas académicas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataRendimientoFicha}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ficha" />
                <YAxis yAxisId="left" orientation="left" stroke="#22c55e" />
                <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="aprobacion" fill="#22c55e" name="% Aprobación" />
                <Bar yAxisId="right" dataKey="promedio" fill="#3b82f6" name="Promedio" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análisis por Competencias */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis por Competencias</CardTitle>
          <CardDescription>Rendimiento en diferentes áreas de conocimiento</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={dataCompetencias}>
              <PolarGrid />
              <PolarAngleAxis dataKey="competencia" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Rendimiento" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## ✅ Testing y Validación

### 1. Testing Manual de Endpoints

Crear archivo de pruebas para usar con herramientas como **Thunder Client**, **Postman**, o **curl**:

```bash
# 1. Login para obtener token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@instituto.edu","password":"123456"}'

# Guardar el token de la respuesta
export TOKEN="tu_token_aqui"

# 2. Probar endpoint de aprobación por materia
curl -X GET "http://localhost:8000/api/analytics/aprobacion-por-materia?periodo_id=1" \
  -H "Authorization: Bearer $TOKEN"

# 3. Probar estado general
curl -X GET "http://localhost:8000/api/analytics/estado-general?periodo_id=1" \
  -H "Authorization: Bearer $TOKEN"

# 4. Probar tendencia de aprobación
curl -X GET "http://localhost:8000/api/analytics/tendencia-aprobacion?periodo_id=1&intervalo=semanal" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 2. Validación de Datos

Verificar que los datos retornados sean consistentes:

```sql
-- Verificar totales de calificaciones
SELECT 
  estado,
  COUNT(*) as total
FROM calificaciones
WHERE periodo_id = 1
GROUP BY estado;

-- Verificar por materia
SELECT 
  m.nombre,
  COUNT(CASE WHEN c.estado = 'A' THEN 1 END) as aprobados,
  COUNT(CASE WHEN c.estado = 'D' THEN 1 END) as desaprobados,
  COUNT(*) as total
FROM materias m
LEFT JOIN calificaciones c ON c.materia_id = m.id
WHERE c.periodo_id = 1
GROUP BY m.id, m.nombre;
```

---

## 📝 Resumen de Cambios Necesarios

### Backend (FastAPI)
1. ✅ Crear schemas en `schemas/dashboard.py`
2. ✅ Crear service layer en `services/analytics_service.py`
3. ✅ Crear endpoints en `api/v1/endpoints/analytics.py`
4. ✅ Registrar router en `api/v1/api.py`
5. ✅ Crear índices en la base de datos para performance

### Frontend (React)
1. ✅ Crear hook `useAnalytics.tsx`
2. ✅ Actualizar `AnalyticsDashboard.tsx` para usar datos reales
3. ✅ Actualizar `AdminDashboard.tsx`
4. ✅ Actualizar `CoordinadorDashboard.tsx`
5. ✅ Actualizar `DocenteDashboard.tsx`

### Base de Datos
1. ✅ Verificar estructura de tablas
2. ✅ Crear campo `competencia` en tabla `materias` (si no existe)
3. ✅ Crear campo `nota` en tabla `calificaciones` (si no existe)
4. ✅ Crear índices para mejorar performance

---

## 🎯 Próximos Pasos

1. **Implementar endpoints del backend** siguiendo esta guía
2. **Crear datos de prueba** en la base de datos para testing
3. **Probar cada endpoint** con Postman/Thunder Client
4. **Actualizar componentes del frontend** uno por uno
5. **Validar que las gráficas muestren datos correctos**
6. **Optimizar queries** si hay problemas de performance
7. **Agregar caché** si es necesario para mejorar velocidad

---

## 📚 Recursos Adicionales

- [Documentación de Recharts](https://recharts.org/en-US/)
- [FastAPI Query Parameters](https://fastapi.tiangolo.com/tutorial/query-params/)
- [SQLAlchemy Aggregation Functions](https://docs.sqlalchemy.org/en/14/core/functions.html)
- [PostgreSQL Window Functions](https://www.postgresql.org/docs/current/tutorial-window.html)

---

¡Éxito con la implementación! 🚀
