from __future__ import annotations

import os
from typing import Any

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

_UNPROTECTED_PREFIXES = ("/api/health", "/api/webhooks")


def _is_unprotected(path: str) -> bool:
    return any(path.startswith(prefix) for prefix in _UNPROTECTED_PREFIXES)


class ClerkAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Any) -> Response:
        if _is_unprotected(request.url.path):
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={
                    "error_code": "MISSING_TOKEN",
                    "message": "Authorization header missing or malformed",
                    "trace_id": getattr(request.state, "trace_id", None),
                },
            )

        token = auth_header.removeprefix("Bearer ").strip()
        try:
            claims = await _verify_clerk_token(token)
            request.state.user_id = claims.get("sub")
            request.state.org_id = claims.get("org_id")
        except Exception:
            return JSONResponse(
                status_code=401,
                content={
                    "error_code": "INVALID_TOKEN",
                    "message": "Token verification failed",
                    "trace_id": getattr(request.state, "trace_id", None),
                },
            )

        return await call_next(request)


async def _verify_clerk_token(token: str) -> dict[str, Any]:
    from jose import jwt

    clerk_secret = os.environ.get("CLERK_SECRET_KEY", "")
    # Clerk JWTs are RS256; in production, fetch JWKS from Clerk's endpoint.
    # For local dev with a symmetric secret, use HS256 fallback.
    # This is intentionally minimal — swap for full JWKS verification in production.
    try:
        payload: dict[str, Any] = jwt.decode(token, clerk_secret, algorithms=["RS256", "HS256"])
    except Exception as exc:
        raise ValueError("Token decode failed") from exc
    return payload
