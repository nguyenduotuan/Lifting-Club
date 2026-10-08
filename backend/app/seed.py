from app.auth.service import create_user
from app.database.database import Base, SessionLocal, engine
from app.database import models
from app.users.repository import UserRepository


DEVELOPMENT_USERS = [
    ("alex", "alex123", "Alex Morgan"),
    ("max", "max123", "Max Rivera"),
    ("john", "john123", "John Chen"),
]


def main() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        for username, password, display_name in DEVELOPMENT_USERS:
            if UserRepository.get_by_username(db, username) is None:
                create_user(db, username, password, display_name)
    print("Development users are ready: alex, max, john.")


if __name__ == "__main__":
    main()