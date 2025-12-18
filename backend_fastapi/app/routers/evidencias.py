from fastapi import APIRouter, HTTPException, Query, Depends, UploadFile, File
from typing import Optional, List, Tuple
from math import ceil
from psycopg.rows import dict_row
from ..db import get_conn
from ..security import get_current_user_claims
from pydantic import BaseModel, Field
from fastapi.responses import StreamingResponse
import io
import pandas as pd
import datetime

router = APIRouter(prefix="/api/v1/evidencias", tags=["evidencias"])

# -------------------- Models --------------------
class EvidenciaCreate(BaseModel):
    materia_id: int
    ficha_id: int
    estudiante_nombre: str
    estudiante_documento: str
    evidencia_nombre: str
    trimestre: int = Field(ge=1, le=4)
    letra: Optional[str] = Field(default=None, pattern=r"^(A|F)$")
    nota: Optional[float] = Field(default=None, ge=0, le=5)
    estado: Optional[str] = Field(default="Pendiente", pattern=r"^(Aprobado|Reprobado|Pendiente|Cursando)$")
    observaciones: Optional[str] = None


class EvidenciaUpdate(BaseModel):
    materia_id: Optional[int] = None
    ficha_id: Optional[int] = None
    estudiante_nombre: Optional[str] = None
    estudiante_documento: Optional[str] = None
    evidencia_nombre: Optional[str] = None
    trimestre: Optional[int] = Field(default=None, ge=1, le=4)
    letra: Optional[str] = Field(default=None, pattern=r"^(A|F)$")
    nota: Optional[float] = Field(default=None, ge=0, le=5)
    estado: Optional[str] = Field(default=None, pattern=r"^(Aprobado|Reprobado|Pendiente|Cursando)$")
    observaciones: Optional[str] = None


def _cols():
    return (
        "id, materia_id, ficha_id, estudiante_nombre, estudiante_documento, evidencia_nombre, trimestre, nota, letra, estado, observaciones, "
        "fecha_carga, cargado_por, created_at, updated_at"
    )

# -------------------- List --------------------
@router.get("")
def list_evidencias(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=200),
    search: Optional[str] = Query(None),
    materiaId: Optional[int] = Query(None),
    fichaId: Optional[int] = Query(None),
    trimestre: Optional[int] = Query(None, ge=1, le=4),
    evidenciaNombre: Optional[str] = Query(None),
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
    if evidenciaNombre:
        filters.append("evidencia_nombre ILIKE %s")
        params.append(f"%{evidenciaNombre}%")
    if estado:
        filters.append("estado = %s")
        params.append(estado)

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    items_sql = f"""
        SELECT {_cols()}
        FROM evidencias_detalle
        {where_clause}
        ORDER BY estudiante_nombre, evidencia_nombre, trimestre
        LIMIT %s OFFSET %s
    """
    count_sql = f"SELECT COUNT(*) AS total FROM evidencias_detalle {where_clause}"

    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(count_sql, params)
        total_row = cur.fetchone()
        total = int(total_row["total"]) if total_row else 0
        cur.execute(items_sql, [*params, pageSize, offset])
        items = cur.fetchall() or []
    # Fallback: si no hay filas en evidencias_detalle y los filtros no requieren materia/ficha/trimestre,
    # devolver filas simples desde la tabla base 'evidencias' (como las que crea upload-columna).
    if total == 0 and materiaId is None and fichaId is None and trimestre is None:
        base_filters: List[str] = []
        base_params: List = []
        if search:
            base_filters.append("(e.documento ILIKE %s)")
            base_params.append(f"%{search}%")
        if evidenciaNombre:
            base_filters.append("(e.evidencia_nombre ILIKE %s)")
            base_params.append(f"%{evidenciaNombre}%")
        if estado:
            base_filters.append("(e.estado = %s)")
            base_params.append(estado)
        where2 = f"WHERE {' AND '.join(base_filters)}" if base_filters else ""
        items_sql2 = (
            f"""
            SELECT e.id, e.documento, e.evidencia_nombre, e.letra, e.estado, e.observaciones, e.created_at, e.updated_at
            FROM evidencias e
            {where2}
            ORDER BY e.documento, e.evidencia_nombre
            LIMIT %s OFFSET %s
            """
        )
        count_sql2 = f"SELECT COUNT(*) AS total FROM evidencias e {where2}"
        with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute(count_sql2, base_params)
            total_row2 = cur.fetchone()
            total2 = int(total_row2["total"]) if total_row2 else 0
            cur.execute(items_sql2, [*base_params, pageSize, offset])
            items2 = cur.fetchall() or []
        return {
            "success": True,
            "data": items2,
            "pagination": {
                "page": page,
                "pageSize": pageSize,
                "total": total2,
                "totalPages": ceil(total2 / pageSize) if pageSize else 0,
            },
        }

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
@router.get("/{evidencia_id}")
def get_evidencia(evidencia_id: int):
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(f"SELECT {_cols()} FROM evidencias_detalle WHERE id = %s", [evidencia_id])
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Evidencia no encontrada")
    return row

# -------------------- Create --------------------
@router.post("")
def create_evidencia(payload: EvidenciaCreate, claims: dict = Depends(get_current_user_claims)):
    user_id = int(claims.get("sub")) if claims and claims.get("sub") else None
    sql = f"""
        INSERT INTO evidencias_detalle (materia_id, ficha_id, estudiante_nombre, estudiante_documento, evidencia_nombre, trimestre, nota, letra, estado, observaciones, cargado_por)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        RETURNING {_cols()}
    """
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            sql,
            [
                payload.materia_id,
                payload.ficha_id,
                payload.estudiante_nombre,
                payload.estudiante_documento,
                payload.evidencia_nombre,
                payload.trimestre,
                payload.nota,
                payload.letra,
                payload.estado,
                payload.observaciones,
                user_id,
            ],
        )
        row = cur.fetchone()
    return {"success": True, "data": row}

# -------------------- Update --------------------
@router.put("/{evidencia_id}")
def update_evidencia(evidencia_id: int, payload: EvidenciaUpdate, _: dict = Depends(get_current_user_claims)):
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
    if payload.evidencia_nombre is not None:
        fields.append("evidencia_nombre = %s")
        params.append(payload.evidencia_nombre)
    if payload.trimestre is not None:
        fields.append("trimestre = %s")
        params.append(payload.trimestre)
    if payload.letra is not None:
        fields.append("letra = %s")
        params.append(payload.letra)
    if payload.nota is not None:
        fields.append("nota = %s")
        params.append(payload.nota)
    if payload.estado is not None:
        fields.append("estado = %s")
        params.append(payload.estado)
    if payload.observaciones is not None:
        fields.append("observaciones = %s")
        params.append(payload.observaciones)

    if not fields:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")

    params.append(evidencia_id)
    sql = f"UPDATE evidencias_detalle SET {', '.join(fields)} WHERE id = %s RETURNING {_cols()}"
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, params)
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Evidencia no encontrada")
    return {"success": True, "data": row}

# -------------------- Delete --------------------
@router.delete("/{evidencia_id}")
def delete_evidencia(evidencia_id: int, _: dict = Depends(get_current_user_claims)):
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute("DELETE FROM evidencias_detalle WHERE id = %s RETURNING id", [evidencia_id])
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Evidencia no encontrada")
    return {"success": True, "data": row}

# -------------------- Upload (Excel con upsert) --------------------
REQUIRED_CORE = ["estudiante_nombre", "estudiante_documento", "evidencia_nombre", "trimestre"]
ID_VARIANTS = ["materia_id", "materia_codigo"]
FICHA_VARIANTS = ["ficha_id", "ficha_numero"]
OPTIONAL_COLUMNS = ["letra", "nota", "estado", "observaciones"]

def _validate_df(df: pd.DataFrame) -> Tuple[List[str], List[str]]:
    present_lower = {c.lower() for c in df.columns}
    missing = [c for c in REQUIRED_CORE if c.lower() not in present_lower]
    if not any(v in present_lower for v in ID_VARIANTS):
        missing.append("(materia_id|materia_codigo)")
    if not any(v in present_lower for v in FICHA_VARIANTS):
        missing.append("(ficha_id|ficha_numero)")
    allowed = set([*REQUIRED_CORE, *ID_VARIANTS, *FICHA_VARIANTS, *OPTIONAL_COLUMNS])
    unexpected = [c for c in df.columns if c.lower() not in allowed]
    return missing, unexpected

@router.post("/upload")
def upload_evidencias(
    file: UploadFile = File(...),
    claims: dict = Depends(get_current_user_claims),
    dryRun: bool = Query(False),
    notaA: float = Query(5.0, ge=0, le=5, description="Valor numérico asignado a A"),
    notaF: float = Query(2.0, ge=0, le=5, description="Valor numérico asignado a F"),
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
    df["evidencia_nombre"] = df["evidencia_nombre"].astype(str).str.strip()
    if "letra" in df.columns:
        df["letra"] = df["letra"].astype(str).str.strip().str.upper()

    validation_errors: List[str] = []
    for idx, row in df.iterrows():
        try:
            t = int(row["trimestre"])
            if t < 1 or t > 4:
                validation_errors.append(f"Fila {idx+2}: trimestre fuera de rango (1-4)")
            letra_val = str(row.get("letra") or "").upper()
            if letra_val and letra_val not in ("A", "F"):
                validation_errors.append(f"Fila {idx+2}: letra inválida (solo A/F)")
            if pd.notna(row.get("nota")):
                n = float(row["nota"])
                if n < 0 or n > 5:
                    validation_errors.append(f"Fila {idx+2}: nota fuera de rango (0-5)")
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
    resolved_rows = []
    for idx, row in df.iterrows():
        try:
            materia_id = None
            if "materia_id" in df.columns and pd.notna(row.get("materia_id")):
                materia_id = int(row.get("materia_id"))
            elif "materia_codigo" in df.columns and pd.notna(row.get("materia_codigo")):
                materia_id = materia_map.get(str(row.get("materia_codigo")).strip().lower())
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
        "INSERT INTO evidencias_detalle (" 
        "materia_id, ficha_id, estudiante_nombre, estudiante_documento, evidencia_nombre, trimestre, nota, letra, estado, observaciones, cargado_por, fecha_carga) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s, "
        "COALESCE(%s, CASE WHEN %s IN ('A','F') THEN CASE WHEN %s = 'A' THEN 'Aprobado' ELSE 'Reprobado' END ELSE 'Pendiente' END), "
        "%s, %s, %s, %s) "
        "ON CONFLICT (materia_id, estudiante_documento, evidencia_nombre, trimestre) DO UPDATE SET "
        "ficha_id = EXCLUDED.ficha_id, "
        "estudiante_nombre = EXCLUDED.estudiante_nombre, "
        "nota = EXCLUDED.nota, "
        "letra = EXCLUDED.letra, "
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
                letra_val = str(r.get("letra") or "").upper()
                nota_val = None
                if letra_val == "A":
                    nota_val = notaA
                elif letra_val == "F":
                    nota_val = notaF
                elif pd.notna(r.get("nota")):
                    try:
                        nota_val = float(r.get("nota"))
                    except Exception:
                        nota_val = None
                cur.execute(
                    upsert_sql,
                    [
                        materia_id,
                        ficha_id,
                        r["estudiante_nombre"],
                        r["estudiante_documento"],
                        r["evidencia_nombre"],
                        int(r["trimestre"]),
                        nota_val,
                        letra_val if letra_val in ("A","F") else None,
                        r.get("estado"),
                        letra_val if letra_val in ("A","F") else None,
                        letra_val if letra_val in ("A","F") else None,
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

# -------------------- Export --------------------
@router.get("/export")
def export_evidencias(
    claims: dict = Depends(get_current_user_claims),
    materiaId: Optional[int] = Query(None),
    fichaId: Optional[int] = Query(None),
    trimestre: Optional[int] = Query(None, ge=1, le=4),
    evidenciaNombre: Optional[str] = Query(None),
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
    if evidenciaNombre:
        filters.append("evidencia_nombre ILIKE %s")
        params.append(f"%{evidenciaNombre}%")
    if estado:
        filters.append("estado = %s")
        params.append(estado)
    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    sql = f"""
    SELECT {_cols()} FROM evidencias_detalle
    {where_clause}
    ORDER BY materia_id, estudiante_nombre, evidencia_nombre, trimestre
    """
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, params)
        rows = cur.fetchall() or []

    if not rows:
        raise HTTPException(status_code=404, detail="No hay evidencias para exportar")

    df = pd.DataFrame(rows)
    export_cols = [
        "materia_id",
        "ficha_id",
        "estudiante_nombre",
        "estudiante_documento",
        "evidencia_nombre",
        "trimestre",
        "nota",
        "letra",
        "estado",
        "observaciones",
        "fecha_carga",
    ]
    df = df[export_cols]

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Evidencias")
    output.seek(0)

    filename = "evidencias_export.xlsx"
    headers = {"Content-Disposition": f"attachment; filename={filename}"}
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )

# -------------------- Template --------------------
@router.get("/template")
def template_evidencias(
    usarCodigos: bool = Query(True, description="Si true usa materia_codigo y ficha_numero; si false usa IDs"),
):
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT id, codigo FROM materias ORDER BY codigo")
        materias = cur.fetchall() or []
        cur.execute("SELECT id, numero FROM fichas ORDER BY numero")
        fichas = cur.fetchall() or []

    rows = []
    for m in materias[:5]:
        for f in fichas[:3]:
            rows.append({
                ("materia_codigo" if usarCodigos else "materia_id"): m.get("codigo") if usarCodigos else m["id"],
                ("ficha_numero" if usarCodigos else "ficha_id"): f.get("numero") if usarCodigos else f["id"],
                "estudiante_nombre": "Nombre Estudiante",
                "estudiante_documento": "123456789",
                "evidencia_nombre": "Evidencia 1",
                "trimestre": 1,
                "letra": "A",
                "nota": 5.0,
                "estado": "Aprobado",
                "observaciones": "",
            })
    if not rows:
        rows.append({
            ("materia_codigo" if usarCodigos else "materia_id"): "CODIGO" if usarCodigos else 1,
            ("ficha_numero" if usarCodigos else "ficha_id"): "NUMERO" if usarCodigos else 1,
            "estudiante_nombre": "Nombre Estudiante",
            "estudiante_documento": "Documento",
            "evidencia_nombre": "Evidencia",
            "trimestre": 1,
            "letra": "A",
            "nota": 5.0,
            "estado": "Aprobado",
            "observaciones": "",
        })
    df = pd.DataFrame(rows)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="evidencias")
    output.seek(0)
    filename = f"plantilla_evidencias_{'codigos' if usarCodigos else 'ids'}.xlsx"
    headers = {"Content-Disposition": f"attachment; filename={filename}"}
    return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)
