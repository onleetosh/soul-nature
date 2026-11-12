import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.admin_auth import require_admin


@pytest.fixture
def auth_client() -> TestClient:
    app = FastAPI()

    @app.get("/protected", dependencies=[Depends(require_admin)])
    def protected() -> dict[str, bool]:
        return {"authorized": True}

    return TestClient(app)


@pytest.mark.parametrize("configured", [None, "", "short", "a" * 31 + "é"])
def test_missing_or_invalid_configuration_fails_closed(
    auth_client: TestClient, monkeypatch: pytest.MonkeyPatch, configured: str | None
) -> None:
    if configured is None:
        monkeypatch.delenv("ADMIN_API_TOKEN", raising=False)
    else:
        monkeypatch.setenv("ADMIN_API_TOKEN", configured)
    assert auth_client.get("/protected").status_code == 503


@pytest.mark.parametrize("authorization", [None, "Bearer wrong", "Basic YTpi", "Bearer"])
def test_missing_or_invalid_credentials_are_rejected(
    auth_client: TestClient, monkeypatch: pytest.MonkeyPatch, authorization: str | None
) -> None:
    monkeypatch.setenv("ADMIN_API_TOKEN", "a" * 32)
    headers = {"Authorization": authorization} if authorization else {}
    response = auth_client.get("/protected", headers=headers)
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_valid_token_is_accepted(
    auth_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("ADMIN_API_TOKEN", "a" * 32)
    response = auth_client.get("/protected", headers={"Authorization": "Bearer " + "a" * 32})
    assert response.status_code == 200
    assert response.json() == {"authorized": True}
