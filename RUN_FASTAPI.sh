#!/usr/bin/env bash
set -euo pipefail

# Start FastAPI (Uvicorn) for this project on Unix-like systems
# Usage: ./RUN_FASTAPI.sh [port]
PORT=${1:-8000}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f .venv/Scripts/python.exe ]; then
  # Windows venv inside Git Bash
  PY="./.venv/Scripts/python.exe"
elif [ -f .venv/bin/python ]; then
  PY="./.venv/bin/python"
else
  PY="python"
fi

echo "Using interpreter: $PY"
$PY -m uvicorn backend_fastapi.app.main:app --host 127.0.0.1 --port "$PORT" --reload
