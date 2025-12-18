from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import psycopg2
from psycopg2.extras import execute_values

router = APIRouter()

class EvidenciaRow(BaseModel):
    documento: str = Field(..., description="Documento del estudiante")
    estudiante: Optional[str] = Field(None, description="Nombre del estudiante")
    correo: Optional[str] = None
    valor: str = Field(..., description="Valor de la evidencia: A, D, -, números, etc.")

class UploadEvidenciaColumnaRequest(BaseModel):
    materia_id: str
    ficha_id: str
    evidencia_nombre: str
    rows: List[EvidenciaRow]

class UploadEvidenciaColumnaResponse(BaseModel):
    success: bool
    message: str
    counts: Dict[str, int]
    registros: int
    fichaId: Optional[str] = None
    fichaNumero: Optional[str] = None

# In-memory store placeholder (replace with DB integration)
EVIDENCIAS_STORE: Dict[str, List[Dict[str, Any]]] = {}

def get_db_conn():
    dsn = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_DSN")
    if not dsn:
        # Construir DSN desde variables separadas
        host = os.getenv("PGHOST", "127.0.0.1")
        port = os.getenv("PGPORT", "5432")
        user = os.getenv("PGUSER", "postgres")
        password = os.getenv("PGPASSWORD", "postgres")
        dbname = os.getenv("PGDATABASE", "gestion_academica")
        dsn = f"host={host} port={port} user={user} password={password} dbname={dbname}"
    return psycopg2.connect(dsn)

@router.post("/upload-columna", response_model=UploadEvidenciaColumnaResponse)
def upload_evidencia_columna(payload: UploadEvidenciaColumnaRequest):
    if not payload.rows:
        raise HTTPException(status_code=400, detail="No hay filas para procesar")

    # Validate basic inputs
    if not payload.materia_id or not payload.ficha_id:
        raise HTTPException(status_code=400, detail="materia_id y ficha_id son requeridos")

    # Process rows: compute counts A/D/pendientes/noEntregadas
    total = len(payload.rows)
    counts = {"A": 0, "D": 0, "pendientes": 0, "noEntregadas": 0}
    for r in payload.rows:
        v = (r.valor or "").strip()
        if v.upper() == "A":
            counts["A"] += 1
        elif v.upper() == "D":
            counts["D"] += 1
        elif v == "-":
            counts["noEntregadas"] += 1
        else:
            counts["pendientes"] += 1

    # Persistencia en Postgres: tabla public.evidencias
    # Columnas esperadas: id (serial), documento (varchar), evidencia_nombre (text),
    # letra (char(1)), estado (varchar(20)), observaciones (text), created_at (timestamp)
    try:
        conn = get_db_conn()
        with conn:
            with conn.cursor() as cur:
                rows_to_insert = []
                for r in payload.rows:
                    letra = (r.valor or "").strip().upper()
                    estado = "No entregó" if letra == '-' else ("pendiente" if letra == '' else ("aprobó" if letra == 'A' else ("reprobó" if letra == 'D' else "pendiente")))
                    rows_to_insert.append((
                        r.documento,
                        payload.evidencia_nombre,
                        letra if letra in ('A','D','-','') else '',
                        estado,
                        None
                    ))
                # Insert simple; si deseas evitar duplicados, se puede agregar ON CONFLICT si hay índice único
                sql = """
                INSERT INTO public.evidencias (documento, evidencia_nombre, letra, estado, observaciones, created_at)
                VALUES %s
                """
                execute_values(cur, sql, rows_to_insert, template="(%s,%s,%s,%s,%s, NOW())")
        conn.close()
    except Exception as e:
        # Si falla DB, aún respondemos con HTTP 500
        raise HTTPException(status_code=500, detail=f"Error persistiendo evidencia: {e}")

    return UploadEvidenciaColumnaResponse(
        success=True,
        message=f"Evidencia '{payload.evidencia_nombre}' guardada en BD",
        counts=counts,
        registros=total,
        fichaId=payload.ficha_id,
        fichaNumero=None,
    )
