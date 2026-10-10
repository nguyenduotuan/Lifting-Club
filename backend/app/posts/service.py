from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.database.models import Comment, Lift, Post, PostMedia, PostReaction, User
from app.lifts.schemas import LiftCreate
from app.media.service import StoredMedia, store_upload
from app.media.storage import delete_file
from app.posts.repository import PostRepository
from app.posts.schemas import ActivityCreate


async def create_post(
    db: Session,
    user: User,
    caption: str,
    lifts: list[LiftCreate],
    activity: ActivityCreate | None,
    uploads: list[UploadFile],
) -> Post:
    if not lifts and activity is None and not caption.strip() and not uploads:
        raise HTTPException(status_code=422, detail="Add a caption, media, lift, or activity to the post.")
    if lifts and activity is not None:
        raise HTTPException(status_code=422, detail="Choose either lifts or an activity, not both.")
    if len(caption) > 2000:
        raise HTTPException(status_code=422, detail="Caption must be 2,000 characters or fewer.")
    if len(uploads) > 6:
        raise HTTPException(status_code=422, detail="A post can include up to 6 media files.")

    stored_media: list[StoredMedia] = []
    try:
        for upload in uploads:
            stored_media.append(await store_upload(upload))

        post = Post(
            user_id=user.id,
            caption=caption.strip(),
            activity_name=activity.name.strip() if activity else None,
            distance=activity.distance if activity else None,
            distance_unit=activity.distance_unit if activity else None,
            duration_seconds=activity.duration_seconds if activity else None,
            pace_seconds_per_unit=activity.duration_seconds / activity.distance if activity else None,
            lifts=[
                Lift(
                    exercise_name=lift.exercise_name,
                    weight=lift.weight,
                    unit=lift.unit,
                    reps=lift.reps,
                )
                for lift in lifts
            ],
            media=[
                PostMedia(file_path=media.file_path, media_type=media.media_type, sort_order=index)
                for index, media in enumerate(stored_media)
            ],
        )
        return PostRepository.create(db, post)
    except Exception:
        db.rollback()
        for media in stored_media:
            delete_file(settings.upload_dir, media.file_path)
        raise


def delete_post(db: Session, post_id: int, user: User) -> None:
    post = PostRepository.get_by_id(db, post_id)
    if post is None or post.user_id != user.id:
        raise HTTPException(status_code=404, detail="Post not found.")
    file_paths = [media.file_path for media in post.media]
    PostRepository.delete(db, post)
    for file_path in file_paths:
        delete_file(settings.upload_dir, file_path)


def create_comment(db: Session, post_id: int, user: User, body: str) -> Comment:
    normalized_body = body.strip()
    if not normalized_body:
        raise HTTPException(status_code=422, detail="Comment cannot be empty.")
    if PostRepository.get_by_id(db, post_id) is None:
        raise HTTPException(status_code=404, detail="Post not found.")
    return PostRepository.create_comment(
        db,
        Comment(post_id=post_id, user_id=user.id, body=normalized_body, user=user),
    )


def toggle_post_reaction(db: Session, post_id: int, user: User, emoji: str) -> list[PostReaction]:
    if PostRepository.get_by_id(db, post_id) is None:
        raise HTTPException(status_code=404, detail="Post not found.")

    reaction = PostRepository.get_reaction(db, post_id, user.id)
    if reaction is not None and reaction.emoji == emoji:
        db.delete(reaction)
    elif reaction is not None:
        reaction.emoji = emoji
    else:
        db.add(PostReaction(post_id=post_id, user_id=user.id, emoji=emoji))
    db.commit()
    return PostRepository.list_reactions(db, post_id)