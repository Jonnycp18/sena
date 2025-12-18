-- Allow 'No entregó' in evidencias_detalle.estado check constraint
DO $$
BEGIN
    -- Drop existing check constraint on estado if present
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'evidencias_detalle'
          AND tc.constraint_type = 'CHECK'
          AND tc.constraint_name = 'evidencias_detalle_estado_check'
    ) THEN
        EXECUTE 'ALTER TABLE public.evidencias_detalle DROP CONSTRAINT evidencias_detalle_estado_check';
    END IF;

    -- Recreate check constraint to allow specific states including 'No entregó'
    ALTER TABLE public.evidencias_detalle
        ADD CONSTRAINT evidencias_detalle_estado_check
        CHECK (
            estado IS NULL OR estado IN (
                'Aprobado',
                'Reprobado',
                'Pendiente',
                'No entregó'
            )
        );
END $$;
