from fastapi import APIRouter, HTTPException, Query, Body, Depends
from psycopg.rows import dict_row
from typing import Optional, List, Dict, Any
from ..db import get_conn
from ..security import get_current_user_claims

router = APIRouter(prefix="/api/v1/evidencias/definiciones", tags=["evidencias-definiciones"])

def _row_to_dict(row: Any) -> Dict[str, Any]:
    if isinstance(row, dict):
        return row
    # fallback positional
    return {}

@router.get("")
def listar_definiciones(
    materiaId: Optional[int] = Query(None),
    fichaId: Optional[int] = Query(None),
    docenteId: Optional[int] = Query(None),
):
    filters = []
    params: List[Any] = []
    if materiaId is not None:
        filters.append("materia_id=%s")
        params.append(materiaId)
    if fichaId is not None:
        filters.append("ficha_id=%s")
        params.append(fichaId)
    if docenteId is not None:
        filters.append("docente_id=%s")
        params.append(docenteId)
    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
    sql = f"SELECT id, nombre, ficha_id, materia_id, docente_id, activa, semana_activacion, fecha_activacion, tipo, peso, porcentaje, orden, created_at FROM evidencia_definicion {where_clause} ORDER BY orden, nombre"
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, params)
        rows = cur.fetchall() or []
    return {"success": True, "data": rows}

@router.post("")
def crear_definicion(
    payload: Dict[str, Any] = Body(...),
    _: dict = Depends(get_current_user_claims)
):
    required = ["nombre", "materia_id", "ficha_id"]
    for r in required:
        if r not in payload:
            raise HTTPException(status_code=400, detail=f"Falta campo requerido: {r}")
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            cur.execute(
                """
                INSERT INTO evidencia_definicion (nombre, ficha_id, materia_id, docente_id, activa, semana_activacion, fecha_activacion, tipo, peso, porcentaje, orden)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING *
                """,
                [
                    payload["nombre"], payload["ficha_id"], payload["materia_id"], payload.get("docente_id"),
                    bool(payload.get("activa", False)), payload.get("semana_activacion"), payload.get("fecha_activacion"),
                    payload.get("tipo"), payload.get("peso"), payload.get("porcentaje"), payload.get("orden", 0)
                ]
            )
            row = cur.fetchone()
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=400, detail=f"Error creando definición: {e}")
    return {"success": True, "data": row}

@router.patch("/{definicion_id}")
def actualizar_definicion(definicion_id: int, payload: Dict[str, Any] = Body(...), _: dict = Depends(get_current_user_claims)):
    allowed = ["nombre", "activa", "semana_activacion", "fecha_activacion", "tipo", "peso", "porcentaje", "orden", "docente_id"]
    sets = []
    params: List[Any] = []
    for k in allowed:
        if k in payload:
            sets.append(f"{k}=%s")
            params.append(payload[k])
    if not sets:
        raise HTTPException(status_code=400, detail="Nada para actualizar")
    params.append(definicion_id)
    sql = f"UPDATE evidencia_definicion SET {', '.join(sets)} WHERE id=%s RETURNING *"
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            cur.execute(sql, params)
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Definición no encontrada")
            conn.commit()
        except HTTPException:
            raise
        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=400, detail=f"Error actualizando definición: {e}")
    return {"success": True, "data": row}

@router.patch("/activar")
def activar_definiciones(ids: List[int] = Body(..., embed=True)):
    if not ids:
        raise HTTPException(status_code=400, detail="Lista vacía")
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute("UPDATE evidencia_definicion SET activa=TRUE WHERE id = ANY(%s) RETURNING id", [ids])
        updated = cur.fetchall() or []
        conn.commit()
    return {"success": True, "actualizados": [r["id"] for r in updated]}

@router.patch("/desactivar")
def desactivar_definiciones(ids: List[int] = Body(..., embed=True)):
    if not ids:
        raise HTTPException(status_code=400, detail="Lista vacía")
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute("UPDATE evidencia_definicion SET activa=FALSE WHERE id = ANY(%s) RETURNING id", [ids])
        updated = cur.fetchall() or []
        conn.commit()
    return {"success": True, "actualizados": [r["id"] for r in updated]}

@router.get("/resumen")
def resumen_definiciones(materiaId: int = Query(...)):
    # Nota: evidencias actuales no tienen materia_id; agregamos métricas por nombre globalmente.
    sql_defs = "SELECT id, nombre, activa, orden FROM evidencia_definicion WHERE materia_id=%s ORDER BY orden, nombre"
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql_defs, [materiaId])
        defs = cur.fetchall() or []
        nombres = [d['nombre'] for d in defs]
        metrics_map = {}
        if nombres:
            # Métricas solo para definiciones activas (cuando se requiera filtrar faltantes)
            cur.execute("""
                SELECT evidencia_nombre AS nombre,
                       COUNT(*) AS total,
                       SUM(CASE WHEN letra IS NOT NULL THEN 1 ELSE 0 END) AS calificadas,
                       SUM(CASE WHEN letra IS NOT NULL AND letra <> '-' THEN 1 ELSE 0 END) AS entregadas,
                       SUM(CASE WHEN letra IS NULL THEN 1 ELSE 0 END) AS pendientes,
                       SUM(CASE WHEN letra='-' THEN 1 ELSE 0 END) AS no_entrego
                FROM evidencias
                WHERE evidencia_nombre = ANY(%s)
                GROUP BY evidencia_nombre
            """, [nombres])
            for r in cur.fetchall() or []:
                metrics_map[r['nombre']] = r
    enriched = []
    for d in defs:
        m = metrics_map.get(d['nombre'], {})
        # Si la definición no está activa, no contar pendientes como faltantes
        pendientes = m.get('pendientes', 0) if d['activa'] else 0
        no_entrego = m.get('no_entrego', 0) if d['activa'] else 0
        enriched.append({
            **d,
            "total": m.get('total', 0),
            "calificadas": m.get('calificadas', 0),
            "entregadas": m.get('entregadas', 0),
            "pendientes": pendientes,
            "noEntrego": no_entrego
        })
    return {"success": True, "data": enriched}
