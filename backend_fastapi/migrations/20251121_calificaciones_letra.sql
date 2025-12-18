-- Migration: permitir solo letra A/F en calificaciones
-- Ejecutar en psql conectado a la base (gestion_academica)
-- psql -d gestion_academica -f backend_fastapi/migrations/20251121_calificaciones_letra.sql

BEGIN;

-- 1. Permitir nota NULL
ALTER TABLE calificaciones ALTER COLUMN nota DROP NOT NULL;

-- 2. Agregar columna letra (almacena 'A' o 'F') si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='calificaciones' AND column_name='letra'
  ) THEN
    ALTER TABLE calificaciones ADD COLUMN letra VARCHAR(2);
  END IF;
END$$;

-- 3. Llevar cualquier observación 'A'/'F' previa a columna letra (solo para filas sin letra)
UPDATE calificaciones SET letra = observaciones
WHERE letra IS NULL AND observaciones IN ('A','F');

-- 4. (Opcional) Limpiar nota si solo se quiere letra
UPDATE calificaciones SET nota = NULL;

COMMIT;
