import sys
from pathlib import Path
import argparse
from dotenv import load_dotenv
import os

# Ensure backend_fastapi is on sys.path
THIS_DIR = Path(__file__).resolve().parent
BACKEND_ROOT = THIS_DIR.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

# Load .env so DB_* variables are available when running standalone
ENV_PATH = BACKEND_ROOT / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=str(ENV_PATH))
else:
    print(f"[warn] .env not found at {ENV_PATH}. Using process environment only.")

from app.db import get_conn  # type: ignore
from app.security import verify_password, needs_rehash  # type: ignore
from psycopg.rows import dict_row  # type: ignore


def main():
    parser = argparse.ArgumentParser(description="Verify a user's password against DB hash")
    parser.add_argument("email", help="User email")
    parser.add_argument("password", help="Plain password to verify")
    args = parser.parse_args()

    # Basic sanity check to avoid confusing pool errors
    if not os.getenv("DB_PASSWORD"):
        print("[error] DB_PASSWORD is empty. Set it in backend_fastapi/.env before running this script.")
        sys.exit(10)

    try:
        with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT id, email, password_hash FROM users WHERE email = %s", [args.email])
            row = cur.fetchone()
    except Exception as e:
        print(f"[error] Database connection/query failed: {e}")
        sys.exit(11)

    if not row:
        print("User not found")
        sys.exit(2)

    ph = row.get("password_hash")
    if not ph:
        print("User has no password_hash")
        sys.exit(3)

    ok = verify_password(args.password, ph)
    print(f"verify_password: {ok}")
    print(f"needs_rehash: {needs_rehash(ph)}")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
