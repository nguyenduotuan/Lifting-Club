from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.auth.dependencies import get_current_user
from app.challenges.router import resolve_usernames
from app.database.database import get_db
from app.database.models import Event, EventParticipant, User
from app.events.schemas import EventCreate, EventInvite, EventParticipantRead, EventRead, EventRespond


router = APIRouter(prefix="/events", tags=["events"], dependencies=[Depends(get_current_user)])


def event_query():
    return (
        select(Event)
        .options(
            selectinload(Event.host),
            selectinload(Event.participants).selectinload(EventParticipant.user),
        )
        .order_by(Event.starts_at.asc(), Event.id.asc())
    )


def normalize_datetime(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def get_accessible_event(db: Session, event_id: int, user: User, lock: bool = False) -> Event:
    query = event_query().where(Event.id == event_id)
    if lock:
        query = query.with_for_update()
    event = db.scalar(query)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found.")
    if not event.is_public and event.host_id != user.id and all(person.user_id != user.id for person in event.participants):
        raise HTTPException(status_code=404, detail="Event not found.")
    return event


def serialize(event: Event) -> EventRead:
    return EventRead(
        id=event.id,
        host_id=event.host_id,
        host_username=event.host.username,
        host_display_name=event.host.display_name,
        title=event.title,
        description=event.description,
        location=event.location,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        is_public=event.is_public,
        max_participants=event.max_participants,
        created_at=event.created_at,
        participants=[
            EventParticipantRead(
                id=person.id,
                user_id=person.user_id,
                username=person.user.username,
                display_name=person.user.display_name,
                profile_image=person.user.profile_image,
                status=person.status,
            )
            for person in event.participants
        ],
    )


def pending_capacity(event: Event) -> int:
    return sum(person.status in {"accepted", "invited"} for person in event.participants)


def event_is_active(event: Event) -> bool:
    return normalize_datetime(event.ends_at or event.starts_at) >= datetime.now(timezone.utc)


@router.get("", response_model=list[EventRead])
def list_events(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> list[EventRead]:
    events = db.scalars(
        event_query().where(
            or_(
                Event.host_id == user.id,
                Event.participants.any(EventParticipant.user_id == user.id),
            )
        )
    ).all()
    return [serialize(event) for event in events]


@router.get("/discover", response_model=list[EventRead])
def discover_events(db: Session = Depends(get_db)) -> list[EventRead]:
    events = db.scalars(event_query().where(Event.is_public.is_(True))).all()
    return [serialize(event) for event in events if event_is_active(event)]


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> EventRead:
    event = Event(
        host_id=user.id,
        title=payload.title,
        description=payload.description or "",
        location=payload.location,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        is_public=payload.is_public,
        max_participants=payload.max_participants,
        participants=[EventParticipant(user_id=user.id, status="accepted")],
    )
    invitees = [person for person in resolve_usernames(db, payload.invites) if person.id != user.id]
    if event.is_public and 1 + len(invitees) > event.max_participants:
        raise HTTPException(status_code=409, detail="Invites would exceed the participant limit.")
    event.participants.extend(EventParticipant(user_id=person.id, status="invited") for person in invitees)
    db.add(event)
    db.commit()
    return serialize(get_accessible_event(db, event.id, user))


@router.get("/{event_id}", response_model=EventRead)
def get_event(event_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> EventRead:
    return serialize(get_accessible_event(db, event_id, user))


@router.post("/{event_id}/join", response_model=EventRead)
def join_event(event_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> EventRead:
    event = db.scalar(event_query().where(Event.id == event_id).with_for_update())
    if event is None or (not event.is_public and event.host_id != user.id):
        raise HTTPException(status_code=404, detail="Public event not found.")
    if not event_is_active(event):
        raise HTTPException(status_code=409, detail="This event has ended.")
    participant = next((person for person in event.participants if person.user_id == user.id), None)
    if participant is not None and participant.status == "accepted":
        return serialize(event)
    if event.max_participants is not None and pending_capacity(event) >= event.max_participants and (participant is None or participant.status != "invited"):
        raise HTTPException(status_code=409, detail="This event is full.")
    if participant is None:
        event.participants.append(EventParticipant(user_id=user.id, status="accepted"))
    else:
        participant.status = "accepted"
    db.commit()
    return serialize(get_accessible_event(db, event_id, user))


@router.delete("/{event_id}/join", response_model=EventRead)
def leave_event(event_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> EventRead:
    event = get_accessible_event(db, event_id, user, lock=True)
    participant = next((person for person in event.participants if person.user_id == user.id), None)
    if participant is None or participant.status != "accepted":
        raise HTTPException(status_code=409, detail="You are not attending this event.")
    participant.status = "declined"
    db.commit()
    return serialize(get_accessible_event(db, event_id, user))


@router.post("/{event_id}/invite", response_model=EventRead)
def invite_members(
    event_id: int,
    payload: EventInvite,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> EventRead:
    event = get_accessible_event(db, event_id, user, lock=True)
    if event.host_id != user.id:
        raise HTTPException(status_code=403, detail="Only the host can invite members.")
    existing_ids = {person.user_id for person in event.participants}
    invitees = [person for person in resolve_usernames(db, payload.usernames) if person.id not in existing_ids]
    if event.is_public and pending_capacity(event) + len(invitees) > event.max_participants:
        raise HTTPException(status_code=409, detail="Invites would exceed the participant limit.")
    event.participants.extend(EventParticipant(user_id=person.id, status="invited") for person in invitees)
    db.commit()
    return serialize(get_accessible_event(db, event_id, user))


@router.post("/{event_id}/respond", response_model=EventRead)
def respond_to_invite(
    event_id: int,
    payload: EventRespond,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> EventRead:
    event = get_accessible_event(db, event_id, user)
    participant = next((person for person in event.participants if person.user_id == user.id), None)
    if participant is None or participant.status != "invited":
        raise HTTPException(status_code=422, detail="There is no pending invite for you.")
    participant.status = "accepted" if payload.action == "accept" else "declined"
    db.commit()
    return serialize(get_accessible_event(db, event_id, user))


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> None:
    event = get_accessible_event(db, event_id, user)
    if event.host_id != user.id:
        raise HTTPException(status_code=403, detail="Only the host can delete this event.")
    db.delete(event)
    db.commit()