import os

os.environ["DATABASE_URL"] = "sqlite://"

import pytest
from fastapi.testclient import TestClient

from app.auth.service import create_user
from app.config.settings import settings
from app.database.database import Base, SessionLocal, engine
from app.database import models
from app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", tmp_path / "uploads")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def seeded_client(client):
    with SessionLocal() as db:
        create_user(db, "alex", "alex123", "Alex Morgan")
    return client


@pytest.fixture
def signed_in_client(seeded_client):
    client = seeded_client
    response = client.post("/api/auth/login", json={"username": "alex", "password": "alex123"})
    assert response.status_code == 200
    return client