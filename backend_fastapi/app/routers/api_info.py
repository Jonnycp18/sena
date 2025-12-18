from fastapi import APIRouter
import os

router = APIRouter()

API_VERSION = os.getenv("API_VERSION", "v1")


@router.get(f"/api/{API_VERSION}")
def api_root():
    return {
        "name": "Sistema de Gestión Académica API (FastAPI)",
        "version": API_VERSION,
        "status": "running",
        "endpoints": {
            "health": "/health",
            "auth_login": f"/api/{API_VERSION}/auth/login",
            "auth_me": f"/api/{API_VERSION}/auth/me",
            "db_ping": f"/api/{API_VERSION}/db/ping",
            "users_list": f"/api/{API_VERSION}/users",
            "user_detail": f"/api/{API_VERSION}/users/{{id}}",
            "fichas_list": f"/api/{API_VERSION}/fichas",
            "ficha_detail": f"/api/{API_VERSION}/fichas/{{id}}",
            "ficha_create": f"/api/{API_VERSION}/fichas",
            "ficha_update": f"/api/{API_VERSION}/fichas/{{id}}",
            "ficha_delete": f"/api/{API_VERSION}/fichas/{{id}}",
            "ficha_materias": f"/api/{API_VERSION}/fichas/{{id}}/materias",
            "ficha_estudiantes": f"/api/{API_VERSION}/fichas/{{id}}/estudiantes",
            "fichas_stats": f"/api/{API_VERSION}/fichas/stats",
            "materias_list": f"/api/{API_VERSION}/materias",
            "materia_detail": f"/api/{API_VERSION}/materias/{{id}}",
            "materia_create": f"/api/{API_VERSION}/materias",
            "materia_update": f"/api/{API_VERSION}/materias/{{id}}",
            "materia_delete": f"/api/{API_VERSION}/materias/{{id}}",
            "materia_calificaciones": f"/api/{API_VERSION}/materias/{{id}}/calificaciones",
            "materias_por_docente": f"/api/{API_VERSION}/materias/docente/{{docenteId}}",
            "materias_stats": f"/api/{API_VERSION}/materias/stats",
            "calificaciones_list": f"/api/{API_VERSION}/calificaciones",
            "calificacion_detail": f"/api/{API_VERSION}/calificaciones/{{id}}",
            "calificacion_create": f"/api/{API_VERSION}/calificaciones",
            "calificacion_update": f"/api/{API_VERSION}/calificaciones/{{id}}",
            "calificacion_delete": f"/api/{API_VERSION}/calificaciones/{{id}}",
            "calificaciones_por_materia": f"/api/{API_VERSION}/calificaciones/materia/{{materiaId}}",
            "calificaciones_por_estudiante": f"/api/{API_VERSION}/calificaciones/estudiante/{{documento}}",
            "calificaciones_upload": f"/api/{API_VERSION}/calificaciones/upload",
            "calificaciones_export": f"/api/{API_VERSION}/calificaciones/export",
        },
    }
