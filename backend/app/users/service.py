from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.media.service import store_profile_image
from app.media.storage import delete_file
from app.users.repository import UserRepository
from app.users.schemas import UserProfile, UserRead


def get_profile(db: Session, username: str) -> UserProfile:
    user = UserRepository.get_by_username(db, username)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    return UserProfile(**UserRead.model_validate(user).model_dump(), post_count=len(user.posts))


def update_display_name(db: Session, user, display_name: str):
    normalized_name = display_name.strip()
    if not normalized_name:
        raise HTTPException(status_code=422, detail="Display name cannot be empty.")
    return UserRepository.update_display_name(db, user, normalized_name)


async def update_profile_image(db: Session, user, upload: UploadFile):
    stored_image = await store_profile_image(upload)
    previous_image = user.profile_image
    updated_user = UserRepository.update_profile_image(db, user, stored_image.file_path)
    if previous_image:
        delete_file(settings.upload_dir, previous_image)
    return updated_user