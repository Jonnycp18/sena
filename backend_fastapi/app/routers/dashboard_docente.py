from fastapi import APIRouter, Query, Depends
from datetime import datetime
from psycopg.rows import dict_row
from ..db import get_conn
from ..security import get_current_user_claims

# Dashboard Docente ahora se basa en tabla calificaciones usando cargado_por = user_id

router = APIRouter(prefix="/api/v1/dashboard/docente", tags=["dashboard-docente"])

def _row_value(row, idx=0):
    if isinstance(row, dict):
        return list(row.values())[idx]
    return row[idx]

@router.get("/stats")
def docente_stats(claims: dict = Depends(get_current_user_claims)):
    """Estadísticas principales del docente basadas en calificaciones cargadas por él (cargado_por)."""
    now = datetime.utcnow()
    user_id = int(claims.get("sub")) if claims and claims.get("sub") else None
    if not user_id:
        return {"success": True, "data": {"totalRegistros": 0, "calificacionesCargadas": 0, "entregadas": 0, "pendientes": 0, "promedioHeuristico": 0.0, "timestamp": now.isoformat(), "fichasWide": 0, "estudiantesWide": 0, "cargasWide": 0, "pendientesWide": 0}}
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        # Total registros (todas las filas cargadas por el docente)
        try:
            cur.execute("SELECT COUNT(*) FROM calificaciones WHERE cargado_por=%s", [user_id])
            total_reg = _row_value(cur.fetchone()) or 0
        except Exception:
            total_reg = 0
        # Calificaciones con nota (cargadas)
        try:
            cur.execute("SELECT COUNT(*) FROM calificaciones WHERE cargado_por=%s AND nota IS NOT NULL", [user_id])
            calificadas = _row_value(cur.fetchone()) or 0
        except Exception:
            calificadas = 0
        # Entregadas (nota no nula y estado <> 'Cursando')
        try:
            cur.execute("SELECT COUNT(*) FROM calificaciones WHERE cargado_por=%s AND nota IS NOT NULL AND estado <> 'Cursando'", [user_id])
            entregadas = _row_value(cur.fetchone()) or 0
        except Exception:
            entregadas = calificadas
        # Pendientes (filas sin nota)
        pendientes = total_reg - calificadas if total_reg >= calificadas else 0
        # Promedio (media nota numérica)
        try:
            cur.execute("SELECT AVG(nota) FROM calificaciones WHERE cargado_por=%s AND nota IS NOT NULL", [user_id])
            avg_row = cur.fetchone()
            promedio = float(avg_row[0]) if avg_row and avg_row[0] is not None else 0.0
        except Exception:
            promedio = 0.0
        # ===== Métricas Wide (evidencias) basadas en audit_logs por usuario =====
        # Fichas gestionadas por este docente vía cargas wide
        try:
            cur.execute("""
                SELECT COUNT(DISTINCT entidad_id) FROM audit_logs
                WHERE accion='upload' AND modulo='evidencias' AND user_id=%s AND entidad_id IS NOT NULL
            """, [user_id])
            fichas_wide = _row_value(cur.fetchone()) or 0
        except Exception:
            fichas_wide = 0
        # Cargas wide realizadas
        try:
            cur.execute("""
                SELECT COUNT(*) FROM audit_logs
                WHERE accion='upload' AND modulo='evidencias' AND user_id=%s
            """, [user_id])
            cargas_wide = _row_value(cur.fetchone()) or 0
        except Exception:
            cargas_wide = 0
        # Estudiantes totales involucrados en esas fichas wide
        try:
            cur.execute("""
                SELECT COUNT(DISTINCT documento) FROM estudiantes
                WHERE ficha_id IN (
                  SELECT entidad_id FROM audit_logs
                  WHERE accion='upload' AND modulo='evidencias' AND user_id=%s AND entidad_id IS NOT NULL
                )
            """, [user_id])
            estudiantes_wide = _row_value(cur.fetchone()) or 0
        except Exception:
            estudiantes_wide = 0
        # Evidencias pendientes (letra IS NULL) en esas fichas
        try:
            cur.execute("""
                SELECT COUNT(*) FROM evidencias e
                JOIN estudiantes s ON s.documento=e.documento
                WHERE e.letra IS NULL AND s.ficha_id IN (
                  SELECT entidad_id FROM audit_logs
                  WHERE accion='upload' AND modulo='evidencias' AND user_id=%s AND entidad_id IS NOT NULL
                )
            """, [user_id])
            pendientes_wide = _row_value(cur.fetchone()) or 0
        except Exception:
            pendientes_wide = 0
    return {
        "success": True,
        "data": {
            "totalRegistros": total_reg,
            "calificacionesCargadas": calificadas,
            "entregadas": entregadas,
            "pendientes": pendientes,
            "promedioHeuristico": round(promedio,2),
            "timestamp": now.isoformat(),
            "fichasWide": fichas_wide,
            "estudiantesWide": estudiantes_wide,
            "cargasWide": cargas_wide,
            "pendientesWide": pendientes_wide
        }
    }

@router.get("/my-courses")
def docente_my_courses(limit: int = Query(10, ge=1, le=50), claims: dict = Depends(get_current_user_claims)):
    """Lista de materias calificadas por el docente (agrupado por materia_id)."""
    user_id = int(claims.get("sub")) if claims and claims.get("sub") else None
    if not user_id:
        return {"success": True, "data": []}
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            cur.execute("""
                SELECT m.nombre AS curso,
                       COUNT(c.id) AS total,
                       SUM(CASE WHEN c.nota IS NOT NULL THEN 1 ELSE 0 END) AS calificadas,
                       SUM(CASE WHEN c.nota IS NOT NULL AND c.estado <> 'Cursando' THEN 1 ELSE 0 END) AS entregadas
                FROM calificaciones c
                JOIN materias m ON m.id = c.materia_id
                WHERE c.cargado_por=%s
                GROUP BY m.nombre
                ORDER BY COUNT(c.id) DESC
                LIMIT %s
            """, [user_id, limit])
            rows = cur.fetchall() or []
            data = []
            for r in rows:
                curso = r.get('curso') if isinstance(r, dict) else _row_value(r)
                total = r.get('total') if isinstance(r, dict) else _row_value(r,1)
                calificadas = r.get('calificadas') if isinstance(r, dict) else _row_value(r,2)
                entregadas = r.get('entregadas') if isinstance(r, dict) else _row_value(r,3)
                progreso = round((calificadas/total)*100,2) if total else 0.0
                data.append({
                    "curso": curso,
                    "total": total,
                    "calificadas": calificadas,
                    "entregadas": entregadas,
                    "progreso": progreso
                })
        except Exception:
            data = []
    return {"success": True, "data": data}

@router.get("/pending-grades")
def docente_pending_grades(limit: int = Query(20, ge=1, le=100), claims: dict = Depends(get_current_user_claims)):
    """Calificaciones sin nota cargadas por el docente (pendientes)."""
    user_id = int(claims.get("sub")) if claims and claims.get("sub") else None
    if not user_id:
        return {"success": True, "data": []}
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            cur.execute("""
                SELECT m.nombre AS materia, c.created_at
                FROM calificaciones c
                JOIN materias m ON m.id = c.materia_id
                WHERE c.cargado_por=%s AND c.nota IS NULL
                ORDER BY c.created_at DESC NULLS LAST
                LIMIT %s
            """, [user_id, limit])
            rows = cur.fetchall() or []
            data = []
            for r in rows:
                materia = r.get('materia') if isinstance(r, dict) else _row_value(r)
                created_at = r.get('created_at') if isinstance(r, dict) else _row_value(r,1)
                data.append({"evidencia": materia, "fecha": created_at})
        except Exception:
            data = []
    return {"success": True, "data": data}

@router.get("/recent-uploads")
def docente_recent_uploads(limit: int = Query(10, ge=1, le=50), claims: dict = Depends(get_current_user_claims)):
    """Calificaciones recientes cargadas por el docente (nota IS NOT NULL)."""
    user_id = int(claims.get("sub")) if claims and claims.get("sub") else None
    if not user_id:
        return {"success": True, "data": []}
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            cur.execute("""
                SELECT m.nombre AS materia, f.numero AS ficha, c.fecha_carga, c.nota
                FROM calificaciones c
                JOIN materias m ON m.id = c.materia_id
                LEFT JOIN fichas f ON f.id = c.ficha_id
                WHERE c.cargado_por=%s AND c.nota IS NOT NULL
                ORDER BY c.fecha_carga DESC NULLS LAST
                LIMIT %s
            """, [user_id, limit])
            rows = cur.fetchall() or []
            data = []
            for r in rows:
                materia = r.get('materia') if isinstance(r, dict) else _row_value(r)
                ficha = r.get('ficha') if isinstance(r, dict) else _row_value(r,1)
                fecha = r.get('fecha_carga') if isinstance(r, dict) else _row_value(r,2)
                nota = r.get('nota') if isinstance(r, dict) else _row_value(r,3)
                data.append({
                    "archivo": materia,
                    "ficha": ficha,
                    "fecha": fecha,
                    "registros": 1,
                    "estado": 'exitoso' if nota is not None else 'pendiente',
                    "observaciones": None
                })
        except Exception:
            data = []
    return {"success": True, "data": data}

@router.get("/managed-students")
def docente_managed_students(claims: dict = Depends(get_current_user_claims)):
    """Métricas de estudiantes gestionados por el docente (según calificaciones cargadas)."""
    user_id = int(claims.get("sub")) if claims and claims.get("sub") else None
    if not user_id:
        return {"success": True, "data": {"total": 0, "estado": {}, "porMateria": [], "porFicha": []}}
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            cur.execute("""
                SELECT COUNT(DISTINCT estudiante_documento) AS total FROM calificaciones WHERE cargado_por=%s
            """, [user_id])
            total = (cur.fetchone() or {}).get("total", 0)
        except Exception:
            total = 0
        # Distribución por estado
        estado = {"Aprobado": 0, "Reprobado": 0, "Cursando": 0}
        try:
            cur.execute("""
                SELECT estado, COUNT(DISTINCT estudiante_documento) AS c
                FROM calificaciones WHERE cargado_por=%s AND estado IS NOT NULL
                GROUP BY estado
            """, [user_id])
            for r in cur.fetchall() or []:
                estado[r.get("estado")] = r.get("c")
        except Exception:
            pass
        # Por materia
        por_materia = []
        try:
            cur.execute("""
                SELECT m.id, m.nombre, COUNT(DISTINCT c.estudiante_documento) AS estudiantes
                FROM calificaciones c JOIN materias m ON m.id = c.materia_id
                WHERE c.cargado_por=%s
                GROUP BY m.id, m.nombre
                ORDER BY estudiantes DESC
                LIMIT 25
            """, [user_id])
            for r in cur.fetchall() or []:
                por_materia.append({"materiaId": r.get("id"), "materia": r.get("nombre"), "estudiantes": r.get("estudiantes")})
        except Exception:
            pass
        # Por ficha
        por_ficha = []
        try:
            cur.execute("""
                SELECT f.id, f.numero, COUNT(DISTINCT c.estudiante_documento) AS estudiantes
                FROM calificaciones c JOIN fichas f ON f.id = c.ficha_id
                WHERE c.cargado_por=%s
                GROUP BY f.id, f.numero
                ORDER BY estudiantes DESC
                LIMIT 25
            """, [user_id])
            for r in cur.fetchall() or []:
                por_ficha.append({"fichaId": r.get("id"), "ficha": r.get("numero"), "estudiantes": r.get("estudiantes")})
        except Exception:
            pass
    return {"success": True, "data": {"total": total, "estado": estado, "porMateria": por_materia, "porFicha": por_ficha}}
