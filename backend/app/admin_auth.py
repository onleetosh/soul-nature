import os
import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


bearer = HTTPBearer(auto_error=False)


def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> None:
    token = os.getenv("ADMIN_API_TOKEN", "")
    if len(token) < 32 or not token.isascii():
        raise HTTPException(
            status_code=503, detail="Admin API authentication is not configured"
        )
    if credentials is None or not secrets.compare_digest(
        credentials.credentials.encode("utf-8"), token.encode("ascii")
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing admin credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
