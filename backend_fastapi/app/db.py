import os
from contextlib import contextmanager
import psycopg
try:  # Python 3.9 compatibility: avoid PEP604 at annotation time if import issues
    from psycopg_pool import ConnectionPool
except ImportError:  # Fallback: provide a clear error later when first used
    ConnectionPool = None  # type: ignore


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default)


def get_db_settings():
    return {
        "host": _env("DB_HOST", "localhost"),
        "port": int(_env("DB_PORT", "5432")),
        "name": _env("DB_NAME", "gestion_academica"),
        "user": _env("DB_USER", "admin_academico"),
        "password": _env("DB_PASSWORD", ""),
    }


def build_dsn() -> str:
    cfg = get_db_settings()
    return (
        f"host={cfg['host']} port={cfg['port']} dbname={cfg['name']} user={cfg['user']} password={cfg['password']}"
    )


# Global connection pool (lazy init) - avoid PEP 604 (|) for Python 3.9 runtime quirks
_pool = None  # type: ignore[assignment]


def get_pool():  # -> ConnectionPool
    global _pool
    if _pool is None:
        cfg = get_db_settings()
        dsn = (
            f"postgresql://{cfg['user']}:{cfg['password']}@{cfg['host']}:{cfg['port']}/{cfg['name']}"
        )
        # Pool params roughly mirror Node pool config defaults
        if ConnectionPool is None:
            raise RuntimeError("psycopg_pool not installed. Please install psycopg-pool==3.2.2")
        _pool = ConnectionPool(
            dsn,
            min_size=int(os.getenv("DB_POOL_MIN", "2")),
            max_size=int(os.getenv("DB_POOL_MAX", "10")),
            timeout=int(os.getenv("DB_CONNECTION_TIMEOUT", "5")),
            max_idle=int(os.getenv("DB_IDLE_TIMEOUT", "30")),
        )
    return _pool


@contextmanager
def get_conn():
    pool = get_pool()
    with pool.connection() as conn:  # psycopg connection from pool
        yield conn


def db_health():
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}
