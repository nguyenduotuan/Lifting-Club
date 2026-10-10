from pathlib import Path
import os

from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "sqlite:///./gym_social.db"
    session_secret: str = "development-only-change-this-secret"
    session_max_age_seconds: int = 60 * 60 * 24 * 7
    session_cookie_secure: bool = False
    session_cookie_samesite: str = "lax"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    upload_dir: Path = Path(__file__).resolve().parents[2] / "uploads"
    max_upload_size_bytes: int = 25 * 1024 * 1024


settings = Settings()

if os.getenv("RENDER"):
    if settings.session_secret == "development-only-change-this-secret":
        raise RuntimeError("SESSION_SECRET must be set to a stable private value on Render.")
    if not settings.session_cookie_secure or settings.session_cookie_samesite.lower() != "none":
        raise RuntimeError("Render requires SESSION_COOKIE_SECURE=true and SESSION_COOKIE_SAMESITE=none.")