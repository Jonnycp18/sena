-- Migration: reset parcial de datos de carga (estudiantes/evidencias)
-- Uso: limpiar tablas de ingestión para pruebas dejando usuarios intactos.
-- Ejecutar:
--   psql -d gestion_academica -f backend_fastapi/migrations/20251124_reset_carga.sql

BEGIN;

-- Orden: primero detalle, luego evidencias, luego estudiantes.
-- RESTART IDENTITY reinicia secuencias; CASCADE garantiza limpieza de FKs relacionadas.
TRUNCATE evidencias_detalle RESTART IDENTITY CASCADE;
TRUNCATE evidencias RESTART IDENTITY CASCADE;
TRUNCATE estudiantes RESTART IDENTITY CASCADE;

COMMIT;

-- Verificación sugerida post-ejecución:
-- SELECT COUNT(*) FROM estudiantes;  -- debe ser 0
-- SELECT COUNT(*) FROM evidencias;    -- debe ser 0
-- SELECT COUNT(*) FROM evidencias_detalle; -- debe ser 0