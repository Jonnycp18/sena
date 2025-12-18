from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from math import ceil
from psycopg.rows import dict_row
from psycopg import errors
from ..db import get_conn
from ..security import get_current_user_claims, pwd_context
from ..utils.audit import record_event

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("")
def list_users(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),  # camelCase to match frontend client
    search: Optional[str] = Query(None),
):
    offset = (page - 1) * pageSize

    filters = []
    params = []

    if search:
        filters.append("(email ILIKE %s OR nombre ILIKE %s OR apellido ILIKE %s)")
        like = f"%{search}%"
        params.extend([like, like, like])

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    # Query items
    items_sql = f"""
        SELECT id, email, nombre, apellido, rol, activo
        FROM users
        {where_clause}
        ORDER BY id DESC
        LIMIT %s OFFSET %s
    """

    # Query total count
    count_sql = f"""
        SELECT COUNT(*) as total
        FROM users
        {where_clause}
    """

    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        # total count first
        cur.execute(count_sql, params)
        total_row = cur.fetchone()
        total = int(total_row["total"]) if total_row else 0

        # items
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


# ----- Models -----
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    email: str = Field(pattern=r"^.+@.+\..+$")
    password: str = Field(min_length=6)
    nombre: str
    apellido: str
    rol: str = Field(pattern=r"^(Administrador|Coordinador|Docente)$")
    activo: bool = True
    telefono: Optional[str] = None
    avatar_url: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[str] = Field(default=None, pattern=r"^.+@.+\..+$")
    password: Optional[str] = Field(default=None, min_length=6)
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    rol: Optional[str] = Field(default=None, pattern=r"^(Administrador|Coordinador|Docente)$")
    activo: Optional[bool] = None
    telefono: Optional[str] = None
    avatar_url: Optional[str] = None


def _user_columns():
    return "id, email, nombre, apellido, rol, activo, avatar_url, telefono, created_at, updated_at"


@router.post("")
def create_user(payload: UserCreate, _: dict = Depends(get_current_user_claims)):
    hashed = pwd_context.hash(payload.password)
    sql = f"""
        INSERT INTO users (email, password_hash, nombre, apellido, rol, activo, telefono, avatar_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING {_user_columns()}
    """
    try:
        with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                sql,
                [
                    payload.email,
                    hashed,
                    payload.nombre,
                    payload.apellido,
                    payload.rol,
                    payload.activo,
                    payload.telefono,
                    payload.avatar_url,
                ],
            )
            user = cur.fetchone()
            # Audit
            try:
                record_event(conn,
                             accion="crear_usuario",
                             user_email=payload.email,
                             user_rol=payload.rol,
                             modulo="users",
                             entidad_tipo="usuario",
                             entidad_id=str(user.get("id")) if user else None,
                             detalles={"rol": payload.rol})
            except Exception:
                pass
        return {"success": True, "data": user}
    except errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="El email ya está registrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{user_id}")
def update_user(user_id: int, payload: UserUpdate, _: dict = Depends(get_current_user_claims)):
    fields = []
    params = []
    if payload.email is not None:
        fields.append("email = %s")
        params.append(payload.email)
    if payload.password is not None:
        fields.append("password_hash = %s")
        params.append(pwd_context.hash(payload.password))
    if payload.nombre is not None:
        fields.append("nombre = %s")
        params.append(payload.nombre)
    if payload.apellido is not None:
        fields.append("apellido = %s")
        params.append(payload.apellido)
    if payload.rol is not None:
        fields.append("rol = %s")
        params.append(payload.rol)
    if payload.activo is not None:
        fields.append("activo = %s")
        params.append(payload.activo)
    if payload.telefono is not None:
        fields.append("telefono = %s")
        params.append(payload.telefono)
    if payload.avatar_url is not None:
        fields.append("avatar_url = %s")
        params.append(payload.avatar_url)

    if not fields:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")

    params.append(user_id)
    sql = f"UPDATE users SET {', '.join(fields)} WHERE id = %s RETURNING {_user_columns()}"

    try:
        with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute(sql, params)
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            try:
                record_event(conn,
                             accion="actualizar_usuario",
                             modulo="users",
                             entidad_tipo="usuario",
                             entidad_id=str(user_id),
                             detalles={"fields": [f.split(" = ")[0] for f in fields]})
            except Exception:
                pass
        return {"success": True, "data": row}
    except errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="El email ya está registrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{user_id}/toggle")
def toggle_user(user_id: int, _: dict = Depends(get_current_user_claims)):
    sql = f"""
        UPDATE users SET activo = NOT activo WHERE id = %s
        RETURNING {_user_columns()}
    """
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, [user_id])
        row = cur.fetchone()
        try:
            record_event(conn,
                         accion="toggle_usuario",
                         modulo="users",
                         entidad_tipo="usuario",
                         entidad_id=str(user_id),
                         detalles={"activo": row.get("activo") if row else None})
        except Exception:
            pass
    if not row:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"success": True, "data": row}


@router.delete("/{user_id}")
def delete_user(user_id: int, _: dict = Depends(get_current_user_claims)):
    # Baja lógica: marcar activo = false
    sql = f"UPDATE users SET activo = false WHERE id = %s RETURNING {_user_columns()}"
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, [user_id])
        row = cur.fetchone()
        try:
            record_event(conn,
                         accion="baja_usuario",
                         modulo="users",
                         entidad_tipo="usuario",
                         entidad_id=str(user_id))
        except Exception:
            pass
    if not row:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"success": True, "data": row}


@router.get("/stats")
def users_stats(_: dict = Depends(get_current_user_claims)):
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT COUNT(*)::int AS total, SUM(CASE WHEN activo THEN 1 ELSE 0 END)::int AS activos, SUM(CASE WHEN NOT activo THEN 1 ELSE 0 END)::int AS inactivos FROM users")
        totals = cur.fetchone() or {"total": 0, "activos": 0, "inactivos": 0}
        cur.execute("SELECT rol, COUNT(*)::int AS cantidad FROM users GROUP BY rol ORDER BY rol")
        por_rol_rows = cur.fetchall() or []
    porRol = {r["rol"]: r["cantidad"] for r in por_rol_rows}
    return {"success": True, "data": {**totals, "porRol": porRol}}


@router.get("/{user_id}")
def get_user(user_id: int):
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            "SELECT id, email, nombre, apellido, rol, activo FROM users WHERE id = %s",
            [user_id],
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return row
