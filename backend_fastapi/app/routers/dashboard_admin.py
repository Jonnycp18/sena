from fastapi import APIRouter, Query
from psycopg.rows import dict_row
from datetime import datetime, timedelta
from ..db import get_conn

router = APIRouter(prefix="/api/v1/dashboard/admin", tags=["dashboard-admin"])

def _safe_count(cur, sql: str, params=None) -> int:
    try:
        cur.execute(sql, params or [])
        row = cur.fetchone()
        if not row:
            return 0
        if isinstance(row, dict):
            return list(row.values())[0] or 0
        return row[0] or 0
    except Exception:
        return 0

@router.get("/stats")
def admin_stats():
    """Aggregate statistics for the admin dashboard using existing core tables."""
    now = datetime.utcnow()
    period_end = now
    period_start = now - timedelta(days=30)
    prev_start = now - timedelta(days=60)
    prev_end = now - timedelta(days=30)

    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        usuarios_activos = _safe_count(cur, "SELECT COUNT(*) FROM users WHERE activo")
        fichas_registradas = _safe_count(cur, "SELECT COUNT(*) FROM fichas")
        evidencias_cargadas = _safe_count(cur, "SELECT COUNT(*) FROM evidencias e JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa WHERE e.letra IS NOT NULL")
        tareas_distintas = _safe_count(cur, "SELECT COUNT(DISTINCT e.evidencia_nombre) FROM evidencias e JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa")

        def period_count(table: str, ts_col: str, where_extra: str = ""):
            try:
                cur.execute(f"SELECT COUNT(*) FROM {table} WHERE {ts_col} BETWEEN %s AND %s {where_extra}", [period_start, period_end])
                c1 = cur.fetchone()[0]
                cur.execute(f"SELECT COUNT(*) FROM {table} WHERE {ts_col} BETWEEN %s AND %s {where_extra}", [prev_start, prev_end])
                c2 = cur.fetchone()[0]
                return c1, c2
            except Exception:
                return 0, 0

        new_users_30, new_users_prev = period_count("users", "created_at")
        evidencias_30, evidencias_prev = period_count("evidencias e JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa", "e.created_at", "AND e.letra IS NOT NULL")

    def trend(current: int, previous: int):
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100.0, 2)

    return {
        "success": True,
        "data": {
            "usuariosActivos": usuarios_activos,
            "fichasRegistradas": fichas_registradas,
            "tareasCargadas": evidencias_cargadas,
            "tareasDistintas": tareas_distintas,
            "tendencias": {
                "usuarios": trend(new_users_30, new_users_prev),
                "cargas": trend(evidencias_30, evidencias_prev)
            },
            "periodo": {
                "actualDesde": period_start.isoformat(),
                "actualHasta": period_end.isoformat(),
            }
        }
    }

@router.get("/activity")
def admin_recent_activity(limit: int = Query(10, ge=1, le=50)):
    """Actividad reciente basada en tabla audit_logs.
    Si audit_logs está vacío se muestran eventos básicos de respaldo.
    """
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        events = []
        # Intentar cargar desde audit_logs primero
        try:
            cur.execute("""
                SELECT id, created_at, user_id, user_email, user_rol, accion, modulo,
                       entidad_tipo, entidad_id, metodo_http, ruta, estado_http, duracion_ms
                FROM audit_logs
                ORDER BY created_at DESC
                LIMIT %s
            """, [limit])
            rows = cur.fetchall() or []
            for r in rows:
                events.append({
                    "id": r.get('id'),
                    "timestamp": r.get('created_at'),
                    "usuario": r.get('user_email') or r.get('user_id'),
                    "rol": r.get('user_rol'),
                    "accion": r.get('accion'),
                    "modulo": r.get('modulo'),
                    "entidadTipo": r.get('entidad_tipo'),
                    "entidadId": r.get('entidad_id'),
                    "http": {
                        "metodo": r.get('metodo_http'),
                        "ruta": r.get('ruta'),
                        "estado": r.get('estado_http'),
                        "duracionMs": r.get('duracion_ms')
                    }
                })
        except Exception:
            events = []
        # Fallback si no hay datos de audit_logs
        if not events:
            try:
                cur.execute("""
                    SELECT 'usuario_creado' AS tipo, id, email, nombre, apellido, rol, created_at
                    FROM users
                    ORDER BY created_at DESC
                    LIMIT %s
                """, [limit])
                for r in cur.fetchall() or []:
                    events.append({
                        "timestamp": r.get('created_at'),
                        "usuario": r.get('email'),
                        "rol": r.get('rol'),
                        "accion": "usuario_creado",
                        "modulo": "users"
                    })
            except Exception:
                pass
            try:
                cur.execute("""
                    SELECT e.evidencia_nombre, e.documento, e.created_at, e.letra
                    FROM evidencias e
                    JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa
                    WHERE e.letra IS NOT NULL
                    ORDER BY e.created_at DESC
                    LIMIT %s
                """, [limit])
                for r in cur.fetchall() or []:
                    events.append({
                        "timestamp": r.get('created_at'),
                        "usuario": r.get('documento'),
                        "accion": "calificacion_registrada",
                        "modulo": "calificaciones",
                        "entidadTipo": "evidencia",
                        "entidadId": r.get('evidencia_nombre'),
                    })
            except Exception:
                pass
        events.sort(key=lambda e: e.get('timestamp') or datetime.min, reverse=True)
    return {"success": True, "data": events[:limit]}

@router.get("/pending-tasks")
def admin_pending_tasks():
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        inactivos = _safe_count(cur, "SELECT COUNT(*) FROM users WHERE NOT activo")
        evidencias_pendientes = _safe_count(cur, "SELECT COUNT(*) FROM evidencias e JOIN evidencia_definicion d ON d.nombre = e.evidencia_nombre AND d.activa WHERE e.letra IS NULL")
        try:
            cur.execute("""
                SELECT COUNT(*) FROM (
                  SELECT documento, SUM(CASE WHEN letra='-' THEN 1 ELSE 0 END) AS faltas
                  FROM evidencias
                  GROUP BY documento
                  HAVING SUM(CASE WHEN letra='-' THEN 1 ELSE 0 END) > 10
                ) t
            """)
            riesgo = cur.fetchone()[0]
        except Exception:
            riesgo = 0
    return {"success": True, "data": {"usuariosInactivos": inactivos, "evidenciasPendientes": evidencias_pendientes, "estudiantesAltoRiesgo": riesgo}}

@router.get("/managed-students")
def admin_managed_students():
    """Métricas globales de estudiantes (admin)."""
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            cur.execute("SELECT COUNT(DISTINCT estudiante_documento) AS total FROM calificaciones")
            total = (cur.fetchone() or {}).get("total", 0)
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
                estado[r.get("estado") if isinstance(r, dict) else r[0]] = r.get("c") if isinstance(r, dict) else r[1]
        except Exception:
            pass
        por_materia = []
        try:
            cur.execute("""
                SELECT m.id, m.nombre, COUNT(DISTINCT c.estudiante_documento) AS estudiantes
                FROM calificaciones c JOIN materias m ON m.id = c.materia_id
                GROUP BY m.id, m.nombre
                ORDER BY estudiantes DESC
                LIMIT 50
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
                LIMIT 50
            """)
            for r in cur.fetchall() or []:
                por_ficha.append({"fichaId": r.get("id"), "ficha": r.get("numero"), "estudiantes": r.get("estudiantes")})
        except Exception:
            pass
    return {"success": True, "data": {"total": total, "estado": estado, "porMateria": por_materia, "porFicha": por_ficha}}
