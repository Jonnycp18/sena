@echo off
echo ======================================================================
echo   🔧 ARREGLANDO PROYECTO - Limpieza y Reinstalación
echo ======================================================================
echo.

echo [1/5] Eliminando node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo ✓ node_modules eliminado
) else (
    echo ✓ node_modules no existe
)
echo.

echo [2/5] Eliminando package-lock.json...
if exist package-lock.json (
    del package-lock.json
    echo ✓ package-lock.json eliminado
) else (
    echo ✓ package-lock.json no existe
)
echo.

echo [3/5] Instalando dependencias del frontend...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error instalando dependencias del frontend
    pause
    exit /b 1
)
echo ✓ Dependencias del frontend instaladas
echo.

echo [4/5] Limpiando backend...
cd backend
if exist node_modules (
    rmdir /s /q node_modules
    echo ✓ Backend node_modules eliminado
)
if exist package-lock.json (
    del package-lock.json
    echo ✓ Backend package-lock.json eliminado
)
echo.

echo [5/5] Instalando dependencias del backend...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error instalando dependencias del backend
    cd ..
    pause
    exit /b 1
)
echo ✓ Dependencias del backend instaladas
cd ..
echo.

echo ======================================================================
echo   ✅ PROYECTO ARREGLADO
echo ======================================================================
echo.
echo Próximos pasos:
echo.
echo 1. Configurar PostgreSQL:
echo    SETUP_DB.bat
echo.
echo 2. Ejecutar migraciones:
echo    cd backend
echo    npm run migrate
echo    npm run seed
echo.
echo 3. Iniciar backend (Terminal 1):
echo    cd backend
echo    npm run dev
echo.
echo 4. Iniciar frontend (Terminal 2):
echo    npm run dev
echo.
pause
