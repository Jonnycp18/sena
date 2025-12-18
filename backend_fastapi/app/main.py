import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load .env from backend_fastapi/.env explicitly so it works regardless of CWD
APP_DIR = Path(__file__).resolve().parent
ENV_PATH = APP_DIR.parent / ".env"
load_dotenv(dotenv_path=str(ENV_PATH), override=True)

API_VERSION = os.getenv("API_VERSION", "v1")
APP_ENV = os.getenv("APP_ENV", "development")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
APP_NAME = os.getenv("APP_NAME", "Sistema de Gestión Académica API (FastAPI)")

app = FastAPI(
    title=APP_NAME,
    version=API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    swagger_ui_parameters={"persistAuthorization": True},
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
from .routers.health import router as health_router  # noqa: E402
from .routers.auth import router as auth_router  # noqa: E402
from .routers.db import router as db_router  # noqa: E402
from .routers.api_info import router as api_info_router  # noqa: E402
from .routers.users import router as users_router  # noqa: E402
from .routers.fichas import router as fichas_router  # noqa: E402
from .routers.materias import router as materias_router  # noqa: E402
from .routers.calificaciones import router as calificaciones_router  # noqa: E402
from .routers.evidencias import router as evidencias_router  # noqa: E402
from .routers.evidencias_single import router as evidencias_single_router  # noqa: E402
from .routers.evidencias_wide import router as evidencias_wide_router  # noqa: E402
from .routers.dashboard_admin import router as dashboard_admin_router  # noqa: E402
from .routers.dashboard_coordinador import router as dashboard_coordinador_router  # noqa: E402
from .routers.dashboard_docente import router as dashboard_docente_router  # noqa: E402
from .routers.evidencias_definiciones import router as evidencias_definiciones_router  # noqa: E402
from .routers.analytics import router as analytics_router  # noqa: E402
from .routers.notifications import router as notifications_router  # noqa: E402
from .routers.maintenance_emails import router as maintenance_emails_router  # noqa: E402

app.include_router(health_router)
# Routers already include their versioned prefixes; include as-is to avoid duplicating paths
app.include_router(auth_router)
app.include_router(db_router)
app.include_router(api_info_router)
app.include_router(users_router)
app.include_router(fichas_router)
app.include_router(materias_router)
app.include_router(calificaciones_router)
app.include_router(evidencias_router)
app.include_router(evidencias_single_router)
app.include_router(evidencias_wide_router)
app.include_router(dashboard_admin_router)
app.include_router(dashboard_coordinador_router)
app.include_router(dashboard_docente_router)
app.include_router(evidencias_definiciones_router)
app.include_router(analytics_router)
app.include_router(notifications_router)
app.include_router(maintenance_emails_router)


# Root info
@app.get("/")
def root_info():
    return {
        "name": APP_NAME,
        "version": API_VERSION,
        "status": "running",
        "endpoints": {
            "health": "/health",
            "auth": f"/api/{API_VERSION}/auth",
        },
        "environment": APP_ENV,
    }
