from fastapi import APIRouter
from ..db import get_conn, get_db_settings

router = APIRouter(prefix="/api/v1/db", tags=["db"])

@router.get("/ping")
def db_ping():
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT version();")
                version = cur.fetchone()[0]
        cfg = get_db_settings()
        return {
            "ok": True,
            "engine": version,
            "database": cfg["name"],
            "host": cfg["host"],
            "user": cfg["user"],
        }
    except Exception as e:
        cfg = get_db_settings()
        redacted = {**cfg, "password": ("***" if cfg.get("password") else "")}
        return {"ok": False, "error": str(e), "config": redacted}


@router.get("/config")
def db_config():
    cfg = get_db_settings()
    redacted = {**cfg, "password": ("***" if cfg.get("password") else "")}
    return {"config": redacted}
