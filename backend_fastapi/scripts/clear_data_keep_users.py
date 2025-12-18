#!/usr/bin/env python3
import os
import sys
from pathlib import Path
import psycopg

APP_DIR = Path(__file__).resolve().parents[1]  # backend_fastapi/
ENV_PATH = APP_DIR / ".env"

def load_env_file(path: Path):
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        k, v = line.split("=", 1)
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        os.environ.setdefault(k, v)


def get_db_cfg():
    return {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", "5432")),
        "name": os.getenv("DB_NAME", "gestion_academica"),
        "user": os.getenv("DB_USER", "admin_academico"),
        "password": os.getenv("DB_PASSWORD", ""),
    }


def main():
    load_env_file(ENV_PATH)
    cfg = get_db_cfg()
    dsn = f"host={cfg['host']} port={cfg['port']} dbname={cfg['name']} user={cfg['user']} password={cfg['password']}"
    sql = (APP_DIR / "scripts" / "clear_data_keep_users.sql").read_text(encoding="utf-8")

    print("Connecting to:", f"{cfg['host']}:{cfg['port']}/{cfg['name']} as {cfg['user']}")
    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
    print("Done: truncated all public tables except 'users'.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("ERROR:", e, file=sys.stderr)
        sys.exit(1)
