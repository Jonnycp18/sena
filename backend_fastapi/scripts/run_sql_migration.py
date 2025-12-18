import os
import sys
from pathlib import Path

# Preferir psycopg v3
try:
    import psycopg
    HAS_PSYCOPG3 = True
except Exception:
    HAS_PSYCOPG3 = False

# Cargar .env del backend_fastapi/.env
try:
    from dotenv import load_dotenv
    APP_DIR = Path(__file__).resolve().parents[1]
    ENV_PATH = APP_DIR / ".env"
    if ENV_PATH.exists():
        load_dotenv(dotenv_path=str(ENV_PATH), override=True)
except Exception:
    pass

PGHOST = os.getenv("PGHOST", "127.0.0.1")
PGPORT = int(os.getenv("PGPORT", "5432"))
PGUSER = os.getenv("PGUSER", "postgres")
PGPASSWORD = os.getenv("PGPASSWORD", "")
PGDATABASE = os.getenv("PGDATABASE", "postgres")


def main():
    if len(sys.argv) < 2:
        print("Uso: python backend_fastapi/scripts/run_sql_migration.py <ruta_sql>")
        sys.exit(1)
    sql_path = Path(sys.argv[1]).resolve()
    if not sql_path.exists():
        print(f"Archivo SQL no existe: {sql_path}")
        sys.exit(1)

    sql = sql_path.read_text(encoding="utf-8")
    if not sql.strip():
        print("Archivo SQL vacío; nada que ejecutar.")
        return

    print(f"Ejecutando migración SQL: {sql_path}")
    if HAS_PSYCOPG3:
        conn = psycopg.connect(
            dbname=PGDATABASE,
            user=PGUSER,
            password=PGPASSWORD,
            host=PGHOST,
            port=PGPORT,
        )
        try:
            with conn.cursor() as cur:
                cur.execute(sql)
            conn.commit()
        finally:
            conn.close()
    else:
        # Fallback a psycopg2 si estuviera instalado con el mismo import name (no recomendado)
        import psycopg2  # type: ignore
        conn = psycopg2.connect(
            dbname=PGDATABASE,
            user=PGUSER,
            password=PGPASSWORD,
            host=PGHOST,
            port=PGPORT,
        )
        try:
            cur = conn.cursor()
            cur.execute(sql)
            conn.commit()
            cur.close()
        finally:
            conn.close()

    print("Migración aplicada con éxito.")


if __name__ == "__main__":
    main()
