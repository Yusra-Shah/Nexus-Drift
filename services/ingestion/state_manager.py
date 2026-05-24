from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Any


class IngestionStateManager:
    def __init__(self) -> None:
        from google.cloud import firestore

        project_id = os.environ.get(
            "FIRESTORE_PROJECT_ID",
            os.environ.get("GOOGLE_CLOUD_PROJECT", ""),
        )
        self._fs = firestore.Client(project=project_id)

    async def get_cursor(self, source: str) -> datetime:
        try:
            doc = self._fs.collection("ingestion_cursors").document(source).get()
            if doc.exists:
                data: dict[str, Any] = doc.to_dict() or {}
                cursor = data.get("cursor_timestamp")
                if isinstance(cursor, datetime):
                    return cursor
                if isinstance(cursor, str):
                    return datetime.fromisoformat(cursor)
        except Exception:
            pass
        return datetime.utcnow() - timedelta(days=7)

    async def update_cursor(self, source: str, timestamp: datetime) -> None:
        try:
            self._fs.collection("ingestion_cursors").document(source).set(
                {"cursor_timestamp": timestamp.isoformat()}, merge=True
            )
        except Exception:
            pass
