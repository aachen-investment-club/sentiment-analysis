"""FastAPI dependencies for authentication and shared logic."""
from typing import Any, Dict

from fastapi import Depends, HTTPException, Request


async def get_current_user(request: Request) -> Dict[str, Any]:
    """
    Require an authenticated session. Use as a dependency on routes that need login.
    Returns the session user dict from Cognito (e.g. email, sub, etc.); raises 401 if missing.
    """
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
