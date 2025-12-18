-- Migration: asegurar que el constraint de letra permita 'A','D','-' y NULL
-- Ejecutar: psql -d gestion_academica -f backend_fastapi/migrations/20251121_alter_evidencias_letra.sql

BEGIN;

DO $$
DECLARE
    current_def text;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name='evidencias'
    ) THEN
        SELECT pg_get_constraintdef(c.oid)
          INTO current_def
          FROM pg_constraint c
          JOIN pg_class t ON c.conrelid = t.oid
         WHERE t.relname = 'evidencias'
           AND c.conname = 'evidencias_letra_check';

        -- Si existe y no contiene el simbolo '-', se reemplaza
        IF current_def IS NULL OR position('-' in current_def) = 0 THEN
            BEGIN
                ALTER TABLE evidencias DROP CONSTRAINT IF EXISTS evidencias_letra_check;
            EXCEPTION WHEN undefined_object THEN
                NULL; -- ignorar
            END;
            ALTER TABLE evidencias ADD CONSTRAINT evidencias_letra_check CHECK (letra IN ('A','D','-') OR letra IS NULL);
        END IF;
    END IF;
END$$;

COMMIT;
