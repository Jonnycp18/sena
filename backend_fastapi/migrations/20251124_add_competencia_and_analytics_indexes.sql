-- Migration: Add competencia column to materias and create analytics-related indexes
-- Date: 2025-11-24
-- Safe to run multiple times (IF NOT EXISTS usage where possible)

-- 1. Add competencia column (nullable, simple text classification for radar chart)
ALTER TABLE materias ADD COLUMN IF NOT EXISTS competencia TEXT;

-- 2. Indexes to speed up analytics aggregations
-- Evidencias detalle time-based filtering
DO $$
BEGIN
	-- Solo crear índices si la tabla existe (evita error "no existe la relación")
	IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='evidencias_detalle') THEN
		EXECUTE 'CREATE INDEX IF NOT EXISTS idx_evidencias_detalle_created_at ON evidencias_detalle(created_at)';
		EXECUTE 'CREATE INDEX IF NOT EXISTS idx_evidencias_detalle_letra ON evidencias_detalle(letra)';
		EXECUTE 'CREATE INDEX IF NOT EXISTS idx_evidencias_detalle_materia ON evidencias_detalle(materia_id)';
		EXECUTE 'CREATE INDEX IF NOT EXISTS idx_evidencias_detalle_ficha ON evidencias_detalle(ficha_id)';
		-- Opcional compuesto (comentado)
		-- EXECUTE 'CREATE INDEX IF NOT EXISTS idx_evidencias_detalle_ficha_materia ON evidencias_detalle(ficha_id, materia_id)';
	END IF;
END$$;
-- Definition active flag + name pairing for frequent joins
CREATE INDEX IF NOT EXISTS idx_evidencia_definicion_nombre_activa ON evidencia_definicion(nombre, activa);

-- Los índices de evidencias_detalle se crean condicionalmente arriba.

-- Verification queries (manual):
-- \d materias
-- \d evidencias_detalle
-- \d evidencia_definicion
