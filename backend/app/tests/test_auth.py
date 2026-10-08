from app.database.database import SessionLocal
from app.users.repository import UserRepository


def test_login_session_and_logout(seeded_client):
    client = seeded_client
    with client:
        response = client.post("/api/auth/login", json={"username": "alex", "password": "alex123"})
        assert response.status_code == 200
        assert response.json()["username"] == "alex"
        assert client.get("/api/auth/me").json()["display_name"] == "Alex Morgan"
        assert client.post("/api/auth/logout").status_code == 200
        assert client.get("/api/auth/me").status_code == 401


def test_login_rejects_incorrect_password(seeded_client):
    client = seeded_client
    response = client.post("/api/auth/login", json={"username": "alex", "password": "wrong"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password."


def test_protected_route_requires_login(client):
    assert client.get("/api/posts").status_code == 401


def test_registration_creates_hashed_user_and_session(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "  sam  ", "display_name": " Sam Lee ", "password": "strong-pass-1"},
    )
    assert response.status_code == 201
    assert response.json()["username"] == "sam"
    assert response.json()["display_name"] == "Sam Lee"
    assert "password_hash" not in response.json()
    assert client.get("/api/auth/me").json()["username"] == "sam"

    with SessionLocal() as db:
        user = UserRepository.get_by_username(db, "sam")
        assert user is not None
        assert user.password_hash != "strong-pass-1"
        assert user.password_hash.startswith("$argon2")


def test_registration_rejects_duplicate_username(seeded_client):
    response = seeded_client.post(
        "/api/auth/register",
        json={"username": "ALEX", "display_name": "Another Alex", "password": "strong-pass-1"},
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "That username is already taken."


def test_registration_validates_username_and_password(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "x", "display_name": "X", "password": "short"},
    )
    assert response.status_code == 422