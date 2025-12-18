from fastapi import APIRouter, Query
from datetime import datetime, timedelta
from psycopg.rows import dict_row
from ..db import get_conn
from ..utils.grades import average_letters

router = APIRouter(prefix="/api/v1/dashboard/coordinador", tags=["dashboard-coordinador"])

def _fetch_one(cur, sql: str, params=None, default=0):
    try:
        cur.execute(sql, params or [])
        row = cur.fetchone()
        if not row:
            return default
        if isinstance(row, dict):
            v = list(row.values())[0]
            return v if v is not None else default
        return row[0] if row[0] is not None else default
    except Exception:
        return default

def _trend(current: float, previous: float) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100.0, 2)

@router.get("/stats")
def coordinador_stats():
    now = datetime.utcnow()
    period_start = now - timedelta(days=30)
    prev_start = now - timedelta(days=60)
    prev_end = now - timedelta(days=30)

    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        total_evidencias = _fetch_one(cur, "SELECT COUNT(*) FROM evidencias e JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa")
        entregadas = _fetch_one(cur, "SELECT COUNT(*) FROM evidencias e JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa WHERE e.letra IS NOT NULL AND e.letra <> '-' ")
        calificadas = _fetch_one(cur, "SELECT COUNT(*) FROM evidencias e JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa WHERE e.letra IS NOT NULL")
        fichas_activas = _fetch_one(cur, "SELECT COUNT(*) FROM fichas WHERE (estado='activa' OR estado IS NULL)")

        # Promedio general por letra (heurística)
        try:
            cur.execute("""
                SELECT letra FROM evidencias WHERE letra IS NOT NULL AND letra <> '-' LIMIT 5000
            """)
            letras = [r[0] if not isinstance(r, dict) else r['letra'] for r in cur.fetchall() or []]
        except Exception:
            letras = []
        promedio_general = average_letters(letras)

        # Period comparisons
        def period_ratio(where: str):
            try:
                cur.execute(f"SELECT COUNT(*) FROM evidencias e JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa WHERE {where} AND e.created_at BETWEEN %s AND %s", [period_start, now])
                c1 = cur.fetchone()[0]
                cur.execute(f"SELECT COUNT(*) FROM evidencias e JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa WHERE {where} AND e.created_at BETWEEN %s AND %s", [prev_start, prev_end])
                c2 = cur.fetchone()[0]
                return c1, c2
            except Exception:
                return 0, 0
        entregadas_cur, entregadas_prev = period_ratio("letra IS NOT NULL AND letra <> '-' ")
        calificadas_cur, calificadas_prev = period_ratio("letra IS NOT NULL")

    tareas_entregadas_pct = round((entregadas / total_evidencias)*100, 2) if total_evidencias else 0.0
    calificaciones_cargadas_pct = round((calificadas / total_evidencias)*100, 2) if total_evidencias else 0.0

    return {
        "success": True,
        "data": {
            "tareasEntregadasPorcentaje": tareas_entregadas_pct,
            "calificacionesCargadasPorcentaje": calificaciones_cargadas_pct,
            "promedioGeneral": promedio_general,
            "fichasActivas": fichas_activas,
            "tendencias": {
                "tareas": _trend(entregadas_cur, entregadas_prev),
                "calificaciones": _trend(calificadas_cur, calificadas_prev)
            },
            "periodo": {
                "inicio": period_start.isoformat(),
                "fin": now.isoformat()
            }
        }
    }

@router.get("/at-risk-students")
def coordinador_at_risk_students(limit: int = Query(10, ge=1, le=100)):
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            cur.execute("""
                SELECT e.documento AS estudiante, SUM(CASE WHEN e.letra='-' THEN 1 ELSE 0 END) AS faltas
                FROM evidencias e
                JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa
                GROUP BY e.documento
                HAVING SUM(CASE WHEN e.letra='-' THEN 1 ELSE 0 END) > 10
                ORDER BY faltas DESC
                LIMIT %s
            """, [limit])
            rows = cur.fetchall() or []
            data = [{"estudiante": (r.get('estudiante') if isinstance(r, dict) else r[0]), "faltas": (r.get('faltas') if isinstance(r, dict) else r[1])} for r in rows]
        except Exception:
            data = []
    return {"success": True, "data": data}

@router.get("/performance-by-course")
def coordinador_performance_by_course(limit: int = Query(10, ge=1, le=50)):
    """Performance heurístico por materia (usa evidencias agrupadas por evidencia_nombre)."""
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            cur.execute("""
                SELECT e.evidencia_nombre AS curso,
                       COUNT(*) AS total,
                       SUM(CASE WHEN e.letra IS NOT NULL AND e.letra <> '-' THEN 1 ELSE 0 END) AS entregadas,
                       SUM(CASE WHEN e.letra IS NOT NULL THEN 1 ELSE 0 END) AS calificadas
                FROM evidencias e
                JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa
                GROUP BY e.evidencia_nombre
                ORDER BY COUNT(*) DESC
                LIMIT %s
            """, [limit])
            rows = cur.fetchall() or []
            data = []
            for r in rows:
                curso = r.get('curso') if isinstance(r, dict) else r[0]
                total = r.get('total') if isinstance(r, dict) else r[1]
                entregadas = r.get('entregadas') if isinstance(r, dict) else r[2]
                calificadas = r.get('calificadas') if isinstance(r, dict) else r[3]
                completion = round((entregadas/total)*100,2) if total else 0.0
                calif_pct = round((calificadas/total)*100,2) if total else 0.0
                data.append({
                    "curso": curso,
                    "total": total,
                    "entregadas": entregadas,
                    "calificadas": calificadas,
                    "progreso": completion,
                    "calificacionesPct": calif_pct
                })
        except Exception:
            data = []
    return {"success": True, "data": data}

@router.get("/pending-approvals")
def coordinador_pending_approvals():
    """Placeholder: cargas pendientes. Si no existe tabla de uploads, devuelve cero."""
    # Intentar detectar tabla uploads
    pending = 0
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            cur.execute("SELECT COUNT(*) FROM uploads WHERE estado='pendiente_aprobacion'")
            pending = cur.fetchone()[0]
        except Exception:
            pending = 0
    return {"success": True, "data": {"cargasPendientesAprobacion": pending}}

@router.get("/managed-students")
def coordinador_managed_students():
    """Métricas globales de estudiantes (heurística, sin relación directa coordinador-estudiante definida)."""
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        # Total distintos por evidencias (documento) y por calificaciones (estudiante_documento)
        total = 0
        try:
            cur.execute("SELECT COUNT(DISTINCT estudiante_documento) FROM calificaciones")
            total = cur.fetchone()[0] or 0
        except Exception:
            try:
                cur.execute("SELECT COUNT(DISTINCT documento) FROM evidencias")
                total = cur.fetchone()[0] or 0
            except Exception:
                total = 0
        estado = {"Aprobado": 0, "Reprobado": 0, "Cursando": 0}
        try:
            cur.execute("""
                SELECT estado, COUNT(DISTINCT estudiante_documento) AS c
                FROM calificaciones WHERE estado IS NOT NULL
                GROUP BY estado
            """)
            for r in cur.fetchall() or []:
                if isinstance(r, dict):
                    estado[r.get("estado")] = r.get("c")
                else:
                    estado[r[0]] = r[1]
        except Exception:
            pass
        por_materia = []
        try:
            cur.execute("""
                SELECT m.id, m.nombre, COUNT(DISTINCT c.estudiante_documento) AS estudiantes
                FROM calificaciones c JOIN materias m ON m.id = c.materia_id
                GROUP BY m.id, m.nombre
                ORDER BY estudiantes DESC
                LIMIT 25
            """)
            for r in cur.fetchall() or []:
                por_materia.append({"materiaId": r.get("id"), "materia": r.get("nombre"), "estudiantes": r.get("estudiantes")})
        except Exception:
            pass
        por_ficha = []
        try:
            cur.execute("""
                SELECT f.id, f.numero, COUNT(DISTINCT c.estudiante_documento) AS estudiantes
                FROM calificaciones c JOIN fichas f ON f.id = c.ficha_id
                GROUP BY f.id, f.numero
                ORDER BY estudiantes DESC
                LIMIT 25
            """)
            for r in cur.fetchall() or []:
                por_ficha.append({"fichaId": r.get("id"), "ficha": r.get("numero"), "estudiantes": r.get("estudiantes")})
        except Exception:
            pass
    return {"success": True, "data": {"total": total, "estado": estado, "porMateria": por_materia, "porFicha": por_ficha}}
