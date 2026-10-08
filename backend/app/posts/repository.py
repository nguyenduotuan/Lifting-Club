from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database.models import Comment, Post, PostReaction


def with_post_details(statement):
    return statement.options(
        selectinload(Post.user),
        selectinload(Post.media),
        selectinload(Post.lifts),
        selectinload(Post.comments).selectinload(Comment.user),
        selectinload(Post.reactions),
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
    def create_comment(db: Session, comment: Comment) -> Comment:
        db.add(comment)
        db.commit()
        db.refresh(comment)
        return comment

    @staticmethod
    def get_reaction(db: Session, post_id: int, user_id: int) -> PostReaction | None:
        statement = select(PostReaction).where(
            PostReaction.post_id == post_id,
            PostReaction.user_id == user_id,
        )
        return db.scalar(statement)

    @staticmethod
    def list_reactions(db: Session, post_id: int) -> list[PostReaction]:
        statement = select(PostReaction).where(PostReaction.post_id == post_id).order_by(PostReaction.id)
        return list(db.scalars(statement).all())

    @staticmethod
    def delete(db: Session, post: Post) -> None:
        db.delete(post)
        db.commit()