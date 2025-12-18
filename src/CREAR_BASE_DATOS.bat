@echo off
chcp 65001 >nul
echo ============================================================================
echo   🗄️  CREACIÓN AUTOMÁTICA DE BASE DE DATOS POSTGRESQL
echo ============================================================================
echo.
echo Este script creará automáticamente:
echo   ✓ Base de datos: gestion_academica
echo   ✓ Usuario: admin_academico (contraseña: admin123)
echo   ✓ Todas las tablas necesarias
echo   ✓ Datos de prueba
echo.
echo ============================================================================
echo.

REM Verificar si psql está disponible
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: PostgreSQL no está instalado o no está en el PATH
    echo.
    echo Por favor instala PostgreSQL desde:
    echo   https://www.postgresql.org/download/windows/
    echo.
    echo Y asegúrate de agregar PostgreSQL al PATH del sistema
    pause
    exit /b 1
)

echo ✓ PostgreSQL encontrado
echo.

REM Solicitar contraseña de postgres
echo Por favor ingresa la contraseña del usuario 'postgres':
set /p POSTGRES_PASSWORD=Contraseña: 

echo.
echo ============================================================================
echo   PASO 1/3: Creando base de datos
echo ============================================================================
echo.

REM Crear la base de datos
set PGPASSWORD=%POSTGRES_PASSWORD%
psql -U postgres -c "CREATE DATABASE gestion_academica;" 2>nul

if %ERRORLEVEL% EQU 0 (
    echo ✓ Base de datos 'gestion_academica' creada exitosamente
) else (
    echo ⚠️  La base de datos ya existe o hubo un error
)

echo.
echo ============================================================================
echo   PASO 2/3: Ejecutando script de configuración completa
echo ============================================================================
echo.

REM Ejecutar el script SQL completo
psql -U postgres -d gestion_academica -f SETUP_DATABASE_COMPLETO.sql

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: Hubo un problema al ejecutar el script SQL
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo   PASO 3/3: Verificando instalación
echo ============================================================================
echo.

REM Verificar que las tablas se crearon
echo Verificando tablas creadas...
psql -U admin_academico -d gestion_academica -c "\dt" -P pager=off

echo.
echo Verificando usuarios creados...
psql -U admin_academico -d gestion_academica -c "SELECT email, nombre, apellido, rol FROM users;" -P pager=off

echo.
echo ============================================================================
echo   ✅ BASE DE DATOS CONFIGURADA EXITOSAMENTE
echo ============================================================================
echo.
echo CONEXIÓN:
echo   Host: localhost
echo   Puerto: 5432
echo   Base de datos: gestion_academica
echo   Usuario: admin_academico
echo   Contraseña: admin123
echo.
echo CREDENCIALES DE ACCESO AL SISTEMA:
echo   ✓ Administrador: admin@academia.com / Admin123!
echo   ✓ Coordinador:   coord1@academia.com / Admin123!
echo   ✓ Docente:       docente1@academia.com / Admin123!
echo.
echo PRÓXIMOS PASOS:
echo   1. cd backend
echo   2. npm install (si no lo has hecho)
echo   3. npm run dev
echo.
echo   En otra terminal:
echo   4. npm install (en la raíz del proyecto)
echo   5. npm run dev
echo.
echo   6. Abrir navegador en: http://localhost:5173
echo.
echo ============================================================================
echo.

REM Limpiar variable de contraseña
set PGPASSWORD=

pause
