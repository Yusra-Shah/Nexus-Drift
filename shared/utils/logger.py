from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from typing import Any


class StructuredFormatter(logging.Formatter):
    def __init__(self, service_name: str) -> None:
        super().__init__()
        self._service_name = service_name

    def format(self, record: logging.LogRecord) -> str:
        entry: dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "service_name": self._service_name,
            "log_level": record.levelname,
            "message": record.getMessage(),
        }
        if hasattr(record, "agent_id"):
            entry["agent_id"] = record.agent_id
        if hasattr(record, "trace_id"):
            entry["trace_id"] = record.trace_id
        if record.exc_info:
            entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(entry)


def get_logger(name: str | None = None) -> logging.Logger:
    service_name = os.environ.get("SERVICE_NAME", name or "nexusdrift")
    log_level = os.environ.get("LOG_LEVEL", "INFO").upper()

    logger = logging.getLogger(service_name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(StructuredFormatter(service_name))
        logger.addHandler(handler)
        logger.setLevel(getattr(logging, log_level, logging.INFO))
        logger.propagate = False
    return logger
