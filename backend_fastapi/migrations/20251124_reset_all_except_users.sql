-- Migration: limpiar todas las tablas excepto 'users'
-- Objetivo: dejar base vacía para pruebas conservando cuentas de usuario.
-- Ejecutar:
--   psql -d gestion_academica -f backend_fastapi/migrations/20251124_reset_all_except_users.sql
-- NOTA: Usa TRUNCATE ... CASCADE para respetar claves foráneas.

BEGIN;

TRUNCATE audit_logs RESTART IDENTITY CASCADE;
TRUNCATE calificaciones RESTART IDENTITY CASCADE;
-- evidencias_detalle no existe en este esquema (se omite para evitar error)
TRUNCATE evidencias RESTART IDENTITY CASCADE;
TRUNCATE estudiantes RESTART IDENTITY CASCADE;
TRUNCATE fichas RESTART IDENTITY CASCADE;
TRUNCATE materias RESTART IDENTITY CASCADE;
TRUNCATE notifications RESTART IDENTITY CASCADE;
-- users se conserva.

COMMIT;

-- Verificación posterior sugerida:
-- SELECT 'audit_logs', COUNT(*) FROM audit_logs UNION ALL
-- SELECT 'calificaciones', COUNT(*) FROM calificaciones UNION ALL
-- SELECT 'evidencias', COUNT(*) FROM evidencias UNION ALL
-- SELECT 'estudiantes', COUNT(*) FROM estudiantes UNION ALL
-- SELECT 'fichas', COUNT(*) FROM fichas UNION ALL
-- SELECT 'materias', COUNT(*) FROM materias UNION ALL
-- SELECT 'notifications', COUNT(*) FROM notifications UNION ALL
-- SELECT 'users (se mantiene)', COUNT(*) FROM users;