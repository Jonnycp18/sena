# 📊 Guía del Sistema de Reportes y Analytics

## 🎯 Descripción General

El módulo de Reportes y Analytics proporciona visualizaciones interactivas, métricas detalladas y análisis comparativos de las calificaciones y desempeño académico.

---

## 🔐 Permisos de Acceso

| Rol | Acceso |
|-----|--------|
| **Administrador** | ✅ Acceso completo a todos los reportes |
| **Coordinador** | ✅ Acceso completo a todos los reportes |
| **Docente** | ❌ Sin acceso |

**Nota:** Los docentes solo pueden ver sus propias calificaciones en la sección de "Carga de Archivos".

---

## 📑 Secciones del Módulo

### 1. **Analytics Dashboard** 📈

Dashboard principal con visualizaciones interactivas y métricas clave.

#### **KPIs Principales**

- **Total Estudiantes:** Cantidad total de estudiantes activos
- **Tasa de Aprobación:** Porcentaje general de aprobación
- **Desaprobados:** Número de evidencias desaprobadas
- **No Entregaron:** Tareas no entregadas que requieren atención

#### **Gráficas Disponibles**

1. **Aprobación por Materia** (Barras)
   - Compara aprobados, desaprobados y no entregados
   - Por cada materia del sistema

2. **Estado General** (Torta)
   - Distribución porcentual de:
     - Aprobados (verde)
     - Desaprobados (rojo)
     - No Entregados (amarillo)

3. **Tendencia de Aprobación** (Línea)
   - Evolución semanal del % de aprobación
   - Muestra tendencias al alza o baja

4. **Rendimiento por Ficha** (Barras Dobles)
   - Compara % de aprobación y promedio
   - Por cada ficha académica

5. **Análisis por Competencias** (Radar)
   - Rendimiento en diferentes áreas:
     - Programación
     - Bases de Datos
     - Trabajo en Equipo
     - Análisis
     - Diseño

6. **Resumen por Materia** (Lista detallada)
   - Estado de cada materia con:
     - Badge de calidad (Excelente/Regular/Requiere Atención)
     - Aprobados, desaprobados y no entregados
     - Total de estudiantes

---

### 2. **Reporte de Estudiantes** 👨‍🎓

Análisis individual y listado completo de estudiantes.

#### **Estadísticas Generales**

- Total de estudiantes
- Promedio general de aprobación
- Estudiantes con desempeño excelente (≥80%)
- Estudiantes en riesgo (<60%)

#### **Tabla de Estudiantes**

Cada registro muestra:

| Columna | Descripción |
|---------|-------------|
| **Estudiante** | Nombre, apellido y cédula |
| **Ficha** | Ficha académica asignada |
| **Evidencias** | Total de evidencias del periodo |
| **Aprobadas** | Cantidad de evidencias aprobadas (verde) |
| **Desaprobadas** | Cantidad de evidencias desaprobadas (rojo) |
| **No Entregadas** | Cantidad sin entregar (amarillo) |
| **% Aprobación** | Porcentaje con barra de progreso |
| **Tendencia** | Icono de tendencia (↑↓-) |
| **Estado** | Badge: Excelente / Regular / Bajo |
| **Acciones** | Ver detalles completos |

#### **Buscador**

- Búsqueda en tiempo real por:
  - Nombre
  - Apellido
  - Cédula
  - Email

#### **Vista Detallada**

Al hacer clic en "Ver Detalles":

1. **Información del Estudiante**
   - Avatar con iniciales
   - Datos completos (cédula, email, ficha)
   - Badge de estado general

2. **Resumen de Evidencias**
   - Cards con totales de:
     - Aprobadas
     - Desaprobadas
     - No Entregadas

3. **Desempeño por Materia**
   - Lista de todas las materias
   - Barra de progreso por materia
   - Desglose: A (aprobadas), D (desaprobadas), - (no entregadas)
   - Porcentaje de aprobación por materia

---

### 3. **Reporte de Materias** 📚

Análisis por materia con estadísticas detalladas.

#### **Estadísticas Generales**

- Total de materias
- Promedio de aprobación
- Materias con desempeño excelente
- Materias que requieren atención

#### **Gráfica Comparativa**

- Compara todas las materias en:
  - % de Aprobación
  - Promedio (escalado x20 para visualización)

#### **Tabla Detallada**

Para cada materia:

| Dato | Descripción |
|------|-------------|
| **Nombre** | Nombre completo y código |
| **Docente** | Docente responsable |
| **Estudiantes** | Total de estudiantes |
| **Aprobadas** | Evidencias aprobadas |
| **Desaprobadas** | Evidencias desaprobadas |
| **No Entregadas** | Evidencias sin entregar |
| **% Aprobación** | Con barra de progreso |
| **Promedio** | Promedio general |
| **Estado** | Badge de calidad |

#### **Cards Detalladas**

Cada materia tiene un card expandido con:

1. **Métricas Principales**
   - Total estudiantes
   - Total evidencias
   - % Aprobación
   - Promedio

2. **Distribución de Estudiantes**
   - 90-100%: Excelentes
   - 70-89%: Buenos
   - 50-69%: Regulares
   - 0-49%: Bajos
   - Con barras de progreso

3. **Resumen de Evidencias**
   - Aprobadas (verde)
   - Desaprobadas (rojo)
   - No Entregadas (amarillo)

---

### 4. **Reportes Comparativos** 📊

Análisis históricos y comparativas entre diferentes dimensiones.

#### **4.1 Comparativa por Fichas**

- **Gráfica de Evolución Semanal**
  - Líneas de tendencia para cada ficha
  - Últimas 6 semanas
  - Colores diferenciados

- **Cards de Resumen**
  - Porcentaje inicial vs actual
  - Cálculo de mejora porcentual
  - Indicador de tendencia

#### **4.2 Comparativa por Docentes**

- **Gráfica de Barras Dobles**
  - % de Aprobación (eje izquierdo)
  - Cantidad de Estudiantes (eje derecho)

- **Cards Individuales**
  - % Aprobación
  - Total de estudiantes
  - Satisfacción (escala 1-5)

#### **4.3 Comparativa por Periodos**

- **Gráfica de Barras Agrupadas**
  - Aprobación (verde)
  - Desaprobación (rojo)
  - No Entrega (amarillo)
  - Por cada periodo académico

- **Cards de Periodos**
  - Desglose porcentual de cada periodo
  - Evolución histórica

#### **4.4 Evolución Mensual**

- **Gráfica de Área Apilada**
  - Acumulado mensual de:
    - Aprobación
    - Desaprobación
    - No Entrega
  - Muestra tendencias generales

---

## 🔍 Filtros de Búsqueda

Todos los reportes pueden filtrarse por:

### Filtros Disponibles

1. **Periodo**
   - Todos los periodos
   - 2024-1
   - 2024-2
   - 2023-2

2. **Materia**
   - Todas las materias
   - Fundamentos de Programación
   - Bases de Datos
   - Desarrollo Web

3. **Ficha**
   - Todas las fichas
   - 2558901 - ADSO
   - 2558902 - Diseño
   - 2558903 - Multimedia

4. **Docente**
   - Todos los docentes
   - Lista de docentes activos

5. **Rango de Fechas**
   - Fecha Inicio
   - Fecha Fin

### Uso de Filtros

- Selecciona uno o varios filtros
- Los reportes se actualizan automáticamente
- Botón "Limpiar Filtros" restaura valores por defecto
- Indicador visual cuando hay filtros activos

---

## 📤 Exportación de Datos

### Opciones de Exportación

1. **Exportar PDF**
   - Genera reporte completo en PDF
   - Incluye gráficas y tablas
   - Formato profesional

2. **Exportar Excel** (próximamente)
   - Descarga datos en formato XLSX
   - Incluye múltiples hojas por sección

### Botones de Exportación

- Ubicados en la parte superior derecha
- Disponibles en todas las secciones
- Generan archivo descargable

---

## 🎨 Interpretación de Gráficas

### Códigos de Color

| Color | Significado |
|-------|-------------|
| 🟢 Verde | Aprobado / Excelente / Positivo |
| 🔴 Rojo | Desaprobado / Bajo / Requiere Atención |
| 🟡 Amarillo | No Entregado / Regular / Advertencia |
| 🔵 Azul | Información / Neutral / Promedio |

### Badges de Estado

| Badge | Rango | Significado |
|-------|-------|-------------|
| **Excelente** (Verde) | ≥80% | Muy buen desempeño |
| **Regular** (Amarillo) | 60-79% | Desempeño aceptable |
| **Bajo/Requiere Atención** (Rojo) | <60% | Necesita intervención |

### Iconos de Tendencia

| Icono | Significado |
|-------|-------------|
| ↑ (Verde) | Tendencia al alza / Mejorando |
| ↓ (Rojo) | Tendencia a la baja / Empeorando |
| - (Gris) | Estable / Sin cambios significativos |

---

## 💡 Casos de Uso

### Caso 1: Identificar Estudiantes en Riesgo

**Objetivo:** Encontrar estudiantes que necesitan apoyo académico

**Pasos:**
1. Ir a **Reporte de Estudiantes**
2. Revisar la métrica "En Riesgo" en las estadísticas
3. Ordenar tabla por "% Aprobación" ascendente
4. Ver detalles de cada estudiante en riesgo
5. Analizar qué materias tienen peor rendimiento
6. Tomar acciones correctivas

**Indicadores clave:**
- % Aprobación < 60%
- Badge "Bajo" (rojo)
- Tendencia ↓ (bajando)
- Muchas evidencias "No Entregadas"

---

### Caso 2: Evaluar Desempeño de una Materia

**Objetivo:** Analizar si una materia necesita ajustes

**Pasos:**
1. Ir a **Reporte de Materias**
2. Buscar la materia específica
3. Revisar:
   - % de aprobación general
   - Distribución de estudiantes
   - Cantidad de no entregas
4. Comparar con otras materias similares
5. Ver tendencia en gráfica comparativa

**Indicadores de alerta:**
- % Aprobación < 70%
- Muchas evidencias no entregadas
- Distribución concentrada en rangos bajos
- Peor que promedio general

---

### Caso 3: Comparar Fichas Académicas

**Objetivo:** Identificar qué ficha tiene mejor rendimiento

**Pasos:**
1. Ir a **Reportes Comparativos** > **Por Fichas**
2. Analizar gráfica de evolución semanal
3. Revisar cards de resumen
4. Comparar porcentajes de mejora
5. Identificar ficha líder y fichas rezagadas

**Análisis:**
- Ficha con línea más alta = Mejor rendimiento
- Ficha con mayor pendiente = Mayor mejora
- Cards muestran % de mejora desde inicio

---

### Caso 4: Monitorear Tendencias Mensuales

**Objetivo:** Ver si el rendimiento general está mejorando

**Pasos:**
1. Ir a **Reportes Comparativos** > **Evolución Mensual**
2. Analizar gráfica de área apilada
3. Observar si:
   - Verde (aprobación) aumenta
   - Rojo (desaprobación) disminuye
   - Amarillo (no entrega) disminuye
4. Identificar mes con mejor/peor desempeño

**Tendencia positiva:**
- Área verde creciendo
- Áreas roja y amarilla reduciéndose
- Línea general ascendente

---

## 🎯 Mejores Prácticas

### Para Coordinadores

1. **Revisión Semanal**
   - Revisa el Analytics Dashboard cada semana
   - Identifica alertas tempranas
   - Comunica hallazgos al equipo

2. **Intervención Temprana**
   - Usa "Reporte de Estudiantes" para detectar riesgo
   - Actúa antes de que empeore
   - Documenta intervenciones

3. **Evaluación de Docentes**
   - Usa "Comparativa por Docentes"
   - Identifica mejores prácticas
   - Comparte estrategias exitosas

4. **Ajuste de Estrategias**
   - Analiza "Evolución Mensual"
   - Detecta patrones
   - Ajusta metodologías según datos

### Para Administradores

1. **Visión General**
   - Comienza con Analytics Dashboard
   - Revisa KPIs principales
   - Identifica áreas problemáticas

2. **Análisis Profundo**
   - Usa filtros para segmentar datos
   - Compara periodos históricos
   - Busca patrones recurrentes

3. **Toma de Decisiones**
   - Basate en datos objetivos
   - Compara múltiples reportes
   - Genera planes de acción medibles

4. **Reportes Ejecutivos**
   - Exporta PDF para presentaciones
   - Incluye gráficas clave
   - Documenta mejoras logradas

---

## ⚙️ Configuración y Personalización

### Datos Actuales

El sistema actualmente usa **datos mock** (ejemplos) para demostración.

### Integración con Datos Reales

Para conectar con datos reales:

1. Los datos provienen de:
   - Sistema de carga de archivos Excel
   - Base de datos de calificaciones
   - Registros históricos

2. Los reportes se actualizan:
   - Automáticamente al cargar nuevas calificaciones
   - En tiempo real con los filtros
   - Según el periodo académico activo

3. Personalización futura:
   - Configurar rangos de badges
   - Personalizar colores de gráficas
   - Agregar nuevas métricas
   - Definir alertas automáticas

---

## 🔄 Actualización de Datos

### Frecuencia de Actualización

- **Analytics Dashboard:** Tiempo real
- **Reporte de Estudiantes:** Actualización inmediata post-carga
- **Reporte de Materias:** Actualización inmediata
- **Comparativas:** Actualización al cambiar filtros

### Sincronización

1. Al cargar archivo Excel → Actualiza todos los reportes
2. Al cambiar filtros → Recalcula estadísticas
3. Al navegar entre tabs → Mantiene filtros activos

---

## 📱 Responsive Design

El sistema está optimizado para:

- ✅ **Desktop:** Experiencia completa con todas las gráficas
- ✅ **Tablet:** Gráficas adaptadas, navegación fluida
- ✅ **Mobile:** Cards apiladas, tablas con scroll horizontal

---

## 🚀 Próximas Funcionalidades

### En Desarrollo

- [ ] Exportación a Excel
- [ ] Reportes personalizados por usuario
- [ ] Alertas automáticas por email
- [ ] Dashboard personalizable (drag & drop)
- [ ] Comparativas con periodos anteriores
- [ ] Predicción de rendimiento (ML)
- [ ] Integración con sistema de notificaciones

---

## 📞 Soporte

### Problemas Comunes

**P: No veo datos en los reportes**
**R:** Verifica que hayas cargado archivos Excel con calificaciones previamente.

**P: Los filtros no funcionan**
**R:** Limpia los filtros y vuelve a aplicarlos. Si persiste, recarga la página.

**P: Las gráficas no cargan**
**R:** Verifica tu conexión a internet. Las gráficas usan la librería Recharts.

---

**Última actualización:** Octubre 2024  
**Versión:** 1.0.0  
**Módulo:** Reportes y Analytics  
**Estado:** ✅ Operacional