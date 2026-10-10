from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.lifts.schemas import LiftRead
from app.users.schemas import UserRead


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=1000)


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    post_id: int
    user_id: int
    user: UserRead
    body: str
    created_at: datetime


class ReactionCreate(BaseModel):
    emoji: Literal["🔥", "💪", "❤️", "🙌", "😂"]


class ReactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    post_id: int
    user_id: int
    emoji: str
    created_at: datetime


class ReactionState(BaseModel):
    reactions: list[ReactionRead]


class ActivityCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    distance: float = Field(gt=0)
    distance_unit: Literal["km", "mi"] = "km"
    duration_seconds: int = Field(gt=0)


class ActivityRead(BaseModel):
    name: str
    distance: float
    distance_unit: Literal["km", "mi"]
    duration_seconds: int
    pace_seconds_per_unit: float


class PostMediaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    file_path: str
    media_type: str
    sort_order: int


class PostRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    user: UserRead
    caption: str
    created_at: datetime
    activity_name: str | None = None
    distance: float | None = None
    distance_unit: str | None = None
    duration_seconds: int | None = None
    pace_seconds_per_unit: float | None = None
    media: list[PostMediaRead]
    lifts: list[LiftRead]
    comments: list[CommentRead] = Field(default_factory=list)
    reactions: list[ReactionRead] = Field(default_factory=list)