from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Depends, Form
from psycopg.rows import dict_row
from typing import List, Optional, Dict
import pandas as pd
import io
from ..db import get_conn
from ..security import get_current_user_claims
from math import ceil

router = APIRouter(prefix="/api/v1/evidencias-wide", tags=["evidencias-wide"])

# Nota: Se expone un endpoint adicional /upload para uso directo desde el frontend.
# Este endpoint siempre realiza escritura (no dryRun) y retorna respuesta simplificada.

# Letras permitidas: A (Aprobado), D (Reprobado), - (No entregó), vacío (Pendiente)
VALID_LETTERS = {"A", "D", "-", ""}

IDENT_COLS_VARIANTS = {
    "documento": ["documento", "numero de cedula", "numero_cedula", "numero cedula", "número de cédula", "número_de_cédula", "cedula", "nro documento"],
    "nombre": ["apellidos y nombres", "apellidos_y_nombres", "nombres y apellidos", "nombres_apellidos", "nombre", "nombres", "nombres completos", "apellidos nombres"],
    "apellido": ["apellido", "apellidos", "apellido(s)", "apellidos(s)", "apellidos(s)", "apell"],
    "correo": ["correo electronico", "correo electrónico", "correo_electronico", "email", "correo", "email institucional", "correo institucional"],
}


def normalize_header(h: str) -> str:
    h = h.strip().lower()
    replacements = {
        "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u",
    }
    for k, v in replacements.items():
        h = h.replace(k, v)
    h = h.replace("  ", " ")
    return h


def map_identity_columns(cols: List[str]) -> Dict[str, str]:
    mapped = {}
    # normalizar cols para heurística adicional
    for base, variants in IDENT_COLS_VARIANTS.items():
        for c in cols:
            if c in variants:
                mapped[base] = c
                break
        if base not in mapped:
            # heurística: buscar substring clave
            key_sub = {
                "documento": ["documento", "cedula"],
                "nombre": ["nombre", "apell"],
                "apellido": ["apell"],
                "correo": ["correo", "email"],
            }[base]
            for c in cols:
                for sub in key_sub:
                    if sub in c:
                        mapped[base] = c
                        break
                if base in mapped:
                    break
    return mapped


def derive_estado(letra: Optional[str]) -> str:
    if letra is None or letra == "":
        return "Pendiente"
    if letra == "A":
        return "Aprobado"
    if letra == "D":
        return "Reprobado"
    if letra == "-":
        return "No entregó"
    return "Pendiente"

def _truncate(s: Optional[str], max_len: int = 255) -> Optional[str]:
    if s is None:
        return None
    s = str(s)
    if len(s) <= max_len:
        return s
    return s[:max_len]

def _process_wide(
    file: UploadFile = File(...),
    dryRun: bool = Query(False, description="Si true valida sin escribir"),
    ficha_id: int = Form(0),
    ficha_numero: Optional[str] = Form(None),
    materia_id: int = Form(0),
    docente_id: int = Form(0),
    _: dict = Depends(get_current_user_claims),
):
    if not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Formato inválido, use .xlsx/.xls")
    content = file.file.read()
    try:
        df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error leyendo Excel: {e}")
    if df.empty:
        raise HTTPException(status_code=400, detail="Archivo vacío")

    # Normalizar headers
    original_cols = list(df.columns)
    normalized_map = {c: normalize_header(c) for c in original_cols}
    df.rename(columns=normalized_map, inplace=True)
    lower_cols = [c for c in df.columns]

    # Evitar tomar columnas de evidencias como identidad: excluir las que contienen '(letra)'
    identity_candidates = [c for c in lower_cols if "(letra)" not in c]
    id_map = map_identity_columns(identity_candidates)
    # Validar que las columnas mapeadas no sean en realidad columnas de letra (solo A/D/-)
    def mostly_letters(col: str) -> bool:
        try:
            series = df[col].astype(str).str.strip().str.upper()
        except Exception:
            return False
        non_empty = [v for v in series if v != ""]
        if not non_empty:
            return False
        letter_like = sum(1 for v in non_empty if v in VALID_LETTERS)
        return (letter_like / len(non_empty)) > 0.8

    for k in list(id_map.keys()):
        if k in id_map and mostly_letters(id_map[k]):
            # descartar falso positivo
            del id_map[k]
    # Nueva lógica: solo se requieren correo y nombre. Siempre se ignora cualquier columna de cédula.
    core_missing = [k for k in ["correo", "nombre"] if k not in id_map]
    if core_missing:
        raise HTTPException(status_code=400, detail="Columnas identificadoras faltantes (requiere correo y nombre): " + ", ".join(core_missing) + ". Columnas disponibles normalizadas: " + ", ".join(lower_cols))
    # Forzar documento = correo (cedula ignorada aunque exista)
    id_map["documento"] = id_map["correo"]
    cedula_ignorada = True

    # Detectar evidencias: columnas que contienen '(letra)' tras normalizar
    evidencia_cols = [c for c in lower_cols if "(letra)" in c]
    if not evidencia_cols:
        raise HTTPException(status_code=400, detail="No se encontraron columnas de evidencias '(Letra)'. Columnas vistas: " + ", ".join(lower_cols))

    registros = []
    preview_students = []  # primeras muestras de identidad para dryRun
    errores: List[str] = []
    counts = {"A":0, "D":0, "-":0, "Pendiente":0, "tot_registros":0}

    for idx, row in df.iterrows():
        cor = str(row[id_map["correo"]]).strip()
        nom = str(row[id_map["nombre"]]).strip()
        ape = str(row[id_map.get("apellido", "")]).strip() if "apellido" in id_map else ""
        doc = cor  # documento forzado al correo
        if not doc:
            errores.append(f"Fila {idx+2}: documento vacío")
            continue
        # Guardar preview identidad (sin evidencias) hasta 5 ejemplos
        if len(preview_students) < 5:
            preview_students.append({"documento": doc, "nombre": nom, "apellido": ape, "correo": cor})
        for col in evidencia_cols:
            raw = str(row[col]).strip().upper()
            letra = raw if raw in VALID_LETTERS else ("" if raw == "" else None)
            if letra is None:
                errores.append(f"Fila {idx+2} Col '{col}': valor inválido '{raw}' (permitido A,D,-, vacío)")
                continue
            evidencia_nombre = col.replace("(letra)", "").strip().replace("  ", " ")
            estado = derive_estado(letra)
            registros.append({
                "documento": doc,
                "nombre": nom,
                "apellido": ape,
                "correo": cor,
                "evidencia": evidencia_nombre,
                "letra": letra if letra != "" else None,
                "estado": estado,
            })
            if letra == "":
                counts["Pendiente"] += 1
            elif letra in ("A","D","-"):
                counts[letra] += 1
            counts["tot_registros"] += 1
        
    # Resolver ficha: DEBE existir y ser proporcionada; no se crea automáticamente.
    resolved_ficha_id = ficha_id
    created_ficha = False
    ficha_numero_norm = (ficha_numero or "").strip()
    ficha_payload: Optional[Dict] = None
    if not ficha_numero_norm:
        raise HTTPException(status_code=400, detail="Debe ingresar el número de ficha antes de cargar el archivo")
    if resolved_ficha_id <= 0:
        with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT id, numero, nombre, estado FROM fichas WHERE LOWER(numero)=LOWER(%s) LIMIT 1", [ficha_numero_norm])
            found = cur.fetchone()
            if not found:
                raise HTTPException(status_code=400, detail=f"La ficha '{ficha_numero_norm}' no existe en la base de datos")
            resolved_ficha_id = int(found["id"])
            ficha_payload = {
                "id": resolved_ficha_id,
                "numero": found["numero"],
                "nombre": found["nombre"],
                "estado": found.get("estado", "")
            }

    # Pre-chequeo: filtrar documentos inválidos (vacíos/solo espacios/excesivamente largos)
    def _doc_invalido(doc: Optional[str]) -> bool:
        if doc is None:
            return True
        d = str(doc).strip()
        if d == "":
            return True
        if len(d) > 255:
            return True
        return False

    invalid_docs = set()
    for r in registros:
        if _doc_invalido(r.get("documento")):
            invalid_docs.add(r.get("documento") or "<vacío>")
    if invalid_docs:
        errores.append("Documentos inválidos detectados: " + ", ".join(sorted(invalid_docs)))
        # Filtrar fuera los registros con documento inválido para no intentar insertar
        registros = [r for r in registros if not _doc_invalido(r.get("documento"))]

    if dryRun:
        # Respuesta enriquecida para diagnóstico
        return {
            "success": len(errores)==0,
            "dryRun": True,
            "total": counts["tot_registros"],
            "detalle": counts,
            "errores": errores[:50],
            "columnMapping": id_map,
            "evidenciaCols": evidencia_cols,
            "identityPreview": preview_students,
            "cedulaIgnorada": cedula_ignorada,
            "ficha": ficha_payload,
            "ficha_numero": ficha_numero_norm or None,
            "ficha_id_resuelto": resolved_ficha_id if resolved_ficha_id>0 else None,
        }

    # Verificar si la materia existe (para evitar FK y spam de advertencias)
    materia_id_valid = False
    if materia_id > 0:
        try:
            with get_conn() as _c, _c.cursor(row_factory=dict_row) as _curs:
                _curs.execute("SELECT 1 FROM materias WHERE id=%s", [materia_id])
                materia_id_valid = bool(_curs.fetchone())
        except Exception:
            materia_id_valid = False
        if not materia_id_valid:
            errores.append(f"Materia especificada (id={materia_id}) no existe; se omite la creación de definiciones de evidencias para evitar errores de clave foránea.")

    if registros:
        with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
            try:
                # Validación: detectar estudiantes ya asociados a otra ficha distinta
                if resolved_ficha_id > 0:
                    try:
                        documentos = list({r["documento"] for r in registros})
                        if documentos:
                            cur.execute(
                                """
                                SELECT documento, ficha_id FROM estudiantes
                                WHERE documento = ANY(%s) AND ficha_id IS NOT NULL AND ficha_id <> %s
                                """,
                                [documentos, resolved_ficha_id]
                            )
                            conflicts = cur.fetchall() or []
                            if conflicts:
                                detalles = [f"{row['documento']} (ficha_id={row['ficha_id']})" for row in conflicts]
                                raise HTTPException(status_code=400, detail="Conflictos de ficha: algunos estudiantes ya pertenecen a otra ficha. "
                                                                            + "Registros: " + ", ".join(detalles))
                    except HTTPException:
                        raise
                    except Exception:
                        # Si la validación falla por error técnico, continuar sin bloquear
                        pass

                # asegurar definiciones de evidencias (creación pasiva inactivas)
                # calcular orden base existente por materia
                if materia_id_valid:
                    try:
                        cur.execute("SELECT COUNT(*) AS cnt FROM evidencia_definicion WHERE materia_id=%s", [materia_id])
                        row_cnt = cur.fetchone() or {}
                        base_count = int(row_cnt.get("cnt", 0))
                    except Exception:
                        base_count = 0
                else:
                    base_count = 0
                def_cache = set()
                for r in registros:
                    # Aislar errores por registro con SAVEPOINT
                    try:
                        cur.execute("SAVEPOINT sp_reg")
                    except Exception:
                        pass
                    nombre_evid = r["evidencia"]
                    if materia_id_valid and nombre_evid not in def_cache:
                        try:
                            stage = "evidencia_def_select"
                            cur.execute(
                                "SELECT id FROM evidencia_definicion WHERE materia_id=%s AND nombre=%s",
                                [materia_id, nombre_evid]
                            )
                            found = cur.fetchone()
                            if not found:
                                cur.execute(
                                    """
                                    INSERT INTO evidencia_definicion (nombre, ficha_id, materia_id, docente_id, activa, orden)
                                    VALUES (%s,%s,%s,%s,%s,%s)
                                    ON CONFLICT (materia_id, nombre) DO NOTHING
                                    """,
                                    [nombre_evid, resolved_ficha_id if resolved_ficha_id>0 else None, materia_id, docente_id if docente_id>0 else None, False, base_count]
                                )
                                base_count += 1
                            def_cache.add(nombre_evid)
                        except Exception as e_def:
                            # Revertir cambios de este registro y continuar con siguiente
                            try:
                                cur.execute("ROLLBACK TO SAVEPOINT sp_reg")
                            except Exception:
                                pass
                            errores.append(f"Advertencia al asegurar definición '{nombre_evid}': {e_def}")
                            try:
                                cur.execute("RELEASE SAVEPOINT sp_reg")
                            except Exception:
                                pass
                            continue
                    # Actualización de correo si coincide nombre+apellido con un estudiante existente
                    try:
                        stage = "heuristica_update_correo_select"
                        cur.execute(
                            "SELECT documento FROM estudiantes WHERE LOWER(nombre)=LOWER(%s) AND LOWER(apellido)=LOWER(%s) LIMIT 2",
                            [r["nombre"], r["apellido"]]
                        )
                        matches = cur.fetchall() or []
                        if len(matches) == 1:
                            old_doc = matches[0]["documento"]
                            new_doc = r["documento"]
                            if old_doc != new_doc:
                                # Verificar que el nuevo correo no existe ya como documento
                                stage = "heuristica_update_correo_exists_new"
                                cur.execute("SELECT 1 FROM estudiantes WHERE documento=%s", [new_doc])
                                exists_new = cur.fetchone()
                                if not exists_new:
                                    # Migrar evidencias al nuevo documento y actualizar estudiante
                                    stage = "heuristica_update_correo_update_evidencias"
                                    cur.execute(
                                        "UPDATE evidencias SET documento=%s, updated_at=CURRENT_TIMESTAMP WHERE documento=%s",
                                        [new_doc, old_doc]
                                    )
                                    stage = "heuristica_update_correo_update_estudiante"
                                    cur.execute(
                                        "UPDATE estudiantes SET documento=%s, correo=%s, updated_at=CURRENT_TIMESTAMP WHERE documento=%s",
                                        [new_doc, new_doc, old_doc]
                                    )
                    except Exception as e_h:
                        # Revertir solo cambios de este registro y continuar
                        try:
                            cur.execute("ROLLBACK TO SAVEPOINT sp_reg")
                        except Exception:
                            pass
                        errores.append(f"Advertencia heurística de correo para '{r['documento']}': {e_h}")
                        try:
                            cur.execute("RELEASE SAVEPOINT sp_reg")
                        except Exception:
                            pass
                        continue
                    # Insertar estudiante si no existe (después de posible migración)
                    stage = "insert_estudiante"
                    try:
                        cur.execute(
                            "INSERT INTO estudiantes (documento, nombre, apellido, correo) VALUES (%s,%s,%s,%s) ON CONFLICT (documento) DO NOTHING",
                            [
                                _truncate(r["documento"]),
                                _truncate(r["nombre"]),
                                _truncate(r.get("apellido", "")),
                                _truncate(r.get("correo", None)),
                            ]
                        )
                    except Exception as e_ins:
                        try:
                            cur.execute("ROLLBACK TO SAVEPOINT sp_reg")
                        except Exception:
                            pass
                        errores.append(f"Fallo al insertar estudiante documento={r['documento']}: {e_ins}")
                        try:
                            cur.execute("RELEASE SAVEPOINT sp_reg")
                        except Exception:
                            pass
                        continue
                    # Asociar ficha si existe ficha resuelta y estudiante sin ficha
                    if resolved_ficha_id > 0:
                        # Solo asignar si el estudiante no tiene ficha; nunca reemplazar ficha existente distinta.
                        try:
                            stage = "update_estudiante_set_ficha"
                            cur.execute(
                                "UPDATE estudiantes SET ficha_id=%s WHERE documento=%s AND (ficha_id IS NULL OR ficha_id=0)",
                                [resolved_ficha_id, r["documento"]]
                            )
                        except Exception:
                            pass
                    # Upsert evidencia (actualiza calificación siempre)
                    stage = "upsert_evidencia"
                    try:
                        cur.execute(
                            "INSERT INTO evidencias (documento, evidencia_nombre, letra, estado) VALUES (%s,%s,%s,%s) ON CONFLICT (documento, evidencia_nombre) DO UPDATE SET letra=EXCLUDED.letra, estado=EXCLUDED.estado, updated_at=CURRENT_TIMESTAMP",
                            [
                                _truncate(r["documento"]),
                                _truncate(r["evidencia"], 255),
                                r["letra"],
                                r["estado"],
                            ]
                        )
                        try:
                            cur.execute("RELEASE SAVEPOINT sp_reg")
                        except Exception:
                            pass
                    except Exception as e_up:
                        try:
                            cur.execute("ROLLBACK TO SAVEPOINT sp_reg")
                        except Exception:
                            pass
                        errores.append(f"Fallo al guardar evidencia '{nombre_evid}' para {r['documento']}: {e_up}")
                        try:
                            cur.execute("RELEASE SAVEPOINT sp_reg")
                        except Exception:
                            pass
                        continue
                conn.commit()
                # Registrar auditoría persistente del upload
                try:
                    cur.execute(
                        """
                        INSERT INTO audit_logs (user_id, user_email, user_rol, accion, modulo, entidad_tipo, entidad_id, detalles, metadata)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        """,
                        [
                            _["id"] if isinstance(_, dict) and _ and "id" in _ else None,
                            _["email"] if isinstance(_, dict) and _ and "email" in _ else None,
                            _["rol"] if isinstance(_, dict) and _ and "rol" in _ else None,
                            "upload",
                            "evidencias",
                            "ficha",
                            resolved_ficha_id if resolved_ficha_id>0 else None,
                            f"Carga de evidencias wide. Registros: {len(registros)}",
                            {
                                "ficha_numero": ficha_numero_norm or None,
                                "ficha_id": resolved_ficha_id if resolved_ficha_id>0 else None,
                                "materia_id": materia_id,
                                "docente_id": docente_id if docente_id>0 else None,
                                "counts": counts,
                            },
                        ]
                    )
                    conn.commit()  # asegurar persistencia del log
                except Exception:
                    # No bloquear por auditoría
                    pass
            except Exception as e:
                conn.rollback()
                # Propagar mensaje enriquecido si stage disponible
                if 'stage' in locals():
                    raise HTTPException(status_code=400, detail=f"Error guardando registros (stage={stage}): {e}")
                raise HTTPException(status_code=400, detail=f"Error guardando registros: {e}")
    return {
        "success": len(errores)==0,
        "insertados_actualizados": len(registros),
        "errores": errores[:50],
        "counts": counts,
        "ficha_id": resolved_ficha_id if resolved_ficha_id>0 else None,
        "ficha_numero": ficha_numero_norm or None,
        "ficha_creada": created_ficha,
    }

@router.post("/upload-wide")
def upload_wide(
    file: UploadFile = File(...),
    dryRun: bool = Query(False, description="Si true valida sin escribir"),
    ficha_id: int = Form(0),
    ficha_numero: Optional[str] = Form(None),
    materia_id: int = Form(0),
    docente_id: int = Form(0),
    user: dict = Depends(get_current_user_claims)
):
    return _process_wide(file=file, dryRun=dryRun, ficha_id=ficha_id, ficha_numero=ficha_numero, materia_id=materia_id, docente_id=docente_id, _=user)

@router.post("/upload")
def upload_frontend(
    file: UploadFile = File(...),
    ficha_id: int = Form(0),
    ficha_numero: Optional[str] = Form(None),
    materia_id: int = Form(0),
    docente_id: int = Form(0),
    user: dict = Depends(get_current_user_claims)
):
    result = _process_wide(file=file, dryRun=False, ficha_id=ficha_id, ficha_numero=ficha_numero, materia_id=materia_id, docente_id=docente_id, _=user)
    # Normalizar payload (cuando no es dryRun retorna estructura distinta)
    if "insertados_actualizados" in result:
        return {
            "success": result.get("success", False),
            "insertados": result.get("insertados_actualizados", 0),
            "counts": result.get("counts", {}),
            "errores": result.get("errores", []),
            "ficha_id": result.get("ficha_id"),
            "ficha_numero": result.get("ficha_numero"),
            "ficha_creada": result.get("ficha_creada"),
        }
    return result

@router.get("")
def list_evidencias_wide(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=200),
    documento: Optional[str] = Query(None),
    evidencia: Optional[str] = Query(None),
    letra: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
):
    offset = (page-1)*pageSize
    filters: List[str] = []
    params: List = []
    if documento:
        filters.append("e.documento = %s")
        params.append(documento)
    if evidencia:
        filters.append("e.evidencia_nombre ILIKE %s")
        params.append(f"%{evidencia}%")
    if letra:
        filters.append("e.letra = %s")
        params.append(letra)
    if estado:
        filters.append("e.estado = %s")
        params.append(estado)
    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    sql = f"SELECT e.id, e.documento, s.nombre, s.apellido, s.correo, e.evidencia_nombre, e.letra, e.estado, e.created_at, e.updated_at FROM evidencias e JOIN estudiantes s ON s.documento = e.documento {where_clause} ORDER BY e.documento, e.evidencia_nombre LIMIT %s OFFSET %s"
    count_sql = f"SELECT COUNT(*) AS total FROM evidencias e {where_clause}"
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(count_sql, params)
        total_row = cur.fetchone()
        total = int(total_row['total']) if total_row else 0
        cur.execute(sql, [*params, pageSize, offset])
        rows = cur.fetchall() or []
    return {"success": True, "data": rows, "pagination": {"page": page, "pageSize": pageSize, "total": total, "totalPages": ceil(total/pageSize) if pageSize else 0}}

@router.get("/stats")
def stats_evidencias():
    sql = "SELECT evidencia_nombre, COUNT(*) total, SUM(CASE WHEN letra='A' THEN 1 ELSE 0 END) aprobadas, SUM(CASE WHEN letra='D' THEN 1 ELSE 0 END) reprobadas, SUM(CASE WHEN letra='-' THEN 1 ELSE 0 END) no_entrego, SUM(CASE WHEN letra IS NULL THEN 1 ELSE 0 END) pendientes FROM evidencias GROUP BY evidencia_nombre ORDER BY evidencia_nombre"
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql)
        by_evidence = cur.fetchall() or []
    sql2 = "SELECT documento, COUNT(*) total, SUM(CASE WHEN letra='A' THEN 1 ELSE 0 END) aprobadas, SUM(CASE WHEN letra='D' THEN 1 ELSE 0 END) reprobadas, SUM(CASE WHEN letra='-' THEN 1 ELSE 0 END) no_entrego, SUM(CASE WHEN letra IS NULL THEN 1 ELSE 0 END) pendientes FROM evidencias GROUP BY documento ORDER BY documento"
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql2)
        by_student = cur.fetchall() or []
    return {"success": True, "by_evidence": by_evidence, "by_student": by_student}

@router.get("/export")
def export_evidencias(_: dict = Depends(get_current_user_claims)):
    import pandas as pd
    import io
    from fastapi.responses import StreamingResponse
    sql = "SELECT e.documento, s.nombre, s.apellido, s.correo, e.evidencia_nombre, e.letra, e.estado, e.created_at FROM evidencias e JOIN estudiantes s ON s.documento = e.documento ORDER BY e.documento, e.evidencia_nombre"
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql)
        rows = cur.fetchall() or []
    if not rows:
        raise HTTPException(status_code=404, detail="Sin datos para exportar")
    df = pd.DataFrame(rows)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="EvidenciasWide")
    output.seek(0)
    return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=evidencias_wide.xlsx"})

@router.get("/template")
def template_evidencias(evidencias: int = Query(2, ge=1, le=50), _: dict = Depends(get_current_user_claims)):
    """Genera una plantilla Excel mínima con columnas de identidad y evidencias.
    Param evidencias: número de columnas de evidencias (cada una con sufijo (Letra))."""
    import pandas as pd
    import io
    from fastapi.responses import StreamingResponse
    base_cols = ["Correo", "Nombre", "Apellido"]
    evid_cols = [f"Evidencia {i+1} (Letra)" for i in range(evidencias)]
    df = pd.DataFrame(columns=base_cols + evid_cols)
    # Agregar fila ejemplo opcional
    example = {
        "Correo": "estudiante1@correo.edu",
        "Nombre": "Juan",
        "Apellido": "Pérez",
    }
    for c in evid_cols:
        example[c] = "A"  # ejemplo aprobado
    df.loc[0] = example
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Plantilla")
    output.seek(0)
    return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=plantilla_evidencias.xlsx"})

@router.get("/uploads-history")
def uploads_history(limit: int = Query(25, ge=1, le=200), _: dict = Depends(get_current_user_claims)):
    """Historial persistente de cargas wide (desde audit_logs)."""
    sql = """
    SELECT id, created_at, metadata, detalles,
           (metadata->>'ficha_numero') AS ficha_numero,
           (metadata->>'ficha_id') AS ficha_id,
           (metadata->>'materia_id') AS materia_id,
        (metadata->>'counts') AS counts_json,
        (metadata->>'modo') AS modo,
        (metadata->>'evidencia_nombre') AS evidencia_nombre
    FROM audit_logs
    WHERE accion='upload' AND modulo='evidencias'
    ORDER BY created_at DESC
    LIMIT %s
    """
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            cur.execute(sql, [limit])
            rows = cur.fetchall() or []
        except Exception:
            rows = []
    # Normalizar counts
    normalized = []
    import json as _json
    for r in rows:
        raw_counts = r.get('counts_json')
        try:
            counts = _json.loads(raw_counts) if raw_counts else {}
        except Exception:
            counts = {}
        normalized.append({
            'id': r.get('id'),
            'fecha': r.get('created_at'),
            'fichaNumero': r.get('ficha_numero'),
            'fichaId': r.get('ficha_id'),
            'materiaId': r.get('materia_id'),
            'detalles': r.get('detalles'),
            'modo': r.get('modo'),
            'evidenciaNombre': r.get('evidencia_nombre'),
            'counts': counts,
            'registros': counts.get('tot_registros') if isinstance(counts, dict) else None
        })
    return {'success': True, 'data': normalized}
