from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from starlette.middleware.sessions import SessionMiddleware

from app.auth.router import router as auth_router
from app.challenges.router import router as challenges_router
from app.config.settings import settings
from app.database.database import Base, engine
from app.database.migrations import (
    migrate_challenge_visibility,
    migrate_lift_weights,
    migrate_post_activity,
    migrate_user_profile_image,
)
from app.database import models
from app.posts.router import router as posts_router
from app.goals.router import router as goals_router
from app.users.router import router as users_router


FRONTEND_DIR = Path(__file__).resolve().parents[2] / "frontend" / "dist"


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    migrate_lift_weights(engine)
    migrate_post_activity(engine)
    migrate_user_profile_image(engine)
    migrate_challenge_visibility(engine)
    yield


app = FastAPI(title="Gym Social API", lifespan=lifespan)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret,
    max_age=settings.session_max_age_seconds,
    same_site=settings.session_cookie_samesite,
    https_only=settings.session_cookie_secure,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(posts_router, prefix="/api")
app.include_router(goals_router, prefix="/api")
app.include_router(challenges_router, prefix="/api")
app.get("/api/health", tags=["health"])(lambda: {"status": "ok"})
app.mount("/uploads", StaticFiles(directory=settings.upload_dir, check_dir=False), name="uploads")


@app.get("/{full_path:path}", include_in_schema=False)
def serve_frontend(full_path: str) -> FileResponse:
    index_file = FRONTEND_DIR / "index.html"
    if not index_file.is_file():
        raise HTTPException(status_code=404, detail="Frontend build not found.")

    requested_file = (FRONTEND_DIR / full_path).resolve()
    try:
        requested_file.relative_to(FRONTEND_DIR.resolve())
    except ValueError:
        return FileResponse(index_file)

    return FileResponse(requested_file if requested_file.is_file() else index_file)