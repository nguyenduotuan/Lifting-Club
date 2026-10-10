from app.auth.service import create_user
from app.database.database import SessionLocal


def add_user(username: str) -> None:
    with SessionLocal() as db:
        create_user(db, username, f"{username}123", username.title())


def test_public_challenge_is_discoverable_and_full_challenge_rejects_join(signed_in_client):
    challenge = signed_in_client.post(
        "/api/challenges",
        json={"title": "Row 10K", "is_public": True, "max_participants": 2},
    )
    assert challenge.status_code == 201
    challenge_data = challenge.json()
    challenge_id = challenge_data["id"]
    assert challenge_data["is_public"] is True
    assert challenge_data["max_participants"] == 2
    assert [item["id"] for item in signed_in_client.get("/api/challenges/discover").json()] == [challenge_id]
    assert signed_in_client.get(f"/api/challenges/{challenge_id}").status_code == 200

    add_user("max")
    signed_in_client.post("/api/auth/login", json={"username": "max", "password": "max123"})
    joined = signed_in_client.post(f"/api/challenges/{challenge_id}/join")
    assert joined.status_code == 200
    assert sum(person["status"] == "accepted" for person in joined.json()["participants"]) == 2

    add_user("john")
    signed_in_client.post("/api/auth/login", json={"username": "john", "password": "john123"})
    full = signed_in_client.post(f"/api/challenges/{challenge_id}/join")
    assert full.status_code == 409


def test_private_challenges_remain_invite_only_and_unlisted(signed_in_client):
    challenge = signed_in_client.post("/api/challenges", json={"title": "Private session"})
    assert challenge.status_code == 201
    challenge_id = challenge.json()["id"]
    assert challenge.json()["is_public"] is False
    assert challenge.json()["max_participants"] is None
    assert signed_in_client.get("/api/challenges/discover").json() == []

    add_user("max")
    signed_in_client.post("/api/auth/login", json={"username": "max", "password": "max123"})
    assert signed_in_client.get(f"/api/challenges/{challenge_id}").status_code == 404
    assert signed_in_client.post(f"/api/challenges/{challenge_id}/join").status_code == 404


def test_participant_can_leave_and_rejoin_public_challenge(signed_in_client):
    challenge = signed_in_client.post(
        "/api/challenges",
        json={"title": "Train together", "is_public": True, "max_participants": 3},
    ).json()
    challenge_id = challenge["id"]
    left = signed_in_client.delete(f"/api/challenges/{challenge_id}/join")
    assert left.status_code == 200
    assert next(person for person in left.json()["participants"] if person["user_id"] == 1)["status"] == "declined"
    rejoined = signed_in_client.post(f"/api/challenges/{challenge_id}/join")
    assert rejoined.status_code == 200
    assert next(person for person in rejoined.json()["participants"] if person["user_id"] == 1)["status"] == "accepted"