from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base
from app.lifts.constants import UINT32_MAX


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(80))
    profile_image: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    posts: Mapped[list["Post"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    comments: Mapped[list["Comment"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    reactions: Mapped[list["PostReaction"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    goals: Mapped[list["Goal"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    caption: Mapped[str] = mapped_column(Text, default="")
    activity_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    distance: Mapped[float | None] = mapped_column(Float, nullable=True)
    distance_unit: Mapped[str | None] = mapped_column(String(2), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pace_seconds_per_unit: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    user: Mapped[User] = relationship(back_populates="posts")
    media: Mapped[list["PostMedia"]] = relationship(
        back_populates="post", cascade="all, delete-orphan", order_by="PostMedia.sort_order"
    )
    lifts: Mapped[list["Lift"]] = relationship(back_populates="post", cascade="all, delete-orphan")
    comments: Mapped[list["Comment"]] = relationship(
        back_populates="post", cascade="all, delete-orphan", order_by="(Comment.created_at, Comment.id)"
    )
    reactions: Mapped[list["PostReaction"]] = relationship(back_populates="post", cascade="all, delete-orphan")


class PostMedia(Base):
    __tablename__ = "post_media"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), index=True)
    file_path: Mapped[str] = mapped_column(String(255))
    media_type: Mapped[str] = mapped_column(String(10))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    post: Mapped[Post] = relationship(back_populates="media")


class Lift(Base):
    __tablename__ = "lifts"
    __table_args__ = (
        CheckConstraint(f"weight >= 0 AND weight <= {UINT32_MAX}", name="ck_lifts_weight_uint32"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), index=True)
    exercise_name: Mapped[str] = mapped_column(String(100))
    weight: Mapped[int] = mapped_column(Integer)
    unit: Mapped[str] = mapped_column(String(2), default="kg")
    reps: Mapped[int] = mapped_column(Integer)
    post: Mapped[Post] = relationship(back_populates="lifts")


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    post: Mapped[Post] = relationship(back_populates="comments")
    user: Mapped[User] = relationship(back_populates="comments")


class PostReaction(Base):
    __tablename__ = "post_reactions"
    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_post_reactions_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    emoji: Mapped[str] = mapped_column(String(16))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    post: Mapped[Post] = relationship(back_populates="reactions")
    user: Mapped[User] = relationship(back_populates="reactions")


class Goal(Base):
    __tablename__ = "goals"
    __table_args__ = (
        CheckConstraint("target_value IS NULL OR target_value > 0", name="ck_goals_target_positive"),
        CheckConstraint("current_value >= 0", name="ck_goals_current_nonnegative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(140))
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(40), default="Personal")
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    progress_enabled: Mapped[bool] = mapped_column(default=False)
    current_value: Mapped[float] = mapped_column(Float, default=0)
    target_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit: Mapped[str | None] = mapped_column(String(30), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    user: Mapped[User] = relationship(back_populates="goals")
    milestones: Mapped[list["GoalMilestone"]] = relationship(
        back_populates="goal", cascade="all, delete-orphan", order_by="(GoalMilestone.position, GoalMilestone.id)"
    )
    updates: Mapped[list["GoalUpdate"]] = relationship(
        back_populates="goal", cascade="all, delete-orphan", order_by="(GoalUpdate.created_at, GoalUpdate.id)"
    )


class GoalMilestone(Base):
    __tablename__ = "goal_milestones"

    id: Mapped[int] = mapped_column(primary_key=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("goals.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(140))
    completed: Mapped[bool] = mapped_column(default=False)
    position: Mapped[int] = mapped_column(Integer, default=0)
    goal: Mapped[Goal] = relationship(back_populates="milestones")


class GoalUpdate(Base):
    __tablename__ = "goal_updates"

    id: Mapped[int] = mapped_column(primary_key=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("goals.id", ondelete="CASCADE"), index=True)
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    goal: Mapped[Goal] = relationship(back_populates="updates")


class Challenge(Base):
    __tablename__ = "challenges"
    __table_args__ = (
        CheckConstraint("target_value IS NULL OR target_value > 0", name="ck_challenges_target_positive"),
        CheckConstraint("max_participants IS NULL OR max_participants >= 2", name="ck_challenges_max_participants"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(140))
    description: Mapped[str] = mapped_column(Text, default="")
    target_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit: Mapped[str | None] = mapped_column(String(30), nullable=True)
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_public: Mapped[bool] = mapped_column(default=False)
    max_participants: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    host: Mapped[User] = relationship()
    participants: Mapped[list["ChallengeParticipant"]] = relationship(
        back_populates="challenge", cascade="all, delete-orphan", order_by="ChallengeParticipant.id"
    )


class ChallengeParticipant(Base):
    __tablename__ = "challenge_participants"
    __table_args__ = (
        UniqueConstraint("challenge_id", "user_id", name="uq_challenge_participants_user"),
        CheckConstraint("current_value >= 0", name="ck_challenge_participants_nonnegative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey("challenges.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="invited")
    current_value: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    challenge: Mapped[Challenge] = relationship(back_populates="participants")
    user: Mapped[User] = relationship()