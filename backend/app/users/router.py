from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.database.models import User
from app.posts.repository import PostRepository
from app.posts.schemas import PostRead
from app.users.schemas import UserProfile, UserRead
from app.users.repository import UserRepository
from app.users.service import get_profile


router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[UserRead])
def users(db: Session = Depends(get_db)) -> list[User]:
    return UserRepository.list_all(db)


@router.get("/{username}", response_model=UserProfile)
def profile(username: str, db: Session = Depends(get_db)) -> UserProfile:
    return get_profile(db, username.strip().lower())


@router.get("/{username}/posts", response_model=list[PostRead])
def user_posts(username: str, db: Session = Depends(get_db)) -> list:
    return PostRepository.list_for_username(db, username.strip().lower())