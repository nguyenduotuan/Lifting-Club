from datetime import datetime, timedelta, timezone

from app.auth.service import create_user
from app.database.database import SessionLocal


def add_user(username: str) -> None:
    with SessionLocal() as db:
        create_user(db, username, f"{username}123", username.title())


def future_event_date() -> str:
    return (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()


def test_public_event_is_discoverable_and_capacity_is_enforced(signed_in_client):
    response = signed_in_client.post(
        "/api/events",
        json={"title": "Saturday lift", "starts_at": future_event_date(), "is_public": True, "max_participants": 2},
    )
    assert response.status_code == 201
    event = response.json()
    event_id = event["id"]
    assert event["max_participants"] == 2
    assert [item["id"] for item in signed_in_client.get("/api/events/discover").json()] == [event_id]

    add_user("max")
    signed_in_client.post("/api/auth/login", json={"username": "max", "password": "max123"})
    joined = signed_in_client.post(f"/api/events/{event_id}/join")
    assert joined.status_code == 200
    assert sum(person["status"] == "accepted" for person in joined.json()["participants"]) == 2

    add_user("john")
    signed_in_client.post("/api/auth/login", json={"username": "john", "password": "john123"})
    assert signed_in_client.post(f"/api/events/{event_id}/join").status_code == 409


def test_private_event_is_hidden_from_non_invitees(signed_in_client):
    response = signed_in_client.post("/api/events", json={"title": "Private meetup", "starts_at": future_event_date()})
    assert response.status_code == 201
    event_id = response.json()["id"]
    assert response.json()["is_public"] is False
    assert response.json()["max_participants"] is None
    assert signed_in_client.get("/api/events/discover").json() == []

    add_user("max")
    signed_in_client.post("/api/auth/login", json={"username": "max", "password": "max123"})
    assert signed_in_client.get(f"/api/events/{event_id}").status_code == 404
    assert signed_in_client.post(f"/api/events/{event_id}/join").status_code == 404


def test_private_event_invitee_can_accept_without_public_listing(signed_in_client):
    add_user("max")
    response = signed_in_client.post(
        "/api/events",
        json={"title": "Invite-only session", "starts_at": future_event_date(), "invites": ["max"]},
    )
    assert response.status_code == 201
    event_id = response.json()["id"]
    assert signed_in_client.get("/api/events/discover").json() == []

    signed_in_client.post("/api/auth/login", json={"username": "max", "password": "max123"})
    assert signed_in_client.get(f"/api/events/{event_id}").status_code == 200
    accepted = signed_in_client.post(f"/api/events/{event_id}/respond", json={"action": "accept"})
    assert accepted.status_code == 200
    assert next(person for person in accepted.json()["participants"] if person["username"] == "max")["status"] == "accepted"


def test_event_end_must_follow_start(signed_in_client):
    starts_at = future_event_date()
    ends_at = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    response = signed_in_client.post(
        "/api/events",
        json={"title": "Invalid event", "starts_at": starts_at, "ends_at": ends_at},
    )
    assert response.status_code == 422