-- Migration: crear tabla evidencias_detalle y asegurar columna letra en calificaciones
-- Ejecutar: psql -d gestion_academica -f backend_fastapi/migrations/20251122_evidencias.sql

BEGIN;

-- Asegurar columna letra en calificaciones (por si migraciones previas no corrieron)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='calificaciones' AND column_name='letra'
  ) THEN
    ALTER TABLE calificaciones ADD COLUMN letra VARCHAR(2);
  END IF;
END$$;

-- Asegurar columna nota (por si se eliminó y se revirtió el requisito)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='calificaciones' AND column_name='nota'
  ) THEN
    ALTER TABLE calificaciones ADD COLUMN nota DECIMAL(4,2) CHECK (nota >= 0 AND nota <= 5);
  END IF;
END$$;

-- Crear tabla evidencias_detalle si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name='evidencias_detalle'
  ) THEN
    CREATE TABLE evidencias_detalle (
      id SERIAL PRIMARY KEY,
      materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
      ficha_id INTEGER NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
      estudiante_nombre VARCHAR(255) NOT NULL,
      estudiante_documento VARCHAR(50) NOT NULL,
      evidencia_nombre TEXT NOT NULL,
      trimestre INTEGER NOT NULL CHECK (trimestre BETWEEN 1 AND 4),
      nota DECIMAL(4,2) CHECK (nota >= 0 AND nota <= 5),
      letra VARCHAR(2), -- A/F opcional
      estado VARCHAR(20) DEFAULT 'Pendiente' CHECK (estado IN ('Aprobado','Reprobado','Pendiente','Cursando')),
      observaciones TEXT,
      fecha_carga DATE DEFAULT CURRENT_DATE,
      cargado_por INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Índices
    CREATE INDEX idx_evidencias_materia_id ON evidencias_detalle(materia_id);
    CREATE INDEX idx_evidencias_ficha_id ON evidencias_detalle(ficha_id);
    CREATE INDEX idx_evidencias_estudiante_doc ON evidencias_detalle(estudiante_documento);
    CREATE INDEX idx_evidencias_evidencia_nombre ON evidencias_detalle(evidencia_nombre);
    CREATE UNIQUE INDEX idx_evidencias_unique ON evidencias_detalle(materia_id, estudiante_documento, evidencia_nombre, trimestre);

    -- Trigger updated_at
    CREATE TRIGGER update_evidencias_detalle_updated_at
      BEFORE UPDATE ON evidencias_detalle
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- Función de estado derivado (nota o letra)
    CREATE OR REPLACE FUNCTION update_evidencia_estado()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    BEGIN
      IF NEW.letra IN ('A','F') THEN
        IF NEW.letra = 'A' THEN
          NEW.estado := 'Aprobado';
        ELSE
          NEW.estado := 'Reprobado';
        END IF;
      ELSIF NEW.nota IS NOT NULL THEN
        IF NEW.nota >= 3.0 THEN
          NEW.estado := 'Aprobado';
        ELSE
          NEW.estado := 'Reprobado';
        END IF;
      END IF;
      RETURN NEW;
    END$$;

    CREATE TRIGGER trg_evidencias_estado
      BEFORE INSERT OR UPDATE OF letra, nota ON evidencias_detalle
      FOR EACH ROW EXECUTE FUNCTION update_evidencia_estado();

    COMMENT ON TABLE evidencias_detalle IS 'Detalle de evidencias por estudiante y materia';
  END IF;
END$$;

COMMIT;
