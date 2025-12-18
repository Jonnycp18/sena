# Diseño Adaptado Endpoints Analytics (Versión Esquema Actual)

Esta propuesta adapta los 5 endpoints de analytics descritos en la guía original a la realidad del esquema actual (tablas: `materias`, `fichas`, `evidencias_detalle`, `evidencia_definicion`). Se eliminan referencias a `calificaciones` y `periodos_academicos` (no presentes). Se introducen filtros opcionales por `ficha_id`, `materia_id` y/o rango de fechas. Todos los conteos excluyen evidencias cuya definición no esté activa (JOIN con `evidencia_definicion.activa`).

## Consideraciones Globales
- Tabla fuente principal: `evidencias_detalle` (columnas relevantes: `materia_id`, `ficha_id`, `evidencia_nombre`, `estudiante_documento`, `letra`, `nota`, `trimestre`, `created_at`).
- Activación: `JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa` garantiza excluir definiciones inactivas.
- Estados académicos derivados de `letra`:
  - `A` (Aprobado)
  - `F` (Reprobado) — Ajuste respecto a guía (usa `D`).
  - Sin entrega: `letra IS NULL` (aún no cargada) o caso pendiente según negocio.
- Promedio numérico: se usa `nota` si disponible; si no, heurística mapping letras→puntaje (centralizar después en util backend). Propuesta mapping actual: `{'A': 5.0, 'F': 2.0}` (alineado a upload por parámetros `notaA`, `notaF`).
- Competencias: Campo aún NO existe en `materias`; el endpoint radar devolverá lista vacía hasta que se agregue columna y se pueble.
- Parámetro `periodo_id` de la guía se sustituye por filtros de fecha (`from` y `to`) opcionales sobre `created_at`. Si se omiten, se usa último rango de 30 días para endpoints que requieren series temporales.

## 1. GET /api/v1/analytics/aprobacion-por-materia

Obtiene distribución por materia (aprobados, reprobados, no entregaron) para un conjunto filtrado.

### Parámetros Query
- `ficha_id` (int, opcional): Limita a materias de esa ficha.
- `materia_id` (int, opcional): Limita a una materia específica.
- `from` (date ISO, opcional): Fecha inicial filtro `e.created_at`.
- `to` (date ISO, opcional): Fecha final filtro `e.created_at`.

### SQL Base
```sql
SELECT m.id,
       m.nombre,
       m.codigo,
       COUNT(*) AS total,
       SUM(CASE WHEN e.letra = 'A' THEN 1 ELSE 0 END) AS aprobados,
       SUM(CASE WHEN e.letra = 'F' THEN 1 ELSE 0 END) AS reprobados,
       SUM(CASE WHEN e.letra IS NULL THEN 1 ELSE 0 END) AS no_entregaron
FROM materias m
LEFT JOIN evidencias_detalle e ON e.materia_id = m.id
LEFT JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa
WHERE (d.activa IS TRUE)  -- Garantiza sólo evidencias de definiciones activas
  /* AND filtros dinámicos */
GROUP BY m.id, m.nombre, m.codigo
ORDER BY m.nombre;
```

Nota: `LEFT JOIN` con `evidencias_detalle` mantiene materias sin evidencias (total=0). Filtro `d.activa` en WHERE convierte LEFT en semi INNER para filas con evidencias; si se desea conservar materias sin ninguna evidencia activa se debe mover la condición a `AND d.activa` en JOIN y permitir NULL en WHERE (ajustar lógica según necesidad). Propuesta: conservar así para sólo materias con evidencias activas registradas.

### Respuesta
```json
{
  "success": true,
  "data": [
    {
      "materiaId": 12,
      "codigo": "PROG101",
      "materia": "Programación Básica",
      "aprobados": 45,
      "reprobados": 8,
      "noEntregaron": 5,
      "total": 58,
      "porcentajes": {
        "aprobados": 77.59,
        "reprobados": 13.79,
        "noEntregaron": 8.62
      }
    }
  ]
}
```

## 2. GET /api/v1/analytics/estado-general

Resumen global de estados (aprobados, reprobados, no entregaron) sobre conjunto filtrado.

### Parámetros Query
- `ficha_id` (int, opcional)
- `materia_id` (int, opcional)
- `from` / `to` (date ISO, opcional)

### SQL Base
```sql
SELECT
  SUM(CASE WHEN e.letra = 'A' THEN 1 ELSE 0 END) AS aprobados,
  SUM(CASE WHEN e.letra = 'F' THEN 1 ELSE 0 END) AS reprobados,
  SUM(CASE WHEN e.letra IS NULL THEN 1 ELSE 0 END) AS no_entregaron,
  COUNT(*) AS total
FROM evidencias_detalle e
JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa
/* JOIN materias m ON m.id = e.materia_id (solo si se requiere filtro por ficha) */
WHERE 1=1
  /* AND filtros dinámicos */;
```

### Respuesta
```json
{
  "success": true,
  "data": {
    "aprobados": 160,
    "reprobados": 45,
    "noEntregaron": 15,
    "total": 220,
    "porcentajes": {
      "aprobados": 72.73,
      "reprobados": 20.45,
      "noEntregaron": 6.82
    }
  }
}
```

## 3. GET /api/v1/analytics/tendencia-aprobacion

Serie temporal semanal (o mensual) de porcentaje de aprobación.

### Parámetros Query
- `intervalo` (string: `semanal|mensual`, default `semanal`)
- `ficha_id` (int, opcional)
- `materia_id` (int, opcional)
- `from` / `to` (date ISO, opcional; si faltan se asume últimos 90 días)

### SQL Base (intervalo dinámico)
```sql
WITH rango AS (
  SELECT COALESCE(%(from)s::timestamp, NOW() - INTERVAL '90 days') AS inicio,
         COALESCE(%(to)s::timestamp, NOW()) AS fin
), base AS (
  SELECT e.created_at::date AS fecha,
         e.letra
  FROM evidencias_detalle e
  JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa
  /* JOIN materias m ON m.id = e.materia_id */
  CROSS JOIN rango r
  WHERE e.created_at BETWEEN r.inicio AND r.fin
    /* AND filtros dinámicos */
)
SELECT DATE_TRUNC(%(granularity)s, fecha) AS periodo,
       COUNT(*) AS total,
       SUM(CASE WHEN letra = 'A' THEN 1 ELSE 0 END) AS aprobadas
FROM base
GROUP BY periodo
ORDER BY periodo;
```
Donde `%(granularity)s` es `'week'` o `'month'` según `intervalo`.

Post-proceso en Python: calcular porcentaje = `aprobadas / total * 100` y derivar `fechaInicio`, `fechaFin` (semana = periodo y periodo+6 días; mes usar último día del mes). Limitar a máximo 52 puntos.

### Respuesta
```json
{
  "success": true,
  "data": [
    {
      "periodo": "Sem 1",
      "fechaInicio": "2025-09-01",
      "fechaFin": "2025-09-07",
      "aprobacion": 75.5,
      "totalEvidencias": 120,
      "aprobadas": 91
    }
  ]
}
```

## 4. GET /api/v1/analytics/rendimiento-por-ficha

Comparativa por ficha: porcentaje aprobación y promedio notas (si existen) + totales.

### Parámetros Query
- `from` / `to` (date ISO, opcional)
- `limit` (int, opcional, default 100)

### SQL Base
```sql
SELECT f.id,
       f.numero,
       f.nombre,
       COUNT(*) AS total_evidencias,
       SUM(CASE WHEN e.letra = 'A' THEN 1 ELSE 0 END) AS aprobadas,
       AVG(e.nota) AS promedio_nota,
       COUNT(DISTINCT e.estudiante_documento) AS total_estudiantes
FROM fichas f
JOIN evidencias_detalle e ON e.ficha_id = f.id
JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa
WHERE 1=1
  /* AND e.created_at BETWEEN ... (rango opcional) */
GROUP BY f.id, f.numero, f.nombre
ORDER BY aprobadas DESC
LIMIT %(limit)s;
```

Post-proceso: `aprobacion = (aprobadas / total_evidencias)*100` (si total > 0). Redondeos: 1 decimal para porcentajes, 2 para promedio.

### Respuesta
```json
{
  "success": true,
  "data": [
    {
      "fichaId": 3,
      "numero": "2558901",
      "nombre": "Téc. Desarrollo Software",
      "aprobacion": 85.4,
      "promedio": 4.20,
      "totalEstudiantes": 32,
      "evidenciasAprobadas": 245,
      "evidenciasTotales": 288
    }
  ]
}
```

## 5. GET /api/v1/analytics/rendimiento-por-competencia

Radar por competencias. Hasta crear campo `competencia` en `materias` devolverá lista vacía.

### Parámetros Query
- `ficha_id` (int, opcional)
- `from` / `to` (date ISO, opcional)

### Pre-requisito
Agregar columna:
```sql
ALTER TABLE materias ADD COLUMN IF NOT EXISTS competencia TEXT;
```
Poblarla manualmente antes de esperar datos útiles.

### SQL Base (si campo existe y poblado)
```sql
SELECT m.competencia,
       COUNT(*) AS total_evidencias,
       SUM(CASE WHEN e.letra = 'A' THEN 1 ELSE 0 END) AS aprobadas,
       ARRAY_AGG(DISTINCT m.nombre) AS materias_incluidas
FROM materias m
JOIN evidencias_detalle e ON e.materia_id = m.id
JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa
WHERE m.competencia IS NOT NULL AND m.competencia <> ''
  /* AND m.ficha_id = %(ficha_id)s (opcional) */
  /* AND e.created_at BETWEEN ... (rango opcional) */
GROUP BY m.competencia
ORDER BY m.competencia;
```

Post-proceso: `value = aprobadas/total_evidencias*100`. Limitar `materiasIncluidas` a primeras 5 para evitar payload grande.

### Respuesta
```json
{
  "success": true,
  "data": [
    {
      "competencia": "Programación",
      "value": 83.2,
      "materiasIncluidas": ["Fundamentos", "POO", "Web"],
      "totalEvidencias": 450
    }
  ]
}
```

## Errores / Edge Cases
- División por cero: usar guardas (si total=0 → 0%).
- Materias sin evidencias activas: se excluyen (decisión tomada para queries actuales). Ajustable moviendo condición `d.activa` del WHERE al JOIN.
- Rango de fechas inválido (`from > to`): retornar 400.
- Campos faltantes competencia / nota: endpoint de competencia retorna `data: []`; promedios usan `nota` si no NULL, si toda la columna NULL promedio = null.

## Seguridad / Roles (pendiente definir)
- Puede limitarse a roles: administrador, coordinador, docente (con subset). Por ahora se expondrá lectura pública autenticada y se añade validación futura.

## Resumen de Próximos Pasos
1. Crear router `analytics.py` con estos 5 endpoints y validación básica de parámetros.
2. Añadir util `grades.py` con mapping letras→puntaje (para futuros promedios derivados cuando falte `nota`).
3. Crear migración para columna `competencia` (si no existe) + índices recomendados:
   - `CREATE INDEX idx_evidencias_detalle_created_at ON evidencias_detalle(created_at);`
   - `CREATE INDEX idx_evidencias_detalle_letra ON evidencias_detalle(letra);`
   - `CREATE INDEX idx_evidencias_detalle_materia ON evidencias_detalle(materia_id);`
   - `CREATE INDEX idx_evidencias_detalle_ficha ON evidencias_detalle(ficha_id);`
4. Implementar caching simple (TTL en memoria) opcional para aprobacion-por-materia y rendimiento-por-ficha.
5. Refactor frontend `AnalyticsDashboard.tsx` para consumir estos endpoints (hook `useAnalytics`).

---
Documento generado el 2025-11-24.
