from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.lifts.constants import UINT32_MAX


class LiftCreate(BaseModel):
    exercise_name: str = Field(min_length=1, max_length=100)
    weight: int = Field(strict=True, ge=0, le=UINT32_MAX)
    unit: Literal["kg", "lb"] = "kg"
    reps: int = Field(ge=1, le=1000)

    @field_validator("exercise_name")
    @classmethod
    def clean_exercise_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Exercise name cannot be empty.")
        return cleaned


class LiftRead(LiftCreate):
    id: int