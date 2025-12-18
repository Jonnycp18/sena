-- Migration: crear tabla evidencia_definicion para planificar y activar evidencias
-- Ejecutar: psql -d gestion_academica -f backend_fastapi/migrations/20251124_evidencia_definicion.sql

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name='evidencia_definicion'
  ) THEN
    CREATE TABLE evidencia_definicion (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      ficha_id INT NOT NULL,
      materia_id INT NOT NULL,
      docente_id INT NULL,
      activa BOOLEAN NOT NULL DEFAULT FALSE,
      semana_activacion INT NULL CHECK (semana_activacion >= 1 AND semana_activacion <= 30),
      fecha_activacion DATE NULL,
      tipo TEXT NULL,
      peso NUMERIC(5,2) NULL,
      porcentaje NUMERIC(5,2) NULL,
      orden INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (materia_id, nombre),
      CONSTRAINT fk_ficha FOREIGN KEY (ficha_id) REFERENCES fichas(id) ON DELETE CASCADE,
      CONSTRAINT fk_materia FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
      CONSTRAINT fk_docente FOREIGN KEY (docente_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX idx_evidencia_definicion_materia_activa ON evidencia_definicion(materia_id, activa);
    CREATE INDEX idx_evidencia_definicion_docente ON evidencia_definicion(docente_id);

    COMMENT ON TABLE evidencia_definicion IS 'Definición, planificación y activación de evidencias por materia y ficha';
  END IF;
END$$;

COMMIT;
