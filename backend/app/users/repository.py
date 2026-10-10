from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import User


class UserRepository:
    @staticmethod
    def list_all(db: Session) -> list[User]:
        return list(db.scalars(select(User).order_by(User.username)).all())

    @staticmethod
    def get_by_username(db: Session, username: str) -> User | None:
        return db.scalar(select(User).where(User.username == username))

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> User | None:
        return db.get(User, user_id)

    @staticmethod
    def update_display_name(db: Session, user: User, display_name: str) -> User:
        user.display_name = display_name
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update_profile_image(db: Session, user: User, profile_image: str) -> User:
        user.profile_image = profile_image
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def create(db: Session, username: str, password_hash: str, display_name: str) -> User:
        user = User(username=username, password_hash=password_hash, display_name=display_name)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user