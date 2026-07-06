from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter()


@router.get("/health")
def health():
    settings = get_settings()
    return {"status": "ok", "service": settings.service_name, "version": settings.service_version, "environment": settings.app_env}


@router.get("/ready")
def ready():
    settings = get_settings()
    return {"status": "ready", "checks": {"database": "local_memory", "redis": "skipped", "ai_provider": settings.ai_provider}}
