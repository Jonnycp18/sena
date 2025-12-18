@echo off
echo ======================================================================
echo   🗄️  CONFIGURACIÓN DE BASE DE DATOS POSTGRESQL
echo ======================================================================
echo.
echo Este script creará la base de datos y el usuario para el proyecto.
echo.
echo CREDENCIALES QUE SE CREARÁN:
echo   - Base de datos: gestion_academica
echo   - Usuario: admin_academico
echo   - Contraseña: admin123
echo.
echo ======================================================================
echo.

REM Verificar si psql está en el PATH
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: PostgreSQL no está instalado o no está en el PATH
    echo.
    echo Por favor instala PostgreSQL desde:
    echo   https://www.postgresql.org/download/windows/
    echo.
    echo Y asegúrate de agregar PostgreSQL al PATH
    pause
    exit /b 1
)

echo ✓ PostgreSQL encontrado
echo.

echo Ejecutando comandos SQL...
echo.

REM Crear archivo temporal con los comandos SQL
echo DO $$ > temp_setup.sql
echo BEGIN >> temp_setup.sql
echo     IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'admin_academico') THEN >> temp_setup.sql
echo         CREATE USER admin_academico WITH ENCRYPTED PASSWORD 'admin123'; >> temp_setup.sql
echo     END IF; >> temp_setup.sql
echo END >> temp_setup.sql
echo $$; >> temp_setup.sql
echo. >> temp_setup.sql
echo SELECT 'CREATE DATABASE gestion_academica' >> temp_setup.sql
echo WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'gestion_academica')\gexec >> temp_setup.sql
echo. >> temp_setup.sql
echo GRANT ALL PRIVILEGES ON DATABASE gestion_academica TO admin_academico; >> temp_setup.sql

REM Ejecutar el script
psql -U postgres -f temp_setup.sql

REM Configurar permisos en el schema
echo \c gestion_academica > temp_permisos.sql
echo GRANT ALL ON SCHEMA public TO admin_academico; >> temp_permisos.sql
echo ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO admin_academico; >> temp_permisos.sql
echo ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO admin_academico; >> temp_permisos.sql

psql -U postgres -f temp_permisos.sql

REM Limpiar archivos temporales
del temp_setup.sql
del temp_permisos.sql

echo.
echo ======================================================================
echo   ✅ BASE DE DATOS CONFIGURADA
echo ======================================================================
echo.
echo Puedes conectarte con:
echo   psql -U admin_academico -d gestion_academica -h localhost
echo   Contraseña: admin123
echo.
echo Próximos pasos:
echo   1. cd backend
echo   2. npm install
echo   3. npm run migrate
echo   4. npm run seed
echo   5. npm run dev
echo.
pause
