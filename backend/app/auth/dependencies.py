from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User
from app.users.repository import UserRepository


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    user_id = request.session.get("user_id")
    if not isinstance(user_id, int):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be logged in.",
        )

    user = UserRepository.get_by_id(db, user_id)
    if user is None:
        request.session.clear()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be logged in.",
        )
    return user