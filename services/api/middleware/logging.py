from __future__ import annotations

import time
from typing import Any

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from shared.utils.logger import get_logger
from shared.utils.security import generate_trace_id

logger = get_logger("nexusdrift-api")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Any) -> Response:
        trace_id = request.headers.get("X-Request-ID") or generate_trace_id()
        request.state.trace_id = trace_id

        started = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - started) * 1000, 2)

        user_id = getattr(request.state, "user_id", None)
        extra: dict[str, Any] = {"trace_id": trace_id}
        if user_id:
            extra["agent_id"] = user_id

        record = logger.makeRecord(
            logger.name,
            20,  # INFO
            "(middleware)",
            0,
            "%s %s %s %.2fms",
            (request.method, request.url.path, response.status_code, duration_ms),
            None,
        )
        for k, v in extra.items():
            setattr(record, k, v)
        logger.handle(record)

        response.headers["X-Request-ID"] = trace_id
        return response
