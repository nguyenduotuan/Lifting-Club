from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.database.models import Lift, Post, PostMedia, User
from app.lifts.schemas import LiftCreate
from app.media.service import StoredMedia, store_upload
from app.media.storage import delete_file
from app.posts.repository import PostRepository


async def create_post(
    db: Session,
    user: User,
    caption: str,
    lifts: list[LiftCreate],
    uploads: list[UploadFile],
) -> Post:
    if not lifts:
        raise HTTPException(status_code=422, detail="Add at least one lift to the post.")
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