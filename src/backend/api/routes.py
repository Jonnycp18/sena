from fastapi import APIRouter
from .upload_evidencia_columna import router as evidencias_router

router = APIRouter()
router.include_router(evidencias_router, prefix="/evidencias", tags=["evidencias"])
