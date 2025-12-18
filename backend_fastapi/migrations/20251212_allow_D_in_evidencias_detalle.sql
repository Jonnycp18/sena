-- Allow 'D' letter in evidencias_detalle.letra
-- Safely drop existing check constraint if present and add a new one.
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.evidencias_detalle'::regclass
      AND contype = 'c'
      AND conname ILIKE '%letra%check%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.evidencias_detalle DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

-- Add a permissive check constraint for letra
ALTER TABLE public.evidencias_detalle
    ADD CONSTRAINT evidencias_detalle_letra_check
    CHECK (letra IS NULL OR letra IN ('A','D','F','-'));
