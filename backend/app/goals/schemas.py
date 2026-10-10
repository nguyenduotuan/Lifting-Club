from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MilestoneCreate(BaseModel):
    title: str = Field(min_length=1, max_length=140)

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Milestone title cannot be empty.")
        return value


class MilestoneRead(MilestoneCreate):
    id: int
    completed: bool
    position: int


class GoalCreate(BaseModel):
    title: str = Field(min_length=1, max_length=140)
    description: str = Field(default="", max_length=2000)
    category: str = Field(default="Personal", min_length=1, max_length=40)
    deadline: datetime | None = None
    progress_enabled: bool = False
    current_value: float = Field(default=0, ge=0)
    target_value: float | None = Field(default=None, gt=0)
    unit: str | None = Field(default=None, max_length=30)
    milestones: list[MilestoneCreate] = Field(default_factory=list, max_length=20)

    @field_validator("title", "category")
    @classmethod
    def clean_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty.")
        return value

    @field_validator("description", "unit")
    @classmethod
    def clean_optional_text(cls, value: str | None) -> str | None:
        return value.strip() if value else None


class GoalProgressUpdate(BaseModel):
    current_value: float = Field(ge=0)
    status: str | None = None


class GoalUpdateCreate(BaseModel):
    body: str = Field(min_length=1, max_length=1000)

    @field_validator("body")
    @classmethod
    def clean_body(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Update cannot be empty.")
        return value


class GoalUpdateRead(GoalUpdateCreate):
    id: int
    created_at: datetime


class GoalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    description: str
    category: str
    deadline: datetime | None
    progress_enabled: bool
    current_value: float
    target_value: float | None
    unit: str | None
    status: str
    created_at: datetime
    milestones: list[MilestoneRead]
    updates: list[GoalUpdateRead]

