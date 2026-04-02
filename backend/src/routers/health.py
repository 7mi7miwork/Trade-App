from fastapi import APIRouter
from src.config import get_settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """Return server status and configuration info."""
    settings = get_settings()
    return {
        "status": "ok",
        "shioaji_enabled": settings.shioaji_enabled,
        "timezone": settings.tz,
    }