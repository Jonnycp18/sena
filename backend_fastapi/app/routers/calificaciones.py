from fastapi import APIRouter, HTTPException, Query, Depends, UploadFile, File
from typing import Optional, List, Tuple
from math import ceil
from psycopg.rows import dict_row
from ..db import get_conn
from ..security import get_current_user_claims
from ..utils.audit import record_event
from pydantic import BaseModel, Field
from fastapi.responses import StreamingResponse
import io
import pandas as pd
import datetime

router = APIRouter(prefix="/api/v1/calificaciones", tags=["calificaciones"])


# -------------------- Models --------------------
class CalificacionCreate(BaseModel):
    materia_id: int
    ficha_id: int
    estudiante_nombre: str
    estudiante_documento: str
    trimestre: int = Field(ge=1, le=4)
    # Nota puede venir como letra 'A'/'F' o número; se normaliza internamente
    nota: Optional[str] = Field(default=None)
    estado: Optional[str] = Field(default="Cursando", pattern=r"^(Aprobado|Reprobado|Cursando)$")
    observaciones: Optional[str] = None


class CalificacionUpdate(BaseModel):
    materia_id: Optional[int] = None
    ficha_id: Optional[int] = None
    estudiante_nombre: Optional[str] = None
    estudiante_documento: Optional[str] = None
    trimestre: Optional[int] = Field(default=None, ge=1, le=4)
    nota: Optional[str] = Field(default=None)  # acepta 'A'/'F' o número
    estado: Optional[str] = Field(default=None, pattern=r"^(Aprobado|Reprobado|Cursando)$")
    observaciones: Optional[str] = None


def _cols():
    return (
        "id, materia_id, ficha_id, estudiante_nombre, estudiante_documento, trimestre, nota, estado, observaciones, "
        "fecha_carga, cargado_por, created_at, updated_at"
    )


# Helper para derivar letra desde nota
def _derive_letra(nota) -> Optional[str]:
    if nota is None:
        return None
    try:
        v = float(nota)
    except Exception:
        return None
    return "A" if v >= 3.0 else "F"

# -------------------- List --------------------
@router.get("")
def list_calificaciones(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=200),
    search: Optional[str] = Query(None),  # busca por nombre o documento
    materiaId: Optional[int] = Query(None),
    fichaId: Optional[int] = Query(None),
    trimestre: Optional[int] = Query(None, ge=1, le=4),
    estado: Optional[str] = Query(None),
):
    offset = (page - 1) * pageSize
    filters: List[str] = []
    params: List = []

    if search:
        filters.append("(estudiante_documento ILIKE %s OR estudiante_nombre ILIKE %s)")
        like = f"%{search}%"
        params.extend([like, like])
    if materiaId is not None:
        filters.append("materia_id = %s")
        params.append(materiaId)
    if fichaId is not None:
        filters.append("ficha_id = %s")
        params.append(fichaId)
    if trimestre is not None:
        filters.append("trimestre = %s")
        params.append(trimestre)
    if estado:
        filters.append("estado = %s")
        params.append(estado)

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    items_sql = f"""
        SELECT {_cols()}
        FROM calificaciones
        {where_clause}
        ORDER BY estudiante_nombre, trimestre
        LIMIT %s OFFSET %s
    """
    count_sql = f"SELECT COUNT(*) AS total FROM calificaciones {where_clause}"

    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(count_sql, params)
        total_row = cur.fetchone()
        total = int(total_row["total"]) if total_row else 0
        cur.execute(items_sql, [*params, pageSize, offset])
        items = cur.fetchall() or []

    # Añadir letra derivada
    for r in items:
        r["letra"] = _derive_letra(r.get("nota"))
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


# -------------------- Detail --------------------
@router.get("/{calificacion_id}")
def get_calificacion(calificacion_id: int):
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(f"SELECT {_cols()} FROM calificaciones WHERE id = %s", [calificacion_id])
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Calificación no encontrada")
    row["letra"] = _derive_letra(row.get("nota"))
    return row


# -------------------- Create --------------------
@router.post("")
def create_calificacion(payload: CalificacionCreate, claims: dict = Depends(get_current_user_claims)):
    user_id = int(claims.get("sub")) if claims and claims.get("sub") else None
    user_email = claims.get("email") if claims else None
    user_rol = claims.get("rol") if claims else None
    sql = f"""
        INSERT INTO calificaciones (materia_id, ficha_id, estudiante_nombre, estudiante_documento, trimestre, nota, estado, observaciones, cargado_por)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING {_cols()}
    """
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        # Normalizar nota: si viene 'A'/'F' convertir a numérico
        nota_val = None
        if payload.nota is not None:
            try:
                if isinstance(payload.nota, str) and payload.nota.upper() in ("A", "F"):
                    nota_val = 5.0 if payload.nota.upper() == "A" else 2.0
                else:
                    nota_val = float(payload.nota)
            except Exception:
                nota_val = None
        cur.execute(
            sql,
            [
                payload.materia_id,
                payload.ficha_id,
                payload.estudiante_nombre,
                payload.estudiante_documento,
                payload.trimestre,
                nota_val,
                payload.estado,
                payload.observaciones,
                user_id,
            ],
        )
        row = cur.fetchone()
        # Audit
        try:
            record_event(conn,
                         accion="crear_calificacion",
                         user_id=user_id,
                         user_email=user_email,
                         user_rol=user_rol,
                         modulo="calificaciones",
                         entidad_tipo="calificacion",
                         entidad_id=str(row.get("id")) if row else None,
                         detalles={"materia_id": payload.materia_id, "ficha_id": payload.ficha_id, "trimestre": payload.trimestre})
        except Exception:
            pass
    return {"success": True, "data": row}


# -------------------- Update --------------------
@router.put("/{calificacion_id}")
def update_calificacion(calificacion_id: int, payload: CalificacionUpdate, _: dict = Depends(get_current_user_claims)):
    fields: List[str] = []
    params: List = []
    if payload.materia_id is not None:
        fields.append("materia_id = %s")
        params.append(payload.materia_id)
    if payload.ficha_id is not None:
        fields.append("ficha_id = %s")
        params.append(payload.ficha_id)
    if payload.estudiante_nombre is not None:
        fields.append("estudiante_nombre = %s")
        params.append(payload.estudiante_nombre)
    if payload.estudiante_documento is not None:
        fields.append("estudiante_documento = %s")
        params.append(payload.estudiante_documento)
    if payload.trimestre is not None:
        fields.append("trimestre = %s")
        params.append(payload.trimestre)
    if payload.nota is not None:
        # convertir 'A'/'F' si aplica
        nota_conv = payload.nota
        try:
            if isinstance(nota_conv, str) and nota_conv.upper() in ("A","F"):
                nota_conv = 5.0 if nota_conv.upper() == "A" else 2.0
            else:
                nota_conv = float(nota_conv)
        except Exception:
            nota_conv = None
        fields.append("nota = %s")
        params.append(nota_conv)
    if payload.estado is not None:
        fields.append("estado = %s")
        params.append(payload.estado)
    if payload.observaciones is not None:
        fields.append("observaciones = %s")
        params.append(payload.observaciones)

    if not fields:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")

    params.append(calificacion_id)
    sql = f"UPDATE calificaciones SET {', '.join(fields)} WHERE id = %s RETURNING {_cols()}"
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, params)
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Calificación no encontrada")
    row["letra"] = _derive_letra(row.get("nota"))
    try:
        record_event(conn,
                     accion="actualizar_calificacion",
                     entidad_tipo="calificacion",
                     entidad_id=str(calificacion_id),
                     modulo="calificaciones",
                     detalles={"fields": [f.split(" = ")[0] for f in fields]})
    except Exception:
        pass
    return {"success": True, "data": row}


# -------------------- Delete --------------------
@router.delete("/{calificacion_id}")
def delete_calificacion(calificacion_id: int, _: dict = Depends(get_current_user_claims)):
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute("DELETE FROM calificaciones WHERE id = %s RETURNING id", [calificacion_id])
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Calificación no encontrada")
    row["letra"] = _derive_letra(row.get("nota"))
    try:
        record_event(conn,
                     accion="eliminar_calificacion",
                     entidad_tipo="calificacion",
                     entidad_id=str(calificacion_id),
                     modulo="calificaciones")
    except Exception:
        pass
    return {"success": True, "data": row}


# -------------------- Extra Queries --------------------
@router.get("/materia/{materia_id}")
def calificaciones_por_materia(materia_id: int):
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            f"SELECT {_cols()} FROM calificaciones WHERE materia_id = %s ORDER BY estudiante_nombre, trimestre",
            [materia_id],
        )
        items = cur.fetchall() or []
    for r in items:
        r["letra"] = _derive_letra(r.get("nota"))
    return {"success": True, "data": items}


@router.get("/estudiante/{documento}")
def calificaciones_por_estudiante(documento: str):
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            f"SELECT {_cols()} FROM calificaciones WHERE estudiante_documento = %s ORDER BY trimestre",
            [documento],
        )
        items = cur.fetchall() or []
    for r in items:
        r["letra"] = _derive_letra(r.get("nota"))
    return {"success": True, "data": items}


# -------------------- Upload (Excel con upsert) --------------------
REQUIRED_CORE = ["estudiante_nombre", "estudiante_documento", "trimestre"]  # requiere nota o letra
ID_VARIANTS = ["materia_id", "materia_codigo"]
FICHA_VARIANTS = ["ficha_id", "ficha_numero"]
OPTIONAL_COLUMNS = ["estado", "observaciones"]

def _validate_df(df: pd.DataFrame) -> Tuple[List[str], List[str]]:
    present_lower = {c.lower() for c in df.columns}
    missing = [c for c in REQUIRED_CORE if c.lower() not in present_lower]
    if not ("nota" in present_lower or "letra" in present_lower):
        missing.append("(nota|letra)")
    if not any(v in present_lower for v in ID_VARIANTS):
        missing.append("(materia_id|materia_codigo)")
    if not any(v in present_lower for v in FICHA_VARIANTS):
        missing.append("(ficha_id|ficha_numero)")
    allowed = set([*REQUIRED_CORE, *ID_VARIANTS, *FICHA_VARIANTS, *OPTIONAL_COLUMNS, "nota", "letra"])
    unexpected = [c for c in df.columns if c.lower() not in allowed]
    return missing, unexpected


@router.post("/upload")
def upload_calificaciones(
    file: UploadFile = File(...),
    claims: dict = Depends(get_current_user_claims),
    dryRun: bool = Query(False, description="Si true no escribe en DB, solo muestra validaciones"),
):
    if not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Formato no soportado, use .xlsx/.xls")
    content = file.file.read()
    try:
        df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error leyendo Excel: {e}")
    if df.empty:
        raise HTTPException(status_code=400, detail="El archivo está vacío")
    df.columns = [c.strip() for c in df.columns]
    missing, unexpected = _validate_df(df)
    if missing:
        raise HTTPException(status_code=400, detail="Columnas faltantes: " + ", ".join(missing))
    df.rename(columns={c: c.lower() for c in df.columns}, inplace=True)
    df["estudiante_nombre"] = df["estudiante_nombre"].astype(str).str.strip()
    df["estudiante_documento"] = df["estudiante_documento"].astype(str).str.strip()
    if "nota" not in df.columns and "letra" in df.columns:
        df["nota"] = df["letra"]

    # Validaciones de rango / letras
    validation_errors: List[str] = []
    for idx, row in df.iterrows():
        try:
            t = int(row["trimestre"])
            if t < 1 or t > 4:
                validation_errors.append(f"Fila {idx+2}: trimestre fuera de rango (1-4)")
            if pd.notna(row.get("nota")):
                val = str(row.get("nota")).strip().upper()
                if val in ("A","F"):
                    pass  # válido
                else:
                    try:
                        n = float(val)
                        if n < 0 or n > 5:
                            validation_errors.append(f"Fila {idx+2}: nota fuera de rango (0-5)")
                    except Exception:
                        validation_errors.append(f"Fila {idx+2}: nota inválida (usar A/F o número 0-5)")
        except Exception as e:
            validation_errors.append(f"Fila {idx+2}: error validando - {e}")
    if validation_errors and dryRun:
        return {
            "success": False,
            "dryRun": True,
            "errors": validation_errors[:50],
            "unexpected_columns": unexpected,
        }
    if validation_errors:
        raise HTTPException(status_code=400, detail="; ".join(validation_errors[:25]))

    # Prefetch mapping códigos/números -> id
    materia_map: dict[str,int] = {}
    ficha_map: dict[str,int] = {}
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT id, codigo FROM materias")
        for r in cur.fetchall() or []:
            if r.get("codigo"):
                materia_map[str(r["codigo"]).strip().lower()] = r["id"]
        cur.execute("SELECT id, numero FROM fichas")
        for r in cur.fetchall() or []:
            if r.get("numero"):
                ficha_map[str(r["numero"]).strip().lower()] = r["id"]

    resolution_errors: List[str] = []
    resolved_rows = []  # (materia_id, ficha_id, row)
    for idx, row in df.iterrows():
        try:
            # materia
            materia_id = None
            if "materia_id" in df.columns and pd.notna(row.get("materia_id")):
                materia_id = int(row.get("materia_id"))
            elif "materia_codigo" in df.columns and pd.notna(row.get("materia_codigo")):
                materia_id = materia_map.get(str(row.get("materia_codigo")).strip().lower())
            # ficha
            ficha_id = None
            if "ficha_id" in df.columns and pd.notna(row.get("ficha_id")):
                ficha_id = int(row.get("ficha_id"))
            elif "ficha_numero" in df.columns and pd.notna(row.get("ficha_numero")):
                ficha_id = ficha_map.get(str(row.get("ficha_numero")).strip().lower())
            if not materia_id:
                resolution_errors.append(f"Fila {idx+2}: materia no encontrada")
                continue
            if not ficha_id:
                resolution_errors.append(f"Fila {idx+2}: ficha no encontrada")
                continue
            resolved_rows.append((materia_id, ficha_id, row))
        except Exception as e:
            resolution_errors.append(f"Fila {idx+2}: error resolviendo IDs - {e}")

    if dryRun:
        return {
            "success": True,
            "dryRun": True,
            "rows_total": len(df),
            "resolvable": len(resolved_rows),
            "resolution_errors": resolution_errors[:50],
            "unexpected_columns": unexpected,
        }

    if not resolved_rows:
        raise HTTPException(status_code=400, detail="No se pudo resolver ninguna fila: " + "; ".join(resolution_errors[:25]))

    user_id = int(claims.get("sub")) if claims and claims.get("sub") else None
    processed = 0
    inserted = 0
    updated = 0
    now = datetime.date.today()

    upsert_sql = (
        "INSERT INTO calificaciones (" 
        "materia_id, ficha_id, estudiante_nombre, estudiante_documento, trimestre, nota, estado, observaciones, cargado_por, fecha_carga) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) "
        "ON CONFLICT (materia_id, estudiante_documento, trimestre) DO UPDATE SET "
        "ficha_id = EXCLUDED.ficha_id, "
        "estudiante_nombre = EXCLUDED.estudiante_nombre, "
        "nota = EXCLUDED.nota, "
        "estado = EXCLUDED.estado, "
        "observaciones = EXCLUDED.observaciones, "
        "cargado_por = EXCLUDED.cargado_por, "
        "fecha_carga = EXCLUDED.fecha_carga, "
        "updated_at = CURRENT_TIMESTAMP "
        "RETURNING (xmax = 0) AS inserted"
    )

    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            for materia_id, ficha_id, r in resolved_rows:
                processed += 1
                raw = str(r.get("nota") or "").strip().upper()
                nota_val = None
                estado_val = r.get("estado") or "Cursando"
                if raw in ("A","F"):
                    nota_val = 5.0 if raw == "A" else 2.0
                    estado_val = "Aprobado" if raw == "A" else "Reprobado"
                elif raw:
                    try:
                        fval = float(raw)
                        nota_val = fval
                        if fval >= 3.0:
                            estado_val = "Aprobado"
                        else:
                            estado_val = "Reprobado"
                    except Exception:
                        # dejar nota_val None y estado cursando
                        estado_val = "Cursando"
                cur.execute(
                    upsert_sql,
                    [
                        materia_id,
                        ficha_id,
                        r["estudiante_nombre"],
                        r["estudiante_documento"],
                        int(r["trimestre"]),
                        nota_val,
                        estado_val,
                        r.get("observaciones"),
                        user_id,
                        now,
                    ],
                )
                row_ret = cur.fetchone()
                if row_ret and row_ret.get("inserted"):
                    inserted += 1
                else:
                    updated += 1
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=400, detail=f"Error procesando batch: {e}")

    # Audit global del batch
    try:
        record_event(conn,
                     accion="upload_calificaciones",
                     user_id=user_id,
                     user_email=claims.get("email") if claims else None,
                     user_rol=claims.get("rol") if claims else None,
                     modulo="calificaciones",
                     detalles={"processed": processed, "inserted": inserted, "updated": updated, "filename": file.filename})
    except Exception:
        pass

    return {
        "success": True,
        "stats": {
            "processed": processed,
            "inserted": inserted,
            "updated": updated,
            "resolution_errors": resolution_errors[:50],
            "unexpected_columns": unexpected,
        },
        "filename": file.filename,
    }


# -------------------- Upload solo A/F (letra) --------------------
    # Endpoint /upload-af eliminado: se integra en /upload usando columna nota


# -------------------- Export Stub --------------------
@router.get("/export")
def export_calificaciones(
    claims: dict = Depends(get_current_user_claims),
    materiaId: Optional[int] = Query(None),
    fichaId: Optional[int] = Query(None),
    trimestre: Optional[int] = Query(None, ge=1, le=4),
    estado: Optional[str] = Query(None),
):
    filters: List[str] = []
    params: List = []
    if materiaId is not None:
        filters.append("materia_id = %s")
        params.append(materiaId)
    if fichaId is not None:
        filters.append("ficha_id = %s")
        params.append(fichaId)
    if trimestre is not None:
        filters.append("trimestre = %s")
        params.append(trimestre)
    if estado:
        filters.append("estado = %s")
        params.append(estado)
    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    sql = f"""
    SELECT {_cols()} FROM calificaciones
    {where_clause}
    ORDER BY materia_id, estudiante_nombre, trimestre
    """
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, params)
        rows = cur.fetchall() or []

    if not rows:
        raise HTTPException(status_code=404, detail="No hay calificaciones para exportar")

    df = pd.DataFrame(rows)
    # Reordenar columnas para export
    export_cols = [
        "materia_id",
        "ficha_id",
        "estudiante_nombre",
        "estudiante_documento",
        "trimestre",
        "nota",
        "estado",
        "observaciones",
        "fecha_carga",
    ]
    df = df[export_cols]
    # Agregar letra derivada para compatibilidad
    df.insert(6, "letra", df["nota"].apply(lambda n: "A" if pd.notna(n) and float(n) >= 3.0 else ("F" if pd.notna(n) else None)))

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Calificaciones")
    output.seek(0)

    filename = "calificaciones_export.xlsx"
    headers = {
        "Content-Disposition": f"attachment; filename={filename}",
    }
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


# -------------------- Template --------------------
@router.get("/template")
def template_calificaciones(
    usarCodigos: bool = Query(True, description="Si true usa materia_codigo y ficha_numero; si false usa IDs"),
):
    """Genera un Excel plantilla para carga de calificaciones.
    Columnas: materia_codigo|materia_id, ficha_numero|ficha_id, estudiante_nombre, estudiante_documento, trimestre, nota, estado, observaciones
    """
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT id, codigo FROM materias ORDER BY codigo")
        materias = cur.fetchall() or []
        cur.execute("SELECT id, numero FROM fichas ORDER BY numero")
        fichas = cur.fetchall() or []

    rows = []
    for m in materias[:10]:  # limitar ejemplo
        for f in fichas[:3]:
            rows.append({
                ("materia_codigo" if usarCodigos else "materia_id"): m.get("codigo") if usarCodigos else m["id"],
                ("ficha_numero" if usarCodigos else "ficha_id"): f.get("numero") if usarCodigos else f["id"],
                "estudiante_nombre": "Nombre Estudiante",
                "estudiante_documento": "123456789",
                "trimestre": 1,
                "nota": "A",  # ejemplo usando letra
                "estado": "Aprobado",
                "observaciones": "",
            })
    if not rows:
        rows.append({
            ("materia_codigo" if usarCodigos else "materia_id"): "CODIGO" if usarCodigos else 1,
            ("ficha_numero" if usarCodigos else "ficha_id"): "NUMERO" if usarCodigos else 1,
            "estudiante_nombre": "Nombre Estudiante",
            "estudiante_documento": "Documento",
            "trimestre": 1,
            "nota": "A",
            "estado": "Cursando",
            "observaciones": "",
        })
    df = pd.DataFrame(rows)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="calificaciones")
    output.seek(0)
    filename = f"plantilla_calificaciones_{'codigos' if usarCodigos else 'ids'}.xlsx"
    headers = {"Content-Disposition": f"attachment; filename={filename}"}
    return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)
