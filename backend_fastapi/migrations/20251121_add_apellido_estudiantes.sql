-- Migration: agregar columna apellido a estudiantes si no existe
-- Ejecutar: psql -d gestion_academica -f backend_fastapi/migrations/20251121_add_apellido_estudiantes.sql

BEGIN;

ALTER TABLE estudiantes
  ADD COLUMN IF NOT EXISTS apellido VARCHAR(255);

-- Opcional: si hay necesidad de derivar un valor inicial, podría hacerse aquí.
-- UPDATE estudiantes SET apellido = split_part(nombre,' ',2) WHERE apellido IS NULL; -- (ejemplo simplistic)

COMMIT;
