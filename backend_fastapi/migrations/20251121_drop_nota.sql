-- Migration: eliminar columna nota y adaptar función estado a letra
-- Ejecutar con psql (asegúrate de tenerlo en PATH) o desde pgAdmin.
-- psql -d gestion_academica -f backend_fastapi/migrations/20251121_drop_nota.sql

BEGIN;

-- 1. Quitar trigger que dependía de nota
DROP TRIGGER IF EXISTS trg_calificaciones_estado ON calificaciones;
DROP FUNCTION IF EXISTS update_calificacion_estado();

-- 2. Agregar columna letra si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='calificaciones' AND column_name='letra'
  ) THEN
    ALTER TABLE calificaciones ADD COLUMN letra VARCHAR(2);
  END IF;
END$$;

-- 3. Migrar datos previos: si observaciones era 'A'/'F' pasarlos a letra
UPDATE calificaciones SET letra = observaciones WHERE observaciones IN ('A','F') AND (letra IS NULL OR letra='');

-- 4. Eliminar columna nota si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='calificaciones' AND column_name='nota'
  ) THEN
    ALTER TABLE calificaciones DROP COLUMN nota;
  END IF;
END$$;

-- 5. Nueva función de estado basada en letra
CREATE OR REPLACE FUNCTION update_calificacion_estado()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.letra IN ('A','F') THEN
    IF NEW.letra = 'A' THEN
      NEW.estado := 'Aprobado';
    ELSE
      NEW.estado := 'Reprobado';
    END IF;
  END IF;
  RETURN NEW;
END$$;

-- 6. Nuevo trigger
CREATE TRIGGER trg_calificaciones_letra_estado
BEFORE INSERT OR UPDATE OF letra ON calificaciones
FOR EACH ROW EXECUTE FUNCTION update_calificacion_estado();

COMMIT;
