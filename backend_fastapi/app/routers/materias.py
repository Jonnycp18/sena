from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List, Dict
from math import ceil
from psycopg.rows import dict_row
from psycopg import errors
from ..db import get_conn
from ..security import get_current_user_claims
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/materias", tags=["materias"])


@router.get("")
def list_materias(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=200),
    search: Optional[str] = Query(None),
    fichaId: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
):
    offset = (page - 1) * pageSize

    filters = []
    params = []

    if search:
        filters.append("(codigo ILIKE %s OR nombre ILIKE %s)")
        like = f"%{search}%"
        params.extend([like, like])

    if fichaId is not None:
        filters.append("ficha_id = %s")
        params.append(fichaId)

    if estado:
        filters.append("estado ILIKE %s")
        params.append(estado)

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    items_sql = f"""
        SELECT id, codigo, nombre, descripcion, creditos,
               horas_semanales AS horas, ficha_id, docente_id, estado
        FROM materias
        {where_clause}
        ORDER BY codigo
        LIMIT %s OFFSET %s
    """

    count_sql = f"""
        SELECT COUNT(*) AS total
        FROM materias
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


@router.get("/{materia_id}")
def get_materia(materia_id: int):
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            SELECT id, codigo, nombre, descripcion, creditos,
                   horas_semanales AS horas, ficha_id, docente_id, estado
            FROM materias WHERE id = %s
            """,
            [materia_id],
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Materia no encontrada")
    return row


# ----- Models -----
class MateriaCreate(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    creditos: int = 0
    horas_semanales: int = 0
    ficha_id: int
    docente_id: Optional[int] = None
    estado: str = Field(default="Activa", pattern=r"^(Activa|Inactiva|Finalizada)$")


class MateriaUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    creditos: Optional[int] = None
    horas_semanales: Optional[int] = None
    ficha_id: Optional[int] = None
    docente_id: Optional[int] = None
    estado: Optional[str] = Field(default=None, pattern=r"^(Activa|Inactiva|Finalizada)$")


def _materia_columns():
    return (
        "id, codigo, nombre, descripcion, creditos, horas_semanales AS horas, ficha_id, docente_id, estado, created_at, updated_at, created_by, updated_by"
    )


@router.post("")
def create_materia(payload: MateriaCreate, claims: dict = Depends(get_current_user_claims)):
    user_id = int(claims.get("sub")) if claims and claims.get("sub") else None
    sql = f"""
        INSERT INTO materias (codigo, nombre, descripcion, creditos, horas_semanales, ficha_id, docente_id, estado, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING {_materia_columns()}
    """
    try:
        with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                sql,
                [
                    payload.codigo,
                    payload.nombre,
                    payload.descripcion,
                    payload.creditos,
                    payload.horas_semanales,
                    payload.ficha_id,
                    payload.docente_id,
                    payload.estado,
                    user_id,
                    user_id,
                ],
            )
            row = cur.fetchone()
        return {"success": True, "data": row}
    except errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="El código ya existe")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{materia_id}")
def update_materia(materia_id: int, payload: MateriaUpdate, claims: dict = Depends(get_current_user_claims)):
    fields: List[str] = []
    params: List = []
    if payload.codigo is not None:
        fields.append("codigo = %s")
        params.append(payload.codigo)
    if payload.nombre is not None:
        fields.append("nombre = %s")
        params.append(payload.nombre)
    if payload.descripcion is not None:
        fields.append("descripcion = %s")
        params.append(payload.descripcion)
    if payload.creditos is not None:
        fields.append("creditos = %s")
        params.append(payload.creditos)
    if payload.horas_semanales is not None:
        fields.append("horas_semanales = %s")
        params.append(payload.horas_semanales)
    if payload.ficha_id is not None:
        fields.append("ficha_id = %s")
        params.append(payload.ficha_id)
    if payload.docente_id is not None:
        fields.append("docente_id = %s")
        params.append(payload.docente_id)
    if payload.estado is not None:
        fields.append("estado = %s")
        params.append(payload.estado)

    if not fields:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")

    # updated_by
    user_id = int(claims.get("sub")) if claims and claims.get("sub") else None
    fields.append("updated_by = %s")
    params.append(user_id)

    params.append(materia_id)
    sql = f"UPDATE materias SET {', '.join(fields)} WHERE id = %s RETURNING {_materia_columns()}"
    try:
        with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute(sql, params)
            row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Materia no encontrada")
        return {"success": True, "data": row}
    except errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="El código ya existe")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{materia_id}")
def delete_materia(materia_id: int, _: dict = Depends(get_current_user_claims)):
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute("DELETE FROM materias WHERE id = %s RETURNING id, codigo, nombre", [materia_id])
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Materia no encontrada")
    return {"success": True, "data": row}


@router.get("/{materia_id}/calificaciones")
def get_materia_calificaciones(materia_id: int):
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            SELECT id, estudiante_documento, estudiante_nombre, trimestre, nota, estado, fecha_carga
            FROM calificaciones
            WHERE materia_id = %s
            ORDER BY estudiante_nombre, trimestre
            """,
            [materia_id],
        )
        items = cur.fetchall() or []
    return {"success": True, "data": items}


@router.get("/docente/{docente_id}")
def get_materias_docente(docente_id: int):
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            SELECT id, codigo, nombre, creditos, horas_semanales AS horas, ficha_id, estado
            FROM materias
            WHERE docente_id = %s
            ORDER BY codigo
            """,
            [docente_id],
        )
        items = cur.fetchall() or []
    return {"success": True, "data": items}


@router.get("/stats")
def materias_stats():
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            "SELECT COUNT(*)::int AS total, "
            "SUM(CASE WHEN estado = 'Activa' THEN 1 ELSE 0 END)::int AS activas, "
            "SUM(CASE WHEN estado = 'Inactiva' THEN 1 ELSE 0 END)::int AS inactivas, "
            "SUM(CASE WHEN estado = 'Finalizada' THEN 1 ELSE 0 END)::int AS finalizadas "
            "FROM materias"
        )
        totals = cur.fetchone() or {"total": 0, "activas": 0, "inactivas": 0, "finalizadas": 0}
        cur.execute("SELECT estado, COUNT(*)::int AS cantidad FROM materias GROUP BY estado ORDER BY estado")
        by_estado_rows = cur.fetchall() or []
        cur.execute("SELECT ficha_id, COUNT(*)::int AS cantidad FROM materias GROUP BY ficha_id ORDER BY ficha_id")
        by_ficha_rows = cur.fetchall() or []
    porEstado: Dict[str, int] = {r["estado"]: r["cantidad"] for r in by_estado_rows}
    porFicha: Dict[int, int] = {r["ficha_id"]: r["cantidad"] for r in by_ficha_rows}
    return {"success": True, "data": {**totals, "porEstado": porEstado, "porFicha": porFicha}}
