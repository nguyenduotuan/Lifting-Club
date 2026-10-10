from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from pydantic import TypeAdapter, ValidationError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.database.models import User
from app.lifts.schemas import LiftCreate
from app.posts.repository import PostRepository
from app.posts.schemas import ActivityCreate, CommentCreate, CommentRead, PostRead, ReactionCreate, ReactionState
from app.posts.service import create_comment, create_post, delete_post, toggle_post_reaction


router = APIRouter(prefix="/posts", tags=["posts"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[PostRead])
def feed(db: Session = Depends(get_db)) -> list:
    return PostRepository.list_recent(db)


@router.get("/{post_id}", response_model=PostRead)
def post_detail(post_id: int, db: Session = Depends(get_db)):
    post = PostRepository.get_by_id(db, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found.")
    return post


@router.post("/{post_id}/comments", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
def comment_on_post(
    post_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return create_comment(db, post_id, user, payload.body)


@router.post("/{post_id}/reaction", response_model=ReactionState)
def react_to_post(
    post_id: int,
    payload: ReactionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ReactionState:
    return ReactionState(reactions=toggle_post_reaction(db, post_id, user, payload.emoji))


@router.post("", response_model=PostRead, status_code=status.HTTP_201_CREATED)
async def create(
    caption: Annotated[str, Form()] = "",
    lifts_json: Annotated[str, Form(alias="lifts")] = "[]",
    activity_json: Annotated[str, Form(alias="activity")] = "",
    media: Annotated[list[UploadFile], File()] = [],
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        lifts = TypeAdapter(list[LiftCreate]).validate_json(lifts_json)
    except ValidationError as error:
        raise HTTPException(status_code=422, detail="Lift details are invalid.") from error
    try:
        activity = TypeAdapter(ActivityCreate).validate_json(activity_json) if activity_json else None
    except ValidationError as error:
        raise HTTPException(status_code=422, detail="Activity details are invalid.") from error
    return await create_post(db, user, caption, lifts, activity, media)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove(post_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Response:
    delete_post(db, post_id, user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)