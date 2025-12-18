@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo =============================================================================
echo   Exportar Base de Datos PostgreSQL (estructura, triggers, funciones y datos)
echo =============================================================================
echo.

REM Intentar leer variables desde backend_fastapi/.env
set ENV_FILE=backend_fastapi\.env
if exist "%ENV_FILE%" (
  for /f "usebackq tokens=1,* delims==" %%A in ("%ENV_FILE%") do (
    set name=%%A
    set value=%%B
    if /i "!name!"=="DB_HOST" set DB_HOST=!value!
    if /i "!name!"=="DB_PORT" set DB_PORT=!value!
    if /i "!name!"=="DB_NAME" set DB_NAME=!value!
    if /i "!name!"=="DB_USER" set DB_USER=!value!
    if /i "!name!"=="DB_PASSWORD" set DB_PASSWORD=!value!
  )
)

REM Solicitar datos si faltan
if "%DB_HOST%"=="" set /p DB_HOST=Host [localhost]: & if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set /p DB_PORT=Puerto [5432]: & if "%DB_PORT%"=="" set DB_PORT=5432
if "%DB_NAME%"=="" set /p DB_NAME=Base de datos [gestion_academica]: & if "%DB_NAME%"=="" set DB_NAME=gestion_academica
if "%DB_USER%"=="" set /p DB_USER=Usuario [admin_academico]: & if "%DB_USER%"=="" set DB_USER=admin_academico
if "%DB_PASSWORD%"=="" set /p DB_PASSWORD=Contraseña: 

set PGPASSWORD=%DB_PASSWORD%

where pg_dump >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ❌ No se encuentra pg_dump en el PATH. Instale PostgreSQL.
  exit /b 1
)
where pg_dumpall >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ❌ No se encuentra pg_dumpall en el PATH. Instale PostgreSQL.
  exit /b 1
)

if not exist database mkdir database
pushd database >nul

echo Generando dump de roles (globals)...
pg_dumpall -h %DB_HOST% -p %DB_PORT% -U %DB_USER% --globals-only > roles_dump.sql
if %ERRORLEVEL% NEQ 0 (
  echo ⚠️  No se pudieron exportar roles. Continuando sin roles.
  del roles_dump.sql 2>nul
)

echo Generando dump de esquema (estructura + funciones + triggers)...
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% ^
  --format=plain --no-owner --no-privileges --schema-only --create --clean --if-exists ^
  --quote-all-identifiers ^
  -f schema_dump.sql
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Fallo exportando el esquema.
  popd >nul & exit /b 1
)

echo Generando dump de datos (solo datos)...
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% ^
  --format=plain --no-owner --no-privileges --data-only ^
  -f data_dump.sql
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Fallo exportando datos.
  popd >nul & exit /b 1
)

echo Combinando en full_dump_produccion.sql ...
(
  if exist roles_dump.sql type roles_dump.sql
  echo.
  type schema_dump.sql
  echo.
  echo \connect "%DB_NAME%"
  type data_dump.sql
) > full_dump_produccion.sql

echo ✅ Exportación completa: database\full_dump_produccion.sql
popd >nul
set PGPASSWORD=
endlocal
