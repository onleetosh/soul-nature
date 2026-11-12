import os

os.environ["DATABASE_URL"] = "sqlite://"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import Session, SQLModel  # noqa: E402

import app.models  # noqa: E402,F401
from app.db.session import engine  # noqa: E402
from app.main import create_app  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_db():
    SQLModel.metadata.create_all(engine)
    yield
    SQLModel.metadata.drop_all(engine)


@pytest.fixture
def session():
    with Session(engine) as s:
        yield s


@pytest.fixture
def client():
    with TestClient(create_app()) as c:
        yield c


@pytest.fixture
def seeded(session):
    from app.seed import seed

    seed(session)
    return session
