from fastapi import APIRouter, Query, HTTPException, Depends
from psycopg.rows import dict_row
from typing import Optional, List
from ..db import get_conn
from ..security import get_current_user_claims
from ..utils.audit import record_event

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])

# Tipos sugeridos por rol
ROLE_TYPES = {
    "Administrador": ["sistema", "usuario", "riesgo"],
    "Coordinador": ["riesgo", "curso", "aprobacion"],
    "Docente": ["calificacion", "curso", "estudiante"],
}

@router.get("")
def list_notifications(page: int = Query(1, ge=1),
                       pageSize: int = Query(20, ge=1, le=100),
                       unreadOnly: bool = Query(False),
                       tipo: Optional[str] = Query(None),
                       claims: dict = Depends(get_current_user_claims)):
    user_id = int(claims.get("sub")) if claims and claims.get("sub") else None
    if not user_id:
        return {"success": True, "data": [], "pagination": {"page": page, "pageSize": pageSize, "total": 0, "totalPages": 0}}
    offset = (page - 1) * pageSize
    filters: List[str] = ["user_id=%s"]
    params: List = [user_id]
    if unreadOnly:
        filters.append("read_at IS NULL")
    if tipo:
        filters.append("type=%s")
        params.append(tipo)
    where_clause = "WHERE " + " AND ".join(filters)
    count_sql = f"SELECT COUNT(*) FROM notifications {where_clause}"
    items_sql = f"SELECT id, type, message, created_at, read_at, priority, metadata FROM notifications {where_clause} ORDER BY created_at DESC LIMIT %s OFFSET %s"
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(count_sql, params)
        total = cur.fetchone()[0] if cur.rowcount != -1 else 0
        cur.execute(items_sql, [*params, pageSize, offset])
        rows = cur.fetchall() or []
    return {"success": True, "data": rows, "pagination": {"page": page, "pageSize": pageSize, "total": total, "totalPages": (total // pageSize) + (1 if total % pageSize else 0)}}

@router.get("/unread-count")
def unread_count(claims: dict = Depends(get_current_user_claims)):
    user_id = int(claims.get("sub")) if claims and claims.get("sub") else None
    if not user_id:
        return {"success": True, "data": {"unread": 0}}
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            cur.execute("SELECT COUNT(*) FROM notifications WHERE user_id=%s AND read_at IS NULL", [user_id])
            unread = cur.fetchone()[0]
        except Exception:
            unread = 0
    return {"success": True, "data": {"unread": unread}}

@router.post("/mark-read")
def mark_read(ids: List[int], claims: dict = Depends(get_current_user_claims)):
    if not ids:
        raise HTTPException(status_code=400, detail="Lista vacía")
    user_id = int(claims.get("sub")) if claims and claims.get("sub") else None
    if not user_id:
        raise HTTPException(status_code=401, detail="No autorizado")
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            cur.execute("UPDATE notifications SET read_at=NOW() WHERE user_id=%s AND id = ANY(%s) RETURNING id", [user_id, ids])
            updated = [r[0] if not isinstance(r, dict) else r['id'] for r in cur.fetchall() or []]
            record_event(conn,
                         accion="mark_read_notifications",
                         user_id=user_id,
                         modulo="notifications",
                         detalles={"ids": updated})
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=500, detail=str(e))
    return {"success": True, "data": {"updated": updated}}

@router.get("/summary")
def notifications_summary(claims: dict = Depends(get_current_user_claims)):
    user_id = int(claims.get("sub")) if claims and claims.get("sub") else None
    rol = claims.get("rol") if claims else None
    if not user_id:
        return {"success": True, "data": {"unread": 0, "porTipo": {}, "recientes": []}}
    tipos_allow = ROLE_TYPES.get(rol) or []
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        por_tipo = {}
        try:
            cur.execute("""
                SELECT type, COUNT(*) AS c
                FROM notifications
                WHERE user_id=%s
                GROUP BY type
            """, [user_id])
            for r in cur.fetchall() or []:
                t = r.get("type") if isinstance(r, dict) else r[0]
                c = r.get("c") if isinstance(r, dict) else r[1]
                if not tipos_allow or t in tipos_allow:
                    por_tipo[t] = c
        except Exception:
            por_tipo = {}
        try:
            cur.execute("SELECT COUNT(*) FROM notifications WHERE user_id=%s AND read_at IS NULL", [user_id])
            unread = cur.fetchone()[0]
        except Exception:
            unread = 0
        try:
            cur.execute("""
                SELECT id, type, message, created_at, priority, read_at
                FROM notifications
                WHERE user_id=%s
                ORDER BY created_at DESC
                LIMIT 10
            """, [user_id])
            recientes = cur.fetchall() or []
        except Exception:
            recientes = []
    return {"success": True, "data": {"unread": unread, "porTipo": por_tipo, "recientes": recientes, "tiposPermitidos": tipos_allow}}
