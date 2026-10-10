from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.database.models import Goal, GoalMilestone, GoalUpdate, User
from app.goals.schemas import GoalCreate, GoalProgressUpdate, GoalRead, GoalUpdateCreate, GoalUpdateRead


router = APIRouter(prefix="/goals", tags=["goals"], dependencies=[Depends(get_current_user)])


def goal_query(user_id: int):
    return (
        select(Goal)
        .where(Goal.user_id == user_id)
        .options(selectinload(Goal.milestones), selectinload(Goal.updates))
        .order_by(Goal.status.asc(), Goal.created_at.desc())
    )


def get_owned_goal(db: Session, goal_id: int, user: User) -> Goal:
    goal = db.scalar(goal_query(user.id).where(Goal.id == goal_id))
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found.")
    return goal


@router.get("", response_model=list[GoalRead])
def list_goals(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> list[Goal]:
    return list(db.scalars(goal_query(user.id)).all())


@router.post("", response_model=GoalRead, status_code=status.HTTP_201_CREATED)
def create_goal(payload: GoalCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Goal:
    if payload.progress_enabled and payload.target_value is None:
        raise HTTPException(status_code=422, detail="A target is required when progress tracking is enabled.")
    if payload.target_value is not None and payload.current_value > payload.target_value:
        raise HTTPException(status_code=422, detail="Current progress cannot exceed the target.")
    goal = Goal(
        user_id=user.id,
        title=payload.title,
        description=payload.description or "",
        category=payload.category,
        deadline=payload.deadline,
        progress_enabled=payload.progress_enabled,
        current_value=payload.current_value,
        target_value=payload.target_value,
        unit=payload.unit,
        milestones=[GoalMilestone(title=item.title, position=index) for index, item in enumerate(payload.milestones)],
    )
    db.add(goal)
    db.commit()
    return get_owned_goal(db, goal.id, user)


@router.patch("/{goal_id}", response_model=GoalRead)
def update_goal(goal_id: int, payload: GoalProgressUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Goal:
    goal = get_owned_goal(db, goal_id, user)
    if goal.target_value is not None and payload.current_value > goal.target_value:
        raise HTTPException(status_code=422, detail="Current progress cannot exceed the target.")
    goal.current_value = payload.current_value
    if payload.status in {"active", "completed", "archived"}:
        goal.status = payload.status
    elif goal.target_value is not None and payload.current_value >= goal.target_value:
        goal.status = "completed"
    db.commit()
    return get_owned_goal(db, goal.id, user)


@router.patch("/{goal_id}/milestones/{milestone_id}", response_model=GoalRead)
def toggle_milestone(goal_id: int, milestone_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Goal:
    goal = get_owned_goal(db, goal_id, user)
    milestone = next((item for item in goal.milestones if item.id == milestone_id), None)
    if milestone is None:
        raise HTTPException(status_code=404, detail="Milestone not found.")
    milestone.completed = not milestone.completed
    db.commit()
    return get_owned_goal(db, goal.id, user)


@router.post("/{goal_id}/updates", response_model=GoalUpdateRead, status_code=status.HTTP_201_CREATED)
def add_goal_update(goal_id: int, payload: GoalUpdateCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> GoalUpdate:
    goal = get_owned_goal(db, goal_id, user)
    update = GoalUpdate(goal_id=goal.id, body=payload.body)
    db.add(update)
    db.commit()
    db.refresh(update)
    return update


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(goal_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> None:
    goal = get_owned_goal(db, goal_id, user)
    db.delete(goal)
    db.commit()
