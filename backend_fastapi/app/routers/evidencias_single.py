from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from psycopg.rows import dict_row
from ..db import get_conn
from ..security import get_current_user_claims

router = APIRouter(prefix="/api/v1/evidencias", tags=["evidencias-columna"])

class EvidenciaRow(BaseModel):
    documento: Optional[str] = Field(default=None)
    correo: Optional[str] = Field(default=None)
    estudiante: Optional[str] = Field(default=None)  # nombre completo
    valor: Optional[str] = Field(default="")  # 'A' | 'D' | '-' | ''

class UploadColumnaPayload(BaseModel):
    materia_id: int
    ficha_id: int
    evidencia_nombre: str
    rows: List[EvidenciaRow]

@router.post("/upload-columna")
def upload_columna(payload: UploadColumnaPayload, user: dict = Depends(get_current_user_claims)):
    evidencia_nombre = (payload.evidencia_nombre or "").strip()
    if not evidencia_nombre:
        raise HTTPException(status_code=400, detail="evidencia_nombre requerido")
    if not payload.rows:
        raise HTTPException(status_code=400, detail="rows vacío")
    allowed = {"A", "D", "-", ""}
    inserted = 0
    detalle_updated = 0
    detalle_inserted = 0
    # Contadores para historial consistente con carga wide
    counts = {"A": 0, "D": 0, "-": 0, "Pendiente": 0, "tot_registros": 0}
    errores: List[str] = []
    # Validar ficha existencia si viene >0
    resolved_ficha_id = payload.ficha_id if payload.ficha_id and payload.ficha_id > 0 else None
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        if resolved_ficha_id:
            try:
                cur.execute("SELECT id FROM fichas WHERE id=%s", [resolved_ficha_id])
                if not cur.fetchone():
                    errores.append(f"Ficha id={resolved_ficha_id} no existe; se continúa sin asignar ficha")
                    resolved_ficha_id = None
            except Exception:
                resolved_ficha_id = None
        # Validar materia
        materia_id_valid = False
        materia_id = payload.materia_id or 0
        if materia_id > 0:
            try:
                cur.execute("SELECT 1 FROM materias WHERE id=%s", [materia_id])
                materia_id_valid = bool(cur.fetchone())
            except Exception:
                materia_id_valid = False
        # Asegurar definición de evidencia si materia válida
        if materia_id_valid:
            try:
                cur.execute(
                    "INSERT INTO evidencia_definicion (nombre, ficha_id, materia_id, activa, orden) VALUES (%s,%s,%s,%s,%s) ON CONFLICT (materia_id, nombre) DO NOTHING",
                    [evidencia_nombre, resolved_ficha_id, materia_id, False, 0]
                )
            except Exception:
                pass
        # Procesar filas
        for r in payload.rows:
            doc = (r.documento or r.correo or "").strip()
            if not doc:
                errores.append("Documento vacío en fila")
                continue
            # Normalizar antes de validar
            def normalize_val(v: Optional[str]) -> str:
                s = (v or "").strip().upper()
                if s in ("APROBADO", "A PROBADO"):
                    return "A"
                if s in ("REPROBADO", "REPROBADA"):
                    return "D"
                if s in ("NO ENTREGÓ", "NO ENTREGADO", "NO ENTREGADA", "NO ENTREGO"):
                    return "-"
                if s in ("A", "D", "-"):
                    return s
                return ""
            val = normalize_val(r.valor)
            if val not in allowed:
                errores.append(f"Valor inválido '{r.valor}' para {doc}")
                continue
            # Acumular conteos para historial
            if val == "":
                counts["Pendiente"] += 1
            elif val in ("A", "D", "-"):
                counts[val] += 1
            counts["tot_registros"] += 1
            # Derivar nombre desde 'estudiante' si viene, de lo contrario usar correo como placeholder
            raw_name = (r.estudiante or "").strip()
            nombre = raw_name if raw_name else (r.correo or "").strip()
            estado = "Pendiente" if val == "" else ("Aprobado" if val == "A" else ("Reprobado" if val == "D" else "No entregó"))
            # Guardar letra original en detalle; tras migración, se admite 'D' también
            letra_detalle = (val if val != "" else None)
            try:
                # Asegurar nombre y correo (tabla requiere nombre NOT NULL, correo NOT NULL)
                cur.execute(
                    "INSERT INTO estudiantes (documento, nombre, correo) VALUES (%s,%s,%s) ON CONFLICT (documento) DO UPDATE SET nombre=EXCLUDED.nombre, correo=COALESCE(EXCLUDED.correo, estudiantes.correo), updated_at=CURRENT_TIMESTAMP",
                    [doc, nombre, (r.correo or "").strip()]
                )
                # normalize_val definido arriba
                if resolved_ficha_id:
                    cur.execute(
                        "UPDATE estudiantes SET ficha_id=%s WHERE documento=%s AND (ficha_id IS NULL OR ficha_id=0)",
                        [resolved_ficha_id, doc]
                    )
                # Actualizar/insertar en tabla base 'evidencias' (resumen por evidencia)
                val_norm = normalize_val(r.valor)
                cur.execute(
                    """
                    UPDATE evidencias
                    SET letra = %s,
                        estado = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE documento = %s AND evidencia_nombre = %s
                    """,
                    [
                        (val_norm if val_norm != "" else None),
                        estado,
                        doc,
                        evidencia_nombre,
                    ],
                )
                if cur.rowcount == 0:
                    cur.execute(
                        """
                        INSERT INTO evidencias (
                            documento, evidencia_nombre, letra, estado
                        ) VALUES (%s,%s,%s,%s)
                        """,
                        [
                            doc,
                            evidencia_nombre,
                            (val_norm if val_norm != "" else None),
                            estado,
                        ],
                    )
                # Poblar/actualizar evidencias_detalle solo si materia_id es válido para cumplir FK
                trimestre_val = 1
                if materia_id_valid:
                    # Intentar UPDATE primero
                    cur.execute(
                    """
                    UPDATE evidencias_detalle
                    SET letra = %s,
                        estado = %s,
                        observaciones = COALESCE(observaciones, NULL),
                        materia_id = COALESCE(%s, materia_id),
                        ficha_id = COALESCE(%s, ficha_id),
                        estudiante_nombre = COALESCE(%s, estudiante_nombre),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE estudiante_documento = %s AND evidencia_nombre = %s AND trimestre = %s
                    """,
                    [
                        letra_detalle,
                        estado,
                        materia_id,
                        payload.ficha_id,
                        nombre,
                        doc,
                        evidencia_nombre,
                        trimestre_val,
                    ],
                    )
                    if cur.rowcount == 0:
                        # No existía -> INSERT
                        cur.execute(
                        """
                        INSERT INTO evidencias_detalle (
                            materia_id, ficha_id, estudiante_nombre, estudiante_documento,
                            evidencia_nombre, trimestre, letra, estado, observaciones, fecha_carga, cargado_por
                        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s, CURRENT_DATE, %s)
                        """,
                        [
                            materia_id,
                            payload.ficha_id,
                            nombre,
                            doc,
                            evidencia_nombre,
                            trimestre_val,
                            letra_detalle,
                            estado,
                            None,
                            (user.get("id") if isinstance(user, dict) else None),
                        ],
                        )
                        detalle_inserted += 1
                    else:
                        detalle_updated += 1
                inserted += 1
            except Exception as e:
                errores.append(f"Error guardando {doc}: {e}")
        conn.commit()
        # Registrar auditoría persistente del upload por columna
        try:
            ficha_numero_val = None
            if resolved_ficha_id:
                try:
                    cur.execute("SELECT numero FROM fichas WHERE id=%s", [resolved_ficha_id])
                    row = cur.fetchone()
                    if row and row.get("numero"):
                        ficha_numero_val = row.get("numero")
                except Exception:
                    ficha_numero_val = None
            cur.execute(
                """
                INSERT INTO audit_logs (user_id, user_email, user_rol, accion, modulo, entidad_tipo, entidad_id, detalles, metadata)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                [
                    user.get("id") if isinstance(user, dict) else None,
                    user.get("email") if isinstance(user, dict) else None,
                    user.get("rol") if isinstance(user, dict) else None,
                    "upload",  # usar mismo accion que wide para unificar historial
                    "evidencias",
                    "ficha",
                    resolved_ficha_id,
                    f"Carga por columna '{evidencia_nombre}'. Registros: {counts['tot_registros']}",
                    {
                        "modo": "single-column",
                        "evidencia_nombre": evidencia_nombre,
                        "ficha_numero": ficha_numero_val,
                        "ficha_id": resolved_ficha_id,
                        "materia_id": materia_id if materia_id_valid else None,
                        "counts": counts,
                        "insertados": inserted,
                    },
                ]
            )
            conn.commit()  # asegurar persistencia del log
        except Exception:
            # No bloquear por auditoría
            pass
    return {"success": len(errores) == 0, "insertados": inserted, "detalle": {"updated": detalle_updated, "inserted": detalle_inserted}, "errores": errores}
