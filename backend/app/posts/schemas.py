from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.lifts.schemas import LiftRead
from app.users.schemas import UserRead


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
    media: list[PostMediaRead]
    lifts: list[LiftRead]