from fastapi import HTTPException
from pwdlib import PasswordHash
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.models import User
from app.users.repository import UserRepository


password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def authenticate(db: Session, username: str, password: str) -> User | None:
    user = UserRepository.get_by_username(db, username.strip().lower())
    if user is None or not password_hash.verify(password, user.password_hash):
        return None
    return user


def create_user(db: Session, username: str, password: str, display_name: str) -> User:
    return UserRepository.create(db, username.strip().lower(), hash_password(password), display_name)


def register_user(db: Session, username: str, password: str, display_name: str) -> User:
    normalized_username = username.strip().lower()
    if UserRepository.get_by_username(db, normalized_username) is not None:
        raise HTTPException(status_code=409, detail="That username is already taken.")

    try:
        return create_user(db, normalized_username, password, display_name.strip())
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="That username is already taken.") from error