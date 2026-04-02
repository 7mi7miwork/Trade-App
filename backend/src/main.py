import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from src.config import get_settings
from src.routers import health, analyze

# Create cache directory if it doesn't exist
cache_dir = Path(__file__).parent / "cache"
cache_dir.mkdir(exist_ok=True)

# Initialize FastAPI app
app = FastAPI(
    title="RoyaBot Web Edition",
    description="Taiwan Stock Market Analysis Tool with TA-Lib indicators",
    version="1.0.0",
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(analyze.router, prefix="/api", tags=["analyze"])


@app.on_event("startup")
async def startup_event():
    """Log configuration status on startup."""
    settings = get_settings()
    logger.info(f"RoyaBot Web Edition starting up")
    logger.info(f"Timezone: {settings.tz}")
    logger.info(f"Shioaji enabled: {settings.shioaji_enabled}")
    logger.info(f"Backend host: {settings.backend_host}:{settings.backend_port}")
    if not settings.shioaji_enabled:
        logger.warning("Shioaji credentials not configured. Shioaji data source will be disabled.")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("RoyaBot Web Edition shutting down")


@app.get("/")
async def root():
    """Root endpoint for basic health check."""
    return {"message": "RoyaBot Web Edition API is running"}