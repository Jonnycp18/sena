-- Migration: eliminar columna letra de calificaciones si existe
-- Ejecutar: psql -d gestion_academica -f backend_fastapi/migrations/20251122_drop_letra_calificaciones.sql

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='calificaciones' AND column_name='letra'
  ) THEN
    ALTER TABLE calificaciones DROP COLUMN letra;
  END IF;
END$$;

COMMIT;
