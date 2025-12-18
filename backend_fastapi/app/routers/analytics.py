from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from psycopg.rows import dict_row
from . import db as db_module
import os
import threading

# ---- Simple In-Memory Cache (optional) ----
_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_LOCK = threading.Lock()
try:
    _CACHE_TTL = int(os.getenv("ANALYTICS_CACHE_TTL", "60"))  # seconds
except ValueError:
    _CACHE_TTL = 60

def _cache_key(endpoint: str, params: Dict[str, Any]) -> str:
    # Sort params for stable key
    items = sorted(params.items(), key=lambda x: x[0])
    repr_items = ",".join(f"{k}={v}" for k, v in items)
    return f"{endpoint}|{repr_items}"

def _cache_get(key: str) -> Optional[Any]:
    if _CACHE_TTL <= 0:
        return None
    now = datetime.utcnow()
    with _CACHE_LOCK:
        entry = _CACHE.get(key)
        if not entry:
            return None
        if entry["expires"] < now:
            _CACHE.pop(key, None)
            return None
        return entry["value"]

def _cache_set(key: str, value: Any) -> None:
    if _CACHE_TTL <= 0:
        return
    expires = datetime.utcnow() + timedelta(seconds=_CACHE_TTL)
    with _CACHE_LOCK:
        _CACHE[key] = {"value": value, "expires": expires}

# NOTE: Prefix keeps consistent versioning style used elsewhere
router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

# ---- Helpers ----

def _parse_date(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Fecha inválida: {value}")

def _date_range(from_str: Optional[str], to_str: Optional[str], default_days: int = 90) -> (datetime, datetime):
    now = datetime.utcnow()
    start = _parse_date(from_str) or (now - timedelta(days=default_days))
    end = _parse_date(to_str) or now
    if start > end:
        raise HTTPException(status_code=400, detail="Rango de fechas inválido (from > to)")
    return start, end

# Common join condition for active definitions
ACTIVE_JOIN = "JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa"

# ----------------------------------------------------------------------------
# 1. Aprobación por Materia
# ----------------------------------------------------------------------------
@router.get("/aprobacion-por-materia")
def aprobacion_por_materia(
    ficha_id: Optional[int] = Query(None),
    materia_id: Optional[int] = Query(None),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    limit: int = Query(100, ge=1, le=1000),
):
    cache_key = _cache_key("aprobacion_por_materia", {
        "ficha_id": ficha_id,
        "materia_id": materia_id,
        "from": from_date,
        "to": to_date,
    })
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached
    date_start, date_end = _date_range(from_date, to_date, default_days=120)
    filters = ["e.created_at BETWEEN %s AND %s"]
    params: List[Any] = [date_start, date_end]
    if ficha_id is not None:
        filters.append("e.ficha_id = %s")
        params.append(ficha_id)
    if materia_id is not None:
        filters.append("e.materia_id = %s")
        params.append(materia_id)
    where_clause = "WHERE " + " AND ".join(filters)
    sql = f"""
    SELECT m.id AS materia_id, m.nombre, m.codigo,
           COALESCE(COUNT(e.id), 0) AS total,
           COALESCE(SUM(CASE WHEN e.letra = 'A' THEN 1 ELSE 0 END), 0) AS aprobados,
           COALESCE(SUM(CASE WHEN e.letra = 'F' THEN 1 ELSE 0 END), 0) AS reprobados,
           COALESCE(SUM(CASE WHEN e.id IS NOT NULL AND e.letra IS NULL THEN 1 ELSE 0 END), 0) AS no_entregaron
    FROM materias m
    LEFT JOIN evidencias_detalle e ON e.materia_id = m.id
    LEFT JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa
    {where_clause}
    GROUP BY m.id, m.nombre, m.codigo
    ORDER BY m.nombre
    """
    with db_module.get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, params)
        rows = cur.fetchall() or []
        if not rows:
            # Fallback seguro: listar materias con contadores en 0
            conds = []
            p2: List[Any] = []
            if materia_id is not None:
                conds.append("m.id = %s")
                p2.append(materia_id)
            if ficha_id is not None:
                conds.append("m.ficha_id = %s")
                p2.append(ficha_id)
            where2 = ("WHERE " + " AND ".join(conds)) if conds else ""
            cur.execute(
                f"""
                SELECT m.id AS materia_id, m.nombre, m.codigo
                FROM materias m
                {where2}
                ORDER BY m.nombre
                LIMIT %s
                """,
                p2 + [limit]
            )
            base_rows = cur.fetchall() or []
            rows = [{
                "materia_id": r.get("materia_id"),
                "nombre": r.get("nombre"),
                "codigo": r.get("codigo"),
                "total": 0,
                "aprobados": 0,
                "reprobados": 0,
                "no_entregaron": 0,
            } for r in base_rows]
    data = []
    for r in rows:
        total = (r.get("total") or 0)
        total_guard = total if total > 0 else 1
        data.append({
            "materiaId": r.get("materia_id"),
            "codigo": r.get("codigo"),
            "materia": r.get("nombre"),
            "aprobados": r.get("aprobados", 0),
            "reprobados": r.get("reprobados", 0),
            "noEntregaron": r.get("no_entregaron", 0),
            "total": total,
            "porcentajes": {
                "aprobados": round(((r.get("aprobados", 0)) / total_guard) * 100, 2),
                "reprobados": round(((r.get("reprobados", 0)) / total_guard) * 100, 2),
                "noEntregaron": round(((r.get("no_entregaron", 0)) / total_guard) * 100, 2),
            },
        })
    response = {"success": True, "data": data}
    _cache_set(cache_key, response)
    return response

# ----------------------------------------------------------------------------
# 6. Analytics por Estudiante (Listado)
# ----------------------------------------------------------------------------
@router.get("/estudiantes")
def analytics_estudiantes(
    materia: Optional[str] = Query("todos"),
    ficha: Optional[str] = Query("todos"),
    docente: Optional[str] = Query("todos"),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    limit: int = Query(200, ge=1, le=1000),
    search: Optional[str] = Query(None)
):
    cache_key = _cache_key("analytics_estudiantes", {
        "materia": materia, "ficha": ficha, "docente": docente,
        "from": from_date, "to": to_date, "limit": limit, "search": search or ""
    })
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    date_start, date_end = _date_range(from_date, to_date, default_days=120)
    filters = ["e.created_at BETWEEN %s AND %s"]
    params: List[Any] = [date_start, date_end]
    # Filtros opcionales
    if ficha and ficha != "todos":
        # Permite filtrar por numero exacto o id numerico
        if ficha.isdigit():
            filters.append("e.ficha_id = %s")
            params.append(int(ficha))
        else:
            filters.append("f.numero = %s")
            params.append(ficha)
    if materia and materia != "todos":
        if materia.isdigit():
            filters.append("e.materia_id = %s")
            params.append(int(materia))
        else:
            filters.append("m.codigo = %s")
            params.append(materia)
    if docente and docente != "todos":
        if docente.isdigit():
            filters.append("m.docente_id = %s")
            params.append(int(docente))
        else:
            filters.append("LOWER(u.email) = LOWER(%s)")
            params.append(docente)
    if search:
        filters.append("(LOWER(s.nombre) LIKE LOWER(%s) OR LOWER(s.apellido) LIKE LOWER(%s) OR LOWER(e.estudiante_documento) LIKE LOWER(%s))")
        like = f"%{search}%"
        params.extend([like, like, like])

    where_clause = "WHERE " + " AND ".join(filters)
    sql = f"""
        SELECT
            e.estudiante_documento AS documento,
            s.nombre AS nombre,
            s.apellido AS apellido,
            s.correo AS email,
      f.numero AS ficha_numero,
      COUNT(*) AS total,
      SUM(CASE WHEN e.letra = 'A' THEN 1 ELSE 0 END) AS aprobadas,
      SUM(CASE WHEN e.letra = 'F' THEN 1 ELSE 0 END) AS desaprobadas,
      SUM(CASE WHEN e.letra IS NULL THEN 1 ELSE 0 END) AS no_entregadas
    FROM evidencias_detalle e
    {ACTIVE_JOIN}
    LEFT JOIN estudiantes s ON s.documento = e.estudiante_documento
    LEFT JOIN fichas f ON f.id = e.ficha_id
    LEFT JOIN materias m ON m.id = e.materia_id
    LEFT JOIN users u ON u.id = m.docente_id
    {where_clause}
    GROUP BY e.estudiante_documento, s.nombre, s.apellido, s.correo, f.numero
    ORDER BY s.nombre NULLS LAST, s.apellido NULLS LAST
    LIMIT %s
    """
    params.append(limit)
    with db_module.get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, params)
        rows = cur.fetchall() or []
        if not rows:
            # Intentar con tabla "evidencias" si existe y tiene datos
            try:
                ev_filters = []
                ev_params: List[Any] = []
                if search:
                    like = f"%{search}%"
                    ev_filters.append("(LOWER(s.nombre) LIKE LOWER(%s) OR LOWER(s.apellido) LIKE LOWER(%s) OR LOWER(e.documento) LIKE LOWER(%s))")
                    ev_params.extend([like, like, like])
                # Nota: la tabla evidencias no tiene materia/ficha/docente; se usa join a estudiantes para ficha
                where_ev = ("WHERE " + " AND ".join(ev_filters)) if ev_filters else ""
                cur.execute(f"""
                    SELECT
                        e.documento AS documento,
                        s.nombre AS nombre,
                        s.apellido AS apellido,
                        s.correo AS email,
                        f.numero AS ficha_numero,
                        COUNT(*) AS total,
                        SUM(CASE WHEN e.letra = 'A' THEN 1 ELSE 0 END) AS aprobadas,
                        SUM(CASE WHEN e.letra = 'F' THEN 1 ELSE 0 END) AS desaprobadas,
                        SUM(CASE WHEN e.letra IS NULL OR e.letra = '-' THEN 1 ELSE 0 END) AS no_entregadas
                    FROM evidencias e
                    LEFT JOIN estudiantes s ON s.documento = e.documento
                    LEFT JOIN fichas f ON f.id = s.ficha_id
                    {where_ev}
                    GROUP BY e.documento, s.nombre, s.apellido, s.correo, f.numero
                    ORDER BY s.nombre NULLS LAST, s.apellido NULLS LAST
                    LIMIT %s
                """, ev_params + [limit])
                ev_rows = cur.fetchall() or []
                rows = ev_rows
            except Exception:
                # Fallback final: listar estudiantes base con métricas en 0
                est_filters = []
                est_params: List[Any] = []
                if ficha and ficha != "todos":
                    if ficha.isdigit():
                        est_filters.append("s.ficha_id = %s")
                        est_params.append(int(ficha))
                    else:
                        est_filters.append("f.numero = %s")
                        est_params.append(ficha)
                if search:
                    like = f"%{search}%"
                    est_filters.append("(LOWER(s.nombre) LIKE LOWER(%s) OR LOWER(s.apellido) LIKE LOWER(%s) OR LOWER(s.documento) LIKE LOWER(%s))")
                    est_params.extend([like, like, like])
                where_est = ("WHERE " + " AND ".join(est_filters)) if est_filters else ""
                cur.execute(f"""
                    SELECT s.documento, s.nombre, s.apellido, s.correo AS email, f.numero AS ficha_numero
                    FROM estudiantes s
                    LEFT JOIN fichas f ON f.id = s.ficha_id
                    {where_est}
                    ORDER BY s.nombre NULLS LAST, s.apellido NULLS LAST
                    LIMIT %s
                """, est_params + [limit])
                base_rows = cur.fetchall() or []
                rows = [{
                    "documento": r.get("documento"),
                    "nombre": r.get("nombre"),
                    "apellido": r.get("apellido"),
                    "email": r.get("email"),
                    "ficha_numero": r.get("ficha_numero"),
                    "total": 0,
                    "aprobadas": 0,
                    "desaprobadas": 0,
                    "no_entregadas": 0,
                } for r in base_rows]
            est_filters = []
            est_params: List[Any] = []
            if ficha and ficha != "todos":
                if ficha.isdigit():
                    est_filters.append("s.ficha_id = %s")
                    est_params.append(int(ficha))
                else:
                    est_filters.append("f.numero = %s")
                    est_params.append(ficha)
            if search:
                like = f"%{search}%"
                est_filters.append("(LOWER(s.nombre) LIKE LOWER(%s) OR LOWER(s.apellido) LIKE LOWER(%s) OR LOWER(s.documento) LIKE LOWER(%s))")
                est_params.extend([like, like, like])
            where_est = ("WHERE " + " AND ".join(est_filters)) if est_filters else ""
            cur.execute(f"""
                SELECT s.documento, s.nombre, s.apellido, s.correo AS email, f.numero AS ficha_numero
                FROM estudiantes s
                LEFT JOIN fichas f ON f.id = s.ficha_id
                {where_est}
                ORDER BY s.nombre NULLS LAST, s.apellido NULLS LAST
                LIMIT %s
            """, est_params + [limit])
            base_rows = cur.fetchall() or []
            rows = [{
                "documento": r.get("documento"),
                "nombre": r.get("nombre"),
                "apellido": r.get("apellido"),
                "email": r.get("email"),
                "ficha_numero": r.get("ficha_numero"),
                "total": 0,
                "aprobadas": 0,
                "desaprobadas": 0,
                "no_entregadas": 0,
            } for r in base_rows]
    data = []
    for r in rows:
        total = r.get("total") or 0
        aprobadas = r.get("aprobadas") or 0
        porcentaje = round((aprobadas / (total if total > 0 else 1)) * 100, 2)
        data.append({
            "id": r.get("documento") or "",
            "documento": r.get("documento") or "",
            "nombre": r.get("nombre") or "",
            "apellido": r.get("apellido") or "",
            "email": r.get("email") or None,
            "fichaNumero": r.get("ficha_numero") or None,
            "evidenciasTotal": total,
            "aprobadas": aprobadas,
            "desaprobadas": r.get("desaprobadas") or 0,
            "noEntregadas": r.get("no_entregadas") or 0,
            "porcentaje": porcentaje,
            "tendencia": "stable",
        })
    response = {"success": True, "data": data}
    _cache_set(cache_key, response)
    return response

# ----------------------------------------------------------------------------
# 2. Estado General
# ----------------------------------------------------------------------------
@router.get("/estado-general")
def estado_general(
    ficha_id: Optional[int] = Query(None),
    materia_id: Optional[int] = Query(None),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
):
    cache_key = _cache_key("estado_general", {
        "ficha_id": ficha_id,
        "materia_id": materia_id,
        "from": from_date,
        "to": to_date,
    })
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached
    date_start, date_end = _date_range(from_date, to_date, default_days=120)
    filters = ["e.created_at BETWEEN %s AND %s"]
    params: List[Any] = [date_start, date_end]
    if ficha_id is not None:
        filters.append("e.ficha_id = %s")
        params.append(ficha_id)
    if materia_id is not None:
        filters.append("e.materia_id = %s")
        params.append(materia_id)
    where_clause = "WHERE " + " AND ".join(filters)
    sql = f"""
    SELECT
      COALESCE(SUM(CASE WHEN e.letra = 'A' THEN 1 ELSE 0 END), 0) AS aprobados,
      COALESCE(SUM(CASE WHEN e.letra = 'F' THEN 1 ELSE 0 END), 0) AS reprobados,
      COALESCE(SUM(CASE WHEN e.letra IS NULL THEN 1 ELSE 0 END), 0) AS no_entregaron,
      COUNT(*) AS total
    FROM evidencias_detalle e
    {ACTIVE_JOIN}
    {where_clause}
    """
    with db_module.get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, params)
        row = cur.fetchone() or None
        if not row or (row.get("total") in (None, 0)):
            # Intentar con tabla evidencias
            cur.execute("""
                SELECT
                  COALESCE(SUM(CASE WHEN e.letra = 'A' THEN 1 ELSE 0 END), 0) AS aprobados,
                  COALESCE(SUM(CASE WHEN e.letra = 'F' THEN 1 ELSE 0 END), 0) AS reprobados,
                  COALESCE(SUM(CASE WHEN e.letra IS NULL OR e.letra = '-' THEN 1 ELSE 0 END), 0) AS no_entregaron,
                  COUNT(*) AS total
                FROM evidencias e
                WHERE e.created_at BETWEEN %s AND %s
            """, [date_start, date_end])
            row = cur.fetchone() or {"aprobados": 0, "reprobados": 0, "no_entregaron": 0, "total": 0}
    # Normalizar posibles None provenientes de SUM sobre cero filas
    for k in ("aprobados", "reprobados", "no_entregaron", "total"):
        row[k] = row.get(k) or 0
    total = row["total"]
    if total > 0:
        porcentajes = {
            "aprobados": round((row["aprobados"] / total) * 100, 2),
            "reprobados": round((row["reprobados"] / total) * 100, 2),
            "noEntregaron": round((row["no_entregaron"] / total) * 100, 2),
        }
    else:
        porcentajes = {"aprobados": 0.0, "reprobados": 0.0, "noEntregaron": 0.0}
    response = {"success": True, "data": {**row, "porcentajes": porcentajes}}
    _cache_set(cache_key, response)
    return response

# ----------------------------------------------------------------------------
# 3. Tendencia de Aprobación
# ----------------------------------------------------------------------------
@router.get("/tendencia-aprobacion")
def tendencia_aprobacion(
    intervalo: str = Query("semanal", pattern="^(semanal|mensual)$"),
    ficha_id: Optional[int] = Query(None),
    materia_id: Optional[int] = Query(None),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
):
    cache_key = _cache_key("tendencia_aprobacion", {
        "intervalo": intervalo,
        "ficha_id": ficha_id,
        "materia_id": materia_id,
        "from": from_date,
        "to": to_date,
    })
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached
    date_start, date_end = _date_range(from_date, to_date, default_days=90)
    granularity = "week" if intervalo == "semanal" else "month"
    filters = ["e.created_at BETWEEN %s AND %s"]
    params: List[Any] = [date_start, date_end]
    if ficha_id is not None:
        filters.append("e.ficha_id = %s")
        params.append(ficha_id)
    if materia_id is not None:
        filters.append("e.materia_id = %s")
        params.append(materia_id)
    where_clause = "WHERE " + " AND ".join(filters)
    sql = f"""
    SELECT DATE_TRUNC('{granularity}', e.created_at) AS periodo,
           COUNT(*) AS total,
           SUM(CASE WHEN e.letra = 'A' THEN 1 ELSE 0 END) AS aprobadas
    FROM evidencias_detalle e
    {ACTIVE_JOIN}
    {where_clause}
    GROUP BY DATE_TRUNC('{granularity}', e.created_at)
    ORDER BY periodo
    """
    with db_module.get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, params)
        rows = cur.fetchall() or []
        if not rows:
            # Intentar con evidencias (sin materia/ficha join disponible)
            cur.execute(f"""
                SELECT DATE_TRUNC('{granularity}', e.created_at) AS periodo,
                       COUNT(*) AS total,
                       SUM(CASE WHEN e.letra = 'A' THEN 1 ELSE 0 END) AS aprobadas
                FROM evidencias e
                WHERE e.created_at BETWEEN %s AND %s
                GROUP BY DATE_TRUNC('{granularity}', e.created_at)
                ORDER BY periodo
            """, [date_start, date_end])
            rows = cur.fetchall() or []
    data = []
    for idx, r in enumerate(rows):
        total = r["total"] or 0
        aprobadas = r["aprobadas"] or 0
        porcentaje = round((aprobadas / (total if total > 0 else 1)) * 100, 2)
        periodo_dt = r["periodo"]
        if not periodo_dt:
            continue
        if intervalo == "semanal":
            label = f"Sem {idx+1}"
            fecha_fin = periodo_dt + timedelta(days=6)
        else:
            label = periodo_dt.strftime("%b %Y")
            # Aproximar fin de mes sumando 31 días y retrocediendo
            fecha_fin = (periodo_dt + timedelta(days=31))
        data.append({
            "periodo": label,
            "fechaInicio": periodo_dt.strftime("%Y-%m-%d"),
            "fechaFin": fecha_fin.strftime("%Y-%m-%d"),
            "aprobacion": porcentaje,
            "totalEvidencias": total,
            "aprobadas": aprobadas,
        })
    response = {"success": True, "data": data}
    _cache_set(cache_key, response)
    return response

# ----------------------------------------------------------------------------
# 4. Rendimiento por Ficha
# ----------------------------------------------------------------------------
@router.get("/rendimiento-por-ficha")
def rendimiento_por_ficha(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    limit: int = Query(100, ge=1, le=500),
):
    cache_key = _cache_key("rendimiento_por_ficha", {
        "from": from_date,
        "to": to_date,
        "limit": limit,
    })
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached
    date_start, date_end = _date_range(from_date, to_date, default_days=120)
    sql = f"""
    SELECT f.id AS ficha_id, f.numero, f.nombre,
           COUNT(*) AS total_evidencias,
           SUM(CASE WHEN e.letra = 'A' THEN 1 ELSE 0 END) AS aprobadas,
           AVG(e.nota) AS promedio_nota,
           COUNT(DISTINCT e.estudiante_documento) AS total_estudiantes
    FROM fichas f
    JOIN evidencias_detalle e ON e.ficha_id = f.id
    {ACTIVE_JOIN}
    WHERE e.created_at BETWEEN %s AND %s
    GROUP BY f.id, f.numero, f.nombre
    ORDER BY aprobadas DESC
    LIMIT %s
    """
    params = [date_start, date_end, limit]
    with db_module.get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, params)
        rows = cur.fetchall() or []
        if not rows:
            # Fallback seguro: listar fichas con métricas en 0
            cur.execute(
                """
                SELECT f.id AS ficha_id, f.numero, f.nombre
                FROM fichas f
                ORDER BY f.numero
                LIMIT %s
                """,
                [limit]
            )
            base_rows = cur.fetchall() or []
            rows = [
                {
                    "ficha_id": r.get("ficha_id"),
                    "numero": r.get("numero"),
                    "nombre": r.get("nombre"),
                    "total_evidencias": 0,
                    "aprobadas": 0,
                    "promedio_nota": None,
                    "total_estudiantes": 0,
                }
                for r in base_rows
            ]
    data = []
    for r in rows:
        total = r["total_evidencias"] or 0
        aprobadas = r["aprobadas"] or 0
        porcentaje = round((aprobadas / (total if total > 0 else 1)) * 100, 2)
        promedio = round(r["promedio_nota"], 2) if r["promedio_nota"] is not None else None
        data.append({
            "fichaId": r["ficha_id"],
            "numero": r["numero"],
            "nombre": r["nombre"],
            "aprobacion": porcentaje,
            "promedio": promedio,
            "totalEstudiantes": r["total_estudiantes"],
            "evidenciasAprobadas": aprobadas,
            "evidenciasTotales": total,
        })
    response = {"success": True, "data": data}
    _cache_set(cache_key, response)
    return response

# ----------------------------------------------------------------------------
# 5. Rendimiento por Competencia
# ----------------------------------------------------------------------------
@router.get("/rendimiento-por-competencia")
def rendimiento_por_competencia(
    ficha_id: Optional[int] = Query(None),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
):
    cache_key = _cache_key("rendimiento_por_competencia", {
        "ficha_id": ficha_id,
        "from": from_date,
        "to": to_date,
    })
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached
    date_start, date_end = _date_range(from_date, to_date, default_days=120)
    filters = ["e.created_at BETWEEN %s AND %s", "m.competencia IS NOT NULL", "m.competencia <> ''"]
    params: List[Any] = [date_start, date_end]
    if ficha_id is not None:
        filters.append("m.ficha_id = %s")
        params.append(ficha_id)
    where_clause = "WHERE " + " AND ".join(filters)
    sql = f"""
    SELECT m.competencia,
           COUNT(*) AS total_evidencias,
           SUM(CASE WHEN e.letra = 'A' THEN 1 ELSE 0 END) AS aprobadas,
           ARRAY_AGG(DISTINCT m.nombre) AS materias_incluidas
    FROM materias m
    JOIN evidencias_detalle e ON e.materia_id = m.id
    {ACTIVE_JOIN}
    {where_clause}
    GROUP BY m.competencia
    ORDER BY m.competencia
    """
    with db_module.get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, params)
        rows = cur.fetchall() or []
    data = []
    for r in rows:
        total = r["total_evidencias"] or 0
        aprobadas = r["aprobadas"] or 0
        porcentaje = round((aprobadas / (total if total > 0 else 1)) * 100, 2)
        materias = r.get("materias_incluidas") or []
        if isinstance(materias, list):
            materias_simple = materias[:5]
        else:
            materias_simple = []
        data.append({
            "competencia": r["competencia"],
            "value": porcentaje,
            "materiasIncluidas": materias_simple,
            "totalEvidencias": total,
        })
    response = {"success": True, "data": data}
    _cache_set(cache_key, response)
    return response
