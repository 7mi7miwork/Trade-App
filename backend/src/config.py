from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Shioaji API credentials (optional)
    shioaji_api_key: str = ""
    shioaji_secret_key: str = ""

    # Backend server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # Timezone
    tz: str = "Asia/Taipei"

    @property
    def shioaji_enabled(self) -> bool:
        """Return True if Shioaji credentials are configured."""
        return bool(self.shioaji_api_key and self.shioaji_secret_key)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Cached singleton for settings to avoid reloading."""
    return Settings()