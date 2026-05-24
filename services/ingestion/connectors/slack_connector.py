from __future__ import annotations

import os
from datetime import datetime
from typing import Any

import httpx

from shared.models.agent_events import RawArtifactEvent
from shared.models.graph_nodes import ArtifactSource
from shared.utils.security import sanitize_artifact_content

_MIN_MESSAGE_LENGTH = 50


class SlackConnector:
    def __init__(self) -> None:
        token = os.environ.get("SLACK_BOT_TOKEN", "")
        self._client = httpx.AsyncClient(
            base_url="https://slack.com/api",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30.0,
        )

    async def fetch_messages(
        self, channel_ids: list[str], since: datetime
    ) -> list[RawArtifactEvent]:
        events: list[RawArtifactEvent] = []
        oldest = str(since.timestamp())

        for channel_id in channel_ids:
            channel_id = channel_id.strip()
            if not channel_id:
                continue
            try:
                messages = await self._fetch_channel_history(channel_id, oldest)
            except Exception:
                continue

            standalone = [m for m in messages if not m.get("thread_ts") or m.get("thread_ts") == m.get("ts")]
            thread_roots = {m["thread_ts"]: m for m in messages if m.get("reply_count", 0) > 0 and m.get("thread_ts") == m.get("ts")}

            processed_threads: set[str] = set()

            for msg in standalone:
                thread_ts = msg.get("thread_ts")
                ts = msg.get("ts", "")

                if thread_ts and thread_ts in thread_roots and thread_ts not in processed_threads:
                    processed_threads.add(thread_ts)
                    try:
                        replies = await self._fetch_thread_replies(channel_id, thread_ts, oldest)
                    except Exception:
                        replies = [msg]
                    all_msgs = replies
                    user_ids = {m.get("user", "") for m in all_msgs}
                    content_lines = [m.get("text", "") for m in all_msgs if m.get("text")]
                    combined = "\n".join(content_lines)
                    combined = sanitize_artifact_content(combined)
                    if len(combined) < _MIN_MESSAGE_LENGTH:
                        continue
                    events.append(
                        RawArtifactEvent(
                            source=ArtifactSource.slack,
                            content=combined,
                            metadata={
                                "channel_id": channel_id,
                                "thread_ts": thread_ts,
                                "user_count": len(user_ids),
                                "message_count": len(all_msgs),
                                "artifact_type": "thread",
                            },
                        )
                    )
                elif not thread_ts or thread_ts == ts:
                    text = msg.get("text", "")
                    text = sanitize_artifact_content(text)
                    if len(text) < _MIN_MESSAGE_LENGTH:
                        continue
                    if thread_ts in processed_threads:
                        continue
                    events.append(
                        RawArtifactEvent(
                            source=ArtifactSource.slack,
                            content=text,
                            metadata={
                                "channel_id": channel_id,
                                "thread_ts": ts,
                                "user_count": 1,
                                "message_count": 1,
                                "artifact_type": "thread",
                            },
                        )
                    )

        return events

    async def _fetch_channel_history(
        self, channel_id: str, oldest: str
    ) -> list[dict[str, Any]]:
        resp = await self._client.get(
            "/conversations.history",
            params={"channel": channel_id, "oldest": oldest, "limit": 100},
        )
        resp.raise_for_status()
        data = resp.json()
        if not data.get("ok"):
            return []
        return data.get("messages", [])

    async def _fetch_thread_replies(
        self, channel_id: str, thread_ts: str, oldest: str
    ) -> list[dict[str, Any]]:
        resp = await self._client.get(
            "/conversations.replies",
            params={"channel": channel_id, "ts": thread_ts, "oldest": oldest, "limit": 100},
        )
        resp.raise_for_status()
        data = resp.json()
        if not data.get("ok"):
            return []
        return data.get("messages", [])

    async def close(self) -> None:
        await self._client.aclose()
