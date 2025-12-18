#!/usr/bin/env bash
set -euo pipefail

echo "=============================================================================="
echo "  Exportar Base de Datos PostgreSQL (estructura, triggers, funciones y datos)"
echo "=============================================================================="
echo

# Intentar leer backend_fastapi/.env
ENV_FILE="backend_fastapi/.env"
if [[ -f "$ENV_FILE" ]]; then
  export $(grep -E '^(DB_HOST|DB_PORT|DB_NAME|DB_USER|DB_PASSWORD)=' "$ENV_FILE" | xargs -d '\n') || true
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-gestion_academica}
DB_USER=${DB_USER:-admin_academico}
DB_PASSWORD=${DB_PASSWORD:-}

read -r -p "Host [$DB_HOST]: " in_host || true; DB_HOST=${in_host:-$DB_HOST}
read -r -p "Puerto [$DB_PORT]: " in_port || true; DB_PORT=${in_port:-$DB_PORT}
read -r -p "Base de datos [$DB_NAME]: " in_db || true; DB_NAME=${in_db:-$DB_NAME}
read -r -p "Usuario [$DB_USER]: " in_user || true; DB_USER=${in_user:-$DB_USER}
if [[ -z "$DB_PASSWORD" ]]; then
  read -rs -p "Contraseña: " DB_PASSWORD; echo
fi

export PGPASSWORD="$DB_PASSWORD"

command -v pg_dump >/dev/null 2>&1 || { echo "❌ pg_dump no encontrado"; exit 1; }
command -v pg_dumpall >/dev/null 2>&1 || { echo "❌ pg_dumpall no encontrado"; exit 1; }

mkdir -p database
pushd database >/dev/null

echo "Generando dump de roles (globals)..."
if ! pg_dumpall -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" --globals-only > roles_dump.sql; then
  echo "⚠️  No se pudieron exportar roles. Continuando sin roles."
  rm -f roles_dump.sql
fi

echo "Generando dump de esquema (estructura + funciones + triggers)..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --format=plain --no-owner --no-privileges --schema-only --create --clean --if-exists \
  --quote-all-identifiers \
  -f schema_dump.sql

echo "Generando dump de datos (solo datos)..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --format=plain --no-owner --no-privileges --data-only \
  -f data_dump.sql

echo "Combinando en full_dump_produccion.sql ..."
{
  [[ -f roles_dump.sql ]] && cat roles_dump.sql
  echo
  cat schema_dump.sql
  echo
  echo "\\connect \"$DB_NAME\""
  cat data_dump.sql
} > full_dump_produccion.sql

echo "✅ Exportación completa: database/full_dump_produccion.sql"
popd >/dev/null
