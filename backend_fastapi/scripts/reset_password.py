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

ENV_PATH = BACKEND_ROOT / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=str(ENV_PATH))
else:
    print(f"[warn] .env not found at {ENV_PATH}. Using process environment only.")

from app.db import get_conn  # type: ignore
from app.security import hash_password  # type: ignore
from psycopg.rows import dict_row  # type: ignore


def main():
    parser = argparse.ArgumentParser(description="Reset a user's password to a new value (pbkdf2_sha256)")
    parser.add_argument("email", help="User email")
    parser.add_argument("new_password", help="New password")
    args = parser.parse_args()

    if not os.getenv("DB_PASSWORD"):
        print("[error] DB_PASSWORD is empty. Set it in backend_fastapi/.env before running this script.")
        sys.exit(10)

    try:
        with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT id FROM users WHERE email = %s", [args.email])
            row = cur.fetchone()
            if not row:
                print("User not found")
                sys.exit(2)
            uid = row["id"]
            new_hash = hash_password(args.new_password)
            cur.execute("UPDATE users SET password_hash = %s, updated_at = NOW() WHERE id = %s", [new_hash, uid])
            conn.commit()
            print(f"Password updated for {args.email} (user id {uid})")
    except Exception as e:
        print(f"[error] Database operation failed: {e}")
        sys.exit(11)


if __name__ == "__main__":
    main()
