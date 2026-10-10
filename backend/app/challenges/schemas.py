from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ChallengeCreate(BaseModel):
    title: str = Field(min_length=1, max_length=140)
    description: str = Field(default="", max_length=2000)
    target_value: float | None = Field(default=None, gt=0)
    unit: str | None = Field(default=None, max_length=30)
    deadline: datetime | None = None
    invites: list[str] = Field(default_factory=list, max_length=50)
    is_public: bool = False
    max_participants: int | None = Field(default=None, ge=2, le=500)

    @model_validator(mode="after")
    def validate_visibility(self) -> "ChallengeCreate":
        if self.is_public and self.max_participants is None:
            raise ValueError("Public challenges need a participant limit.")
        if not self.is_public and self.max_participants is not None:
            raise ValueError("Private challenges do not have a participant limit.")
        return self

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Title cannot be empty.")
        return value

    @field_validator("description", "unit")
    @classmethod
    def clean_optional_text(cls, value: str | None) -> str | None:
        return value.strip() if value else None

    @field_validator("invites")
    @classmethod
    def clean_invites(cls, value: list[str]) -> list[str]:
        return [username.strip() for username in value if username.strip()]


class ChallengeInvite(BaseModel):
    usernames: list[str] = Field(min_length=1, max_length=50)


class ChallengeRespond(BaseModel):
    action: str = Field(pattern="^(accept|decline)$")


class ChallengeProgressUpdate(BaseModel):
    current_value: float = Field(ge=0)


class ParticipantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    username: str
    display_name: str
    profile_image: str | None
    status: str
    current_value: float


class ChallengeRead(BaseModel):
    id: int
    host_id: int
    host_username: str
    host_display_name: str
    title: str
    description: str
    target_value: float | None
    unit: str | None
    deadline: datetime | None
    is_public: bool
    max_participants: int | None
    created_at: datetime
    participants: list[ParticipantRead]
