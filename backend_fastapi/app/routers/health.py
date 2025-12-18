from fastapi import APIRouter
import time

router = APIRouter()

@router.get("/health")
def health():
    return {
        "status": "ok",
        "timestamp": time.time(),
        "uptime_hint": "FastAPI app responding",
    }
