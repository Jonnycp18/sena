@echo off
setlocal ENABLEDELAYEDEXPANSION
REM Start FastAPI (Uvicorn) on Windows with auto port selection if 8000 is busy

REM Choose Python from venv if available
set "VENV_PY=%~dp0.venv\Scripts\python.exe"
if exist "%VENV_PY%" (
  echo Using venv: %VENV_PY%
  set "PY=%VENV_PY%"
) else (
  echo Using system Python on PATH
  set "PY=python"
)

REM Base directory
cd /d "%~dp0"

REM Default host/port (allow override via PORT env var)
if not defined PORT set PORT=8000
set HOST=127.0.0.1

REM Try to start Uvicorn, if it fails (e.g., port in use), increment port and retry up to 10 times
set MAX_TRIES=10
set TRIES=0

:TRY_START
set /a TRIES=TRIES+1
echo Starting FastAPI on http://%HOST%:%PORT% (attempt %TRIES%/%MAX_TRIES%)
"%PY%" -m uvicorn backend_fastapi.app.main:app --host %HOST% --port %PORT% --reload
if errorlevel 1 (
  if %TRIES% LSS %MAX_TRIES% (
    echo Start failed on port %PORT%. Trying next port...
    set /a PORT=PORT+1
    goto TRY_START
  ) else (
    echo Failed to start after %MAX_TRIES% attempts.
    exit /b 1
  )
)




