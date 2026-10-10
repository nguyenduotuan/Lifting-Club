from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.auth.dependencies import get_current_user
from app.challenges.schemas import (
    ChallengeCreate,
    ChallengeInvite,
    ChallengeProgressUpdate,
    ChallengeRead,
    ChallengeRespond,
    ParticipantRead,
)
from app.database.database import get_db
from app.database.models import Challenge, ChallengeParticipant, User


router = APIRouter(prefix="/challenges", tags=["challenges"], dependencies=[Depends(get_current_user)])


def challenge_query():
    return (
        select(Challenge)
        .options(
            selectinload(Challenge.host),
            selectinload(Challenge.participants).selectinload(ChallengeParticipant.user),
        )
        .order_by(Challenge.created_at.desc())
    )


def get_accessible_challenge(db: Session, challenge_id: int, user: User) -> Challenge:
    challenge = db.scalar(challenge_query().where(Challenge.id == challenge_id))
    if challenge is None:
        raise HTTPException(status_code=404, detail="Challenge not found.")
    if challenge.host_id != user.id and all(p.user_id != user.id for p in challenge.participants):
        raise HTTPException(status_code=404, detail="Challenge not found.")
    return challenge


def get_participant(challenge: Challenge, user: User) -> ChallengeParticipant | None:
    return next((p for p in challenge.participants if p.user_id == user.id), None)


def resolve_usernames(db: Session, usernames: list[str]) -> list[User]:
    unique = list(dict.fromkeys(usernames))
    users = list(db.scalars(select(User).where(User.username.in_(unique))).all()) if unique else []
    found = {u.username for u in users}
    missing = [name for name in unique if name not in found]
    if missing:
        raise HTTPException(status_code=422, detail=f"Unknown username: {', '.join(missing)}")
    return users


def serialize(challenge: Challenge) -> ChallengeRead:
    return ChallengeRead(
        id=challenge.id,
        host_id=challenge.host_id,
        host_username=challenge.host.username,
        host_display_name=challenge.host.display_name,
        title=challenge.title,
        description=challenge.description,
        target_value=challenge.target_value,
        unit=challenge.unit,
        deadline=challenge.deadline,
        created_at=challenge.created_at,
        participants=[
            ParticipantRead(
                id=p.id,
                user_id=p.user_id,
                username=p.user.username,
                display_name=p.user.display_name,
                profile_image=p.user.profile_image,
                status=p.status,
                current_value=p.current_value,
            )
            for p in challenge.participants
        ],
    )


@router.get("", response_model=list[ChallengeRead])
def list_challenges(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> list[ChallengeRead]:
    challenges = db.scalars(
        challenge_query().where(
            or_(
                Challenge.host_id == user.id,
                Challenge.participants.any(ChallengeParticipant.user_id == user.id),
            )
        )
    ).all()
    return [serialize(challenge) for challenge in challenges]


@router.post("", response_model=ChallengeRead, status_code=status.HTTP_201_CREATED)
def create_challenge(payload: ChallengeCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ChallengeRead:
    challenge = Challenge(
        host_id=user.id,
        title=payload.title,
        description=payload.description or "",
        target_value=payload.target_value,
        unit=payload.unit,
        deadline=payload.deadline,
        participants=[ChallengeParticipant(user_id=user.id, status="accepted")],
    )
    for invitee in resolve_usernames(db, payload.invites):
        if invitee.id != user.id:
            challenge.participants.append(ChallengeParticipant(user_id=invitee.id, status="invited"))
    db.add(challenge)
    db.commit()
    return serialize(get_accessible_challenge(db, challenge.id, user))


@router.get("/{challenge_id}", response_model=ChallengeRead)
def get_challenge(challenge_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ChallengeRead:
    return serialize(get_accessible_challenge(db, challenge_id, user))


@router.post("/{challenge_id}/invite", response_model=ChallengeRead)
def invite_members(challenge_id: int, payload: ChallengeInvite, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ChallengeRead:
    challenge = get_accessible_challenge(db, challenge_id, user)
    if challenge.host_id != user.id:
        raise HTTPException(status_code=403, detail="Only the host can invite members.")
    existing_ids = {p.user_id for p in challenge.participants}
    for invitee in resolve_usernames(db, payload.usernames):
        if invitee.id not in existing_ids:
            challenge.participants.append(ChallengeParticipant(user_id=invitee.id, status="invited"))
    db.commit()
    return serialize(get_accessible_challenge(db, challenge_id, user))


@router.post("/{challenge_id}/respond", response_model=ChallengeRead)
def respond_to_invite(challenge_id: int, payload: ChallengeRespond, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ChallengeRead:
    challenge = get_accessible_challenge(db, challenge_id, user)
    participant = get_participant(challenge, user)
    if participant is None or participant.status != "invited":
        raise HTTPException(status_code=422, detail="There is no pending invite for you.")
    participant.status = "accepted" if payload.action == "accept" else "declined"
    db.commit()
    return serialize(get_accessible_challenge(db, challenge_id, user))


@router.patch("/{challenge_id}/progress", response_model=ChallengeRead)
def update_progress(challenge_id: int, payload: ChallengeProgressUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ChallengeRead:
    challenge = get_accessible_challenge(db, challenge_id, user)
    participant = get_participant(challenge, user)
    if participant is None or participant.status != "accepted":
        raise HTTPException(status_code=403, detail="Join the challenge before logging progress.")
    if challenge.target_value is not None and payload.current_value > challenge.target_value:
        raise HTTPException(status_code=422, detail="Progress cannot exceed the challenge target.")
    participant.current_value = payload.current_value
    db.commit()
    return serialize(get_accessible_challenge(db, challenge_id, user))


@router.delete("/{challenge_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_challenge(challenge_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> None:
    challenge = get_accessible_challenge(db, challenge_id, user)
    if challenge.host_id != user.id:
        raise HTTPException(status_code=403, detail="Only the host can delete this challenge.")
    db.delete(challenge)
    db.commit()
