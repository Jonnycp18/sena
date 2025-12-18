from typing import Any, Optional, Dict
from psycopg import Connection

AUDIT_ENABLED = True

def record_event(conn: Connection,
                 accion: str,
                 user_id: Optional[int] = None,
                 user_email: Optional[str] = None,
                 user_rol: Optional[str] = None,
                 modulo: Optional[str] = None,
                 entidad_tipo: Optional[str] = None,
                 entidad_id: Optional[str] = None,
                 detalles: Optional[Dict[str, Any]] = None,
                 metadata: Optional[Dict[str, Any]] = None,
                 metodo_http: Optional[str] = None,
                 ruta: Optional[str] = None,
                 estado_http: Optional[int] = None,
                 duracion_ms: Optional[int] = None,
                 ip_address: Optional[str] = None,
                 user_agent: Optional[str] = None) -> None:
    """Inserta un evento de auditoría en audit_logs usando columnas existentes.
    Tolerante a errores: nunca hace raise que rompa la lógica de negocio.
    Solo inserta columnas suministradas (las demás quedan NULL o defaults).
    """
    if not AUDIT_ENABLED:
        return
    try:
        cols = []
        vals = []
        def add(col: str, val: Any):
            if val is not None:
                cols.append(col)
                vals.append(val)
        add("user_id", user_id)
        add("user_email", user_email)
        add("user_rol", user_rol)
        add("accion", accion)
        add("modulo", modulo)
        add("entidad_tipo", entidad_tipo)
        add("entidad_id", entidad_id)
        add("detalles", detalles)
        add("metadata", metadata)
        add("metodo_http", metodo_http)
        add("ruta", ruta)
        add("estado_http", estado_http)
        add("duracion_ms", duracion_ms)
        add("ip_address", ip_address)
        add("user_agent", user_agent)
        if not cols:
            return
        placeholders = ",".join(["%s"] * len(cols))
        sql = f"INSERT INTO audit_logs ({','.join(cols)}) VALUES ({placeholders})"
        with conn.cursor() as cur:
            cur.execute(sql, vals)
    except Exception:
        pass
