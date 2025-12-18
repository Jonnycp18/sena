-- Truncate all public tables except 'users'. Restarts identities and cascades to dependents.
DO $$
DECLARE
  tbl_list text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO tbl_list
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT IN ('users');

  IF tbl_list IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || tbl_list || ' RESTART IDENTITY CASCADE';
  END IF;
END $$;
