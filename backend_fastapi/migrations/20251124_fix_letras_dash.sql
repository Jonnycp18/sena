-- Migration: convertir letras '-' existentes a NULL y estado 'Pendiente'
-- Objetivo: legacy records creados antes del cambio de reglas.
-- Ejecución:
--   psql -d gestion_academica -f backend_fastapi/migrations/20251124_fix_letras_dash.sql

BEGIN;

UPDATE evidencias
SET letra = NULL,
    estado = 'Pendiente',
    updated_at = CURRENT_TIMESTAMP
WHERE letra = '-';

COMMIT;

-- Verificación sugerida:
-- SELECT letra, estado, COUNT(*) FROM evidencias GROUP BY letra, estado ORDER BY letra NULLS FIRST;