from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database.models import Post


def with_post_details(statement):
    return statement.options(
        selectinload(Post.user),
        selectinload(Post.media),
        selectinload(Post.lifts),
    )


class PostRepository:
    @staticmethod
    def list_recent(db: Session, limit: int = 50) -> list[Post]:
        statement = with_post_details(select(Post).order_by(Post.created_at.desc()).limit(limit))
        return list(db.scalars(statement).all())

    @staticmethod
    def get_by_id(db: Session, post_id: int) -> Post | None:
        statement = with_post_details(select(Post).where(Post.id == post_id))
        return db.scalar(statement)

    @staticmethod
    def list_for_username(db: Session, username: str) -> list[Post]:
        statement = (
            select(Post)
            .join(Post.user)
            .where(Post.user.has(username=username))
            .order_by(Post.created_at.desc())
        )
        return list(db.scalars(with_post_details(statement)).all())

    @staticmethod
    def create(db: Session, post: Post) -> Post:
        db.add(post)
        db.commit()
        db.refresh(post)
        return post

    @staticmethod
    def delete(db: Session, post: Post) -> None:
        db.delete(post)
        db.commit()