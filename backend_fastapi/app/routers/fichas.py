from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List, Dict
from math import ceil
from psycopg.rows import dict_row
from psycopg import errors
from ..db import get_conn
from ..security import get_current_user_claims
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/fichas", tags=["fichas"])


@router.get("")
def list_fichas(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
):
    offset = (page - 1) * pageSize

    filters = []
    params = []

    if search:
        filters.append("(numero ILIKE %s OR nombre ILIKE %s)")
        like = f"%{search}%"
        params.extend([like, like])

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    items_sql = f"""
        SELECT id, numero, nombre, descripcion, estado, created_at
        FROM fichas
        {where_clause}
        ORDER BY id DESC
        LIMIT %s OFFSET %s
    """

    count_sql = f"""
        SELECT COUNT(*) AS total
        FROM fichas
        {where_clause}
    """

    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(count_sql, params)
        total_row = cur.fetchone()
        total = int(total_row["total"]) if total_row else 0

        cur.execute(items_sql, [*params, pageSize, offset])
        items = cur.fetchall() or []

    return {
        "success": True,
        "data": items,
        "pagination": {
            "page": page,
            "pageSize": pageSize,
            "total": total,
            "totalPages": ceil(total / pageSize) if pageSize else 0,
        },
    }


@router.get("/{ficha_id}")
def get_ficha(ficha_id: int):
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            SELECT id, numero, nombre, descripcion, estado, created_at
            FROM fichas WHERE id = %s
            """,
            [ficha_id],
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")
    return row


# ----- Models -----

class FichaCreate(BaseModel):
    numero: str
    nombre: str
    descripcion: Optional[str] = None
    fecha_inicio: str  # YYYY-MM-DD
    fecha_fin: str     # YYYY-MM-DD
    coordinador_id: Optional[int] = None
    estado: str = Field(default="Activa", pattern=r"^(Activa|Inactiva|Finalizada)$")


class FichaUpdate(BaseModel):
    numero: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    coordinador_id: Optional[int] = None
    estado: Optional[str] = Field(default=None, pattern=r"^(Activa|Inactiva|Finalizada)$")


def _ficha_columns():
    return (
        "id, numero, nombre, descripcion, fecha_inicio, fecha_fin, coordinador_id, estado, "
        "created_at, updated_at, created_by, updated_by"
    )


@router.post("")
def create_ficha(payload: FichaCreate, claims: dict = Depends(get_current_user_claims)):
    user_id = int(claims["sub"]) if claims and claims.get("sub") else None
    sql = f"""
        INSERT INTO fichas (numero, nombre, descripcion, fecha_inicio, fecha_fin, coordinador_id, estado, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING {_ficha_columns()}
    """
    try:
        with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                sql,
                [
                    payload.numero,
                    payload.nombre,
                    payload.descripcion,
                    payload.fecha_inicio,
                    payload.fecha_fin,
                    payload.coordinador_id,
                    payload.estado,
                    user_id,
                    user_id,
                ],
            )
            row = cur.fetchone()
        return {"success": True, "data": row}
    except errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="El número de ficha ya existe")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{ficha_id}")
def update_ficha(ficha_id: int, payload: FichaUpdate, claims: dict = Depends(get_current_user_claims)):
    fields = []
    params: List = []
    if payload.numero is not None:
        fields.append("numero = %s")
        params.append(payload.numero)
    if payload.nombre is not None:
        fields.append("nombre = %s")
        params.append(payload.nombre)
    if payload.descripcion is not None:
        fields.append("descripcion = %s")
        params.append(payload.descripcion)
    if payload.fecha_inicio is not None:
        fields.append("fecha_inicio = %s")
        params.append(payload.fecha_inicio)
    if payload.fecha_fin is not None:
        fields.append("fecha_fin = %s")
        params.append(payload.fecha_fin)
    if payload.coordinador_id is not None:
        fields.append("coordinador_id = %s")
        params.append(payload.coordinador_id)
    if payload.estado is not None:
        fields.append("estado = %s")
        params.append(payload.estado)

    if not fields:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")

    # set updated_by
    user_id = int(claims.get("sub")) if claims and claims.get("sub") else None
    fields.append("updated_by = %s")
    params.append(user_id)

    params.append(ficha_id)
    sql = f"UPDATE fichas SET {', '.join(fields)} WHERE id = %s RETURNING {_ficha_columns()}"
    try:
        with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute(sql, params)
            row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Ficha no encontrada")
        return {"success": True, "data": row}
    except errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="El número de ficha ya existe")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{ficha_id}")
def delete_ficha(ficha_id: int, _: dict = Depends(get_current_user_claims)):
    # Eliminación física (CASCADE limpia materias y calificaciones de esa ficha)
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute("DELETE FROM fichas WHERE id = %s RETURNING id, numero, nombre", [ficha_id])
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Ficha no encontrada")
    return {"success": True, "data": row}


@router.get("/{ficha_id}/materias")
def get_ficha_materias(ficha_id: int):
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            SELECT id, codigo, nombre, descripcion, creditos,
                   horas_semanales AS horas, docente_id, estado
            FROM materias
            WHERE ficha_id = %s
            ORDER BY codigo
            """,
            [ficha_id],
        )
        items = cur.fetchall() or []
    return {"success": True, "data": items}


@router.get("/{ficha_id}/estudiantes")
def get_ficha_estudiantes(ficha_id: int):
    # Derivamos de calificaciones: estudiantes con calificaciones en esa ficha
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            SELECT DISTINCT estudiante_documento AS documento, estudiante_nombre AS nombre
            FROM calificaciones
            WHERE ficha_id = %s
            ORDER BY nombre
            """,
            [ficha_id],
        )
        items = cur.fetchall() or []
    return {"success": True, "data": items}


@router.get("/stats")
def fichas_stats():
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            "SELECT COUNT(*)::int AS total, "
            "SUM(CASE WHEN estado = 'Activa' THEN 1 ELSE 0 END)::int AS activas, "
            "SUM(CASE WHEN estado = 'Inactiva' THEN 1 ELSE 0 END)::int AS inactivas, "
            "SUM(CASE WHEN estado = 'Finalizada' THEN 1 ELSE 0 END)::int AS finalizadas "
            "FROM fichas"
        )
        totals = cur.fetchone() or {"total": 0, "activas": 0, "inactivas": 0, "finalizadas": 0}
        cur.execute("SELECT estado, COUNT(*)::int AS cantidad FROM fichas GROUP BY estado ORDER BY estado")
        by_estado_rows = cur.fetchall() or []
    byEstado: Dict[str, int] = {r["estado"]: r["cantidad"] for r in by_estado_rows}
    return {"success": True, "data": {**totals, "porEstado": byEstado}}
