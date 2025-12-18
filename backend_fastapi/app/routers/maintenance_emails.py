from fastapi import APIRouter, Depends, Query
from psycopg.rows import dict_row
from ..security import get_current_user_claims
from ..services.pending_evidencias import fetch_pendientes, build_email
from ..utils.email import send_email, email_status, OutgoingEmail
from ..utils.audit import record_event
from ..db import get_conn

router = APIRouter(prefix="/api/v1/maintenance/emails", tags=["maintenance-emails"])

# Solo Administrador puede usar

def ensure_admin(claims: dict):
    """Verifica rol administrador de forma case-insensitive.
    Acepta variantes 'Administrador', 'administrador', etc.
    """
    rol = (claims or {}).get("rol")
    if not rol or rol.lower() != "administrador":
        return False
    return True

def ensure_admin_or_docente(claims: dict):
    """Permite Administrador o Docente."""
    rol = (claims or {}).get("rol", "").lower()
    return rol in ("administrador", "docente")

@router.get("/status")
def email_cfg_status(claims: dict = Depends(get_current_user_claims)):
    return {"success": True, "data": email_status(), "admin": ensure_admin(claims)}

@router.get("/pending-evidencias/dry-run")
def pending_evidencias_dry(limit: int = Query(50, ge=1, le=200), claims: dict = Depends(get_current_user_claims)):
    if not ensure_admin(claims):
        return {"success": False, "error": "No autorizado"}
    resumenes = fetch_pendientes(limit)
    # Destinatarios simulados: todos coordinadores / docentes activos
    destinatarios = []
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            cur.execute("SELECT email FROM users WHERE activo AND rol IN ('Coordinador','Docente')")
            destinatarios = [r.get('email') for r in cur.fetchall() or []]
        except Exception:
            destinatarios = []
    email_obj = build_email(resumenes, destinatarios)
    return {"success": True, "data": {"pendientes": [r.to_dict() for r in resumenes], "emailPreview": {"to": email_obj.to, "subject": email_obj.subject, "body": email_obj.body}, "enabled": email_status().get("enabled")}}

@router.post("/pending-evidencias/trigger")
def pending_evidencias_trigger(limit: int = Query(50, ge=1, le=200), claims: dict = Depends(get_current_user_claims)):
    if not ensure_admin(claims):
        return {"success": False, "error": "No autorizado"}
    resumenes = fetch_pendientes(limit)
    destinatarios = []
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            cur.execute("SELECT email FROM users WHERE activo AND rol IN ('Coordinador','Docente')")
            destinatarios = [r.get('email') for r in cur.fetchall() or []]
        except Exception:
            destinatarios = []
    email_obj = build_email(resumenes, destinatarios)
    sent = send_email(email_obj)
    with get_conn() as conn:
        try:
            record_event(conn,
                         accion="trigger_pending_evidencias_email",
                         user_id=int(claims.get("sub")) if claims.get("sub") else None,
                         user_email=claims.get("email"),
                         user_rol=claims.get("rol"),
                         modulo="maintenance",
                         entidad_tipo="email_batch",
                         detalles={"destinatarios": len(destinatarios), "sent": sent, "pendientes": len(resumenes)})
        except Exception:
            pass
    return {"success": True, "data": {"sent": sent, "email": {"to": email_obj.to, "subject": email_obj.subject}, "enabled": email_status().get("enabled")}}

# Envío de correos por umbrales de 'D' (reprobadas) por materia/ficha
@router.post("/absence/by-materia-ficha")
def absence_by_materia_ficha(materia_id: int = Query(..., ge=1),
                             ficha_id: int = Query(..., ge=1),
                             student_threshold: int = Query(3, ge=1),
                             escalation_threshold: int = Query(5, ge=1),
                             include_pending: bool = Query(True, description="Incluir no entregadas ('-') además de 'D'"),
                             claims: dict = Depends(get_current_user_claims)):
    if not ensure_admin_or_docente(claims):
        return {"success": False, "error": "No autorizado"}
    # Obtener detalles de la materia para incluir en el correo
    materia_det = {"id": materia_id, "codigo": None, "nombre": None}
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            cur.execute("SELECT id, codigo, nombre FROM materias WHERE id=%s", [materia_id])
            r = cur.fetchone()
            if r:
                materia_det = {"id": r.get("id"), "codigo": r.get("codigo"), "nombre": r.get("nombre")}
        except Exception:
            pass
    # Construir conteos de 'D' por estudiante en la materia/ficha
    rows = []
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            # Contar reprobaciones: por defecto 'D'; si include_pending=True, también cuenta '-'
            if include_pending:
                cur.execute(
                    """
                    SELECT e.documento, s.nombre, s.apellido, s.correo,
                           COUNT(*) AS d_count
                    FROM evidencias e
                    JOIN estudiantes s ON s.documento = e.documento
                    WHERE e.letra IN ('D','-')
                      AND s.ficha_id = %s
                      AND EXISTS (SELECT 1 FROM materias m WHERE m.id=%s)
                    GROUP BY e.documento, s.nombre, s.apellido, s.correo
                    ORDER BY d_count DESC
                    """,
                    [ficha_id, materia_id]
                )
            else:
                cur.execute(
                    """
                    SELECT e.documento, s.nombre, s.apellido, s.correo,
                           COUNT(*) AS d_count
                    FROM evidencias e
                    JOIN estudiantes s ON s.documento = e.documento
                    WHERE e.letra = 'D'
                      AND s.ficha_id = %s
                      AND EXISTS (SELECT 1 FROM materias m WHERE m.id=%s)
                    GROUP BY e.documento, s.nombre, s.apellido, s.correo
                    ORDER BY d_count DESC
                    """,
                    [ficha_id, materia_id]
                )
            rows = cur.fetchall() or []
        except Exception as e:
            return {"success": False, "error": str(e)}
    sent_any = False
    attempts = []
    for r in rows:
        doc = r.get("documento")
        nombre = r.get("nombre")
        apellido = r.get("apellido")
        correo = r.get("correo") or doc
        d_count = int(r.get("d_count") or 0)
        if d_count >= escalation_threshold:
            # Escalación: correo al estudiante y al coordinador/docente si disponibles
            to_list = [correo]
            # Buscar coordinador y docente relacionados a la ficha/materia
            extra = []
            with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
                try:
                    cur.execute("SELECT email FROM users WHERE rol IN ('Coordinador','Docente') AND activo")
                    extra = [x.get("email") for x in cur.fetchall() or []]
                except Exception:
                    extra = []
            to_list += extra
            subject = "[CRÍTICO] Reprobaciones acumuladas"
            body = (
                f"Estudiante {nombre} {apellido} acumula {d_count} evidencias reprobadas"
                f" en la ficha {ficha_id}.\n"
                f"Materia: {materia_det.get('codigo') or '-'} - {materia_det.get('nombre') or '-'}\n"
                f"Se requiere intervención."
            )
            sent = send_email(OutgoingEmail(to=to_list, subject=subject, body=body))
            attempts.append({"documento": doc, "to": to_list, "count": d_count, "escalation": True, "sent": bool(sent)})
            sent_any = sent_any or sent
        elif d_count >= student_threshold:
            # Aviso al estudiante
            to_list = [correo]
            subject = "Alerta de rendimiento: evidencias reprobadas"
            body = (
                f"Hola {nombre}, acumulas {d_count} evidencias reprobadas"
                f" en la ficha {ficha_id}.\n"
                f"Materia: {materia_det.get('codigo') or '-'} - {materia_det.get('nombre') or '-'}\n"
                f"Por favor contacta a tu docente para apoyo."
            )
            sent = send_email(OutgoingEmail(to=to_list, subject=subject, body=body))
            attempts.append({"documento": doc, "to": to_list, "count": d_count, "escalation": False, "sent": bool(sent)})
            sent_any = sent_any or sent
    try:
        with get_conn() as conn:
            record_event(conn,
                         accion="absence_threshold_emails",
                         user_id=int(claims.get("sub")) if claims.get("sub") else None,
                         user_email=claims.get("email"),
                         user_rol=claims.get("rol"),
                         modulo="maintenance",
                         entidad_tipo="absence_batch",
                         detalles={"rows": len(rows), "sent": bool(sent_any), "materia_id": materia_id, "ficha_id": ficha_id})
    except Exception:
        pass
    return {"success": True, "data": {"rows": len(rows), "sent_any": bool(sent_any), "enabled": email_status().get("enabled"), "attempts": attempts, "include_pending": include_pending}}

# Diagnóstico: conteos por ficha/materia para letras 'D' y '-'
@router.get("/absence/diagnostico/contar")
def diagnostico_contar(materia_id: int = Query(..., ge=1),
                       ficha_id: int = Query(..., ge=1),
                       include_pending: bool = Query(True),
                       claims: dict = Depends(get_current_user_claims)):
    if not ensure_admin_or_docente(claims):
        return {"success": False, "error": "No autorizado"}
    rows = []
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        try:
            if include_pending:
                cur.execute(
                    """
                    SELECT s.ficha_id, e.letra, COUNT(*) AS cnt
                    FROM evidencias e
                    JOIN estudiantes s ON s.documento = e.documento
                    WHERE s.ficha_id = %s
                      AND EXISTS (SELECT 1 FROM materias m WHERE m.id=%s)
                      AND e.letra IN ('D','-')
                    GROUP BY s.ficha_id, e.letra
                    ORDER BY e.letra
                    """,
                    [ficha_id, materia_id]
                )
            else:
                cur.execute(
                    """
                    SELECT s.ficha_id, e.letra, COUNT(*) AS cnt
                    FROM evidencias e
                    JOIN estudiantes s ON s.documento = e.documento
                    WHERE s.ficha_id = %s
                      AND EXISTS (SELECT 1 FROM materias m WHERE m.id=%s)
                      AND e.letra = 'D'
                    GROUP BY s.ficha_id, e.letra
                    ORDER BY e.letra
                    """,
                    [ficha_id, materia_id]
                )
            rows = cur.fetchall() or []
        except Exception as e:
            return {"success": False, "error": str(e)}
    return {"success": True, "data": {"counts": rows, "include_pending": include_pending}}

# Test: enviar un correo de prueba para verificar SMTP
@router.post("/test/send")
def test_send(to: str = Query("test@local.test"), claims: dict = Depends(get_current_user_claims)):
    if not ensure_admin_or_docente(claims):
        return {"success": False, "error": "No autorizado"}
    subject = "Prueba de SMTP (MailHog)"
    body = "Este es un correo de prueba enviado por el backend."
    sent = send_email(OutgoingEmail(to=[to], subject=subject, body=body))
    return {"success": True, "data": {"sent": bool(sent), "to": to, "status": email_status()}}
