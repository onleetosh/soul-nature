import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


os.environ["DATABASE_URL"] = "sqlite://"

from app.database import Base, get_session  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import seed_database  # noqa: E402


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch):
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    test_sessions = sessionmaker(
        bind=test_engine,
        autoflush=False,
        expire_on_commit=False,
    )
    Base.metadata.create_all(bind=test_engine)

    def override_session():
        with test_sessions() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    monkeypatch.setattr("app.database.engine", test_engine)
    monkeypatch.setattr("app.main.engine", test_engine)
    monkeypatch.setattr("app.seed.engine", test_engine)
    monkeypatch.setattr("app.seed.SessionLocal", test_sessions)

    seed_database()
    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    test_engine.dispose()
