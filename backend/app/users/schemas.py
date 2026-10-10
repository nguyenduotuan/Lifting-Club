from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    display_name: str
    profile_image: str | None
    created_at: datetime


class UserProfile(UserRead):
    post_count: int


class UserUpdate(BaseModel):
    display_name: str = Field(min_length=1, max_length=80)