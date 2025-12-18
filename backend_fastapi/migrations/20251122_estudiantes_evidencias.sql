-- Migration: crear tablas estudiantes y evidencias (modelo simple wide upload)
-- Ejecutar: psql -d gestion_academica -f backend_fastapi/migrations/20251122_estudiantes_evidencias.sql

BEGIN;

-- Tabla estudiantes (documento PK)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name='estudiantes'
  ) THEN
    CREATE TABLE estudiantes (
      documento VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      correo VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER update_estudiantes_updated_at
      BEFORE UPDATE ON estudiantes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    COMMENT ON TABLE estudiantes IS 'Estudiantes cargados desde Excel wide';
  END IF;
END$$;

-- Tabla evidencias
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name='evidencias'
  ) THEN
    CREATE TABLE evidencias (
      id SERIAL PRIMARY KEY,
      documento VARCHAR(50) NOT NULL REFERENCES estudiantes(documento) ON DELETE CASCADE,
      evidencia_nombre TEXT NOT NULL,
      letra CHAR(1) CHECK (letra IN ('A','D','-') OR letra IS NULL),
      estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Aprobado','Reprobado','No entregó','Pendiente')),
      observaciones TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX idx_evidencias_documento_nombre ON evidencias(documento, evidencia_nombre);
    CREATE INDEX idx_evidencias_estado ON evidencias(estado);

    CREATE TRIGGER update_evidencias_updated_at_simple
      BEFORE UPDATE ON evidencias
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- Función derivar estado desde letra
    CREATE OR REPLACE FUNCTION derive_estado_evidencia(letra_in CHAR)
    RETURNS VARCHAR AS $$
    BEGIN
      IF letra_in IS NULL THEN
        RETURN 'Pendiente';
      ELSIF letra_in = 'A' THEN
        RETURN 'Aprobado';
      ELSIF letra_in = 'D' THEN
        RETURN 'Reprobado';
      ELSIF letra_in = '-' THEN
        RETURN 'No entregó';
      ELSE
        RETURN 'Pendiente';
      END IF;
    END;$$ LANGUAGE plpgsql;

    -- Trigger para ajustar estado antes de INSERT/UPDATE
    CREATE OR REPLACE FUNCTION trigger_set_estado_evidencias()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.estado := derive_estado_evidencia(NEW.letra);
      RETURN NEW;
    END;$$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_evidencias_set_estado
      BEFORE INSERT OR UPDATE OF letra ON evidencias
      FOR EACH ROW EXECUTE FUNCTION trigger_set_estado_evidencias();

    COMMENT ON TABLE evidencias IS 'Evidencias por estudiante derivadas de Excel wide';
  END IF;
END$$;

COMMIT;
