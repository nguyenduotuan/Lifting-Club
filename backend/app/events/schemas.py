from datetime import datetime

from pydantic import AwareDatetime, BaseModel, Field, field_validator, model_validator


class EventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=140)
    description: str = Field(default="", max_length=2000)
    location: str | None = Field(default=None, max_length=200)
    starts_at: AwareDatetime
    ends_at: AwareDatetime | None = None
    invites: list[str] = Field(default_factory=list, max_length=50)
    is_public: bool = False
    max_participants: int | None = Field(default=None, ge=2, le=500)

    @model_validator(mode="after")
    def validate_event(self) -> "EventCreate":
        if self.ends_at is not None and self.ends_at < self.starts_at:
            raise ValueError("Event end must be after its start.")
        if self.is_public and self.max_participants is None:
            raise ValueError("Public events need a participant limit.")
        if not self.is_public and self.max_participants is not None:
            raise ValueError("Private events do not have a participant limit.")
        return self

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Title cannot be empty.")
        return value

    @field_validator("description", "location")
    @classmethod
    def clean_optional_text(cls, value: str | None) -> str | None:
        return value.strip() if value else None

    @field_validator("invites")
    @classmethod
    def clean_invites(cls, value: list[str]) -> list[str]:
        return [username.strip() for username in value if username.strip()]


class EventInvite(BaseModel):
    usernames: list[str] = Field(min_length=1, max_length=50)


class EventRespond(BaseModel):
    action: str = Field(pattern="^(accept|decline)$")


class EventParticipantRead(BaseModel):
    id: int
    user_id: int
    username: str
    display_name: str
    profile_image: str | None
    status: str


class EventRead(BaseModel):
    id: int
    host_id: int
    host_username: str
    host_display_name: str
    title: str
    description: str
    location: str | None
    starts_at: datetime
    ends_at: datetime | None
    is_public: bool
    max_participants: int | None
    created_at: datetime
    participants: list[EventParticipantRead]