from typing import List, Dict, Any
from psycopg.rows import dict_row
from ..db import get_conn
from ..utils.email import OutgoingEmail

# Thresholds
FALTAS_THRESHOLD = 5  # evidencias con letra '-' o NULL

class PendingResumen:
    def __init__(self, estudiante: str, faltas: int):
        self.estudiante = estudiante
        self.faltas = faltas

    def to_dict(self):
        return {"estudiante": self.estudiante, "faltas": self.faltas}

def fetch_pendientes(limit: int = 50) -> List[PendingResumen]:
    """Devuelve estudiantes con número de evidencias pendientes/faltantes (letra '-' o NULL)."""
    sql = """
      SELECT documento AS estudiante,
             SUM(CASE WHEN letra='-' OR letra IS NULL THEN 1 ELSE 0 END) AS faltas
      FROM evidencias e
      JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa
      GROUP BY documento
      HAVING SUM(CASE WHEN letra='-' OR letra IS NULL THEN 1 ELSE 0 END) >= %s
      ORDER BY faltas DESC
      LIMIT %s
    """
    resultados: List[PendingResumen] = []
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            cur.execute(sql, [FALTAS_THRESHOLD, limit])
            for r in cur.fetchall() or []:
                resultados.append(PendingResumen(r.get("estudiante"), int(r.get("faltas") or 0)))
        except Exception:
            pass
    return resultados

def build_email(resumenes: List[PendingResumen], destinatarios: List[str]) -> OutgoingEmail:
    if not resumenes:
        body = "No hay estudiantes con evidencias pendientes sobre el umbral actual."
    else:
        lines = ["Resumen de evidencias pendientes (umbral >= %d)" % FALTAS_THRESHOLD, ""]
        for r in resumenes:
            lines.append(f"- {r.estudiante}: {r.faltas} faltas")
        body = "\n".join(lines)
    return OutgoingEmail(destinatarios, "Alerta de evidencias pendientes", body)

