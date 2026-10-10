from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.database.models import User
from app.posts.repository import PostRepository
from app.posts.schemas import PostRead
from app.users.schemas import UserProfile, UserRead, UserUpdate
from app.users.repository import UserRepository
from app.users.service import get_profile, update_display_name, update_profile_image


router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[UserRead])
def users(db: Session = Depends(get_db)) -> list[User]:
    return UserRepository.list_all(db)


@router.patch("/me", response_model=UserRead)
def update_current_user(payload: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    return update_display_name(db, user, payload.display_name)


@router.patch("/me/profile-image", response_model=UserRead)
async def update_current_user_profile_image(
    image: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    return await update_profile_image(db, user, image)


@router.get("/{username}", response_model=UserProfile)
def profile(username: str, db: Session = Depends(get_db)) -> UserProfile:
    return get_profile(db, username.strip().lower())


@router.get("/{username}/posts", response_model=list[PostRead])
def user_posts(username: str, db: Session = Depends(get_db)) -> list:
    return PostRepository.list_for_username(db, username.strip().lower())