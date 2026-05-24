from __future__ import annotations

import base64
import os
from datetime import datetime
from typing import Any

import httpx

from shared.models.agent_events import RawArtifactEvent
from shared.models.graph_nodes import ArtifactSource
from shared.utils.security import sanitize_artifact_content


def _extract_adf_text(node: Any) -> str:
    """Recursively extract plain text from an Atlassian Document Format node."""
    if node is None:
        return ""
    if isinstance(node, str):
        return node
    if not isinstance(node, dict):
        return ""
    node_type = node.get("type", "")
    if node_type == "text":
        return node.get("text", "")
    text_parts: list[str] = []
    for child in node.get("content", []):
        part = _extract_adf_text(child)
        if part:
            text_parts.append(part)
    separator = "\n" if node_type in ("paragraph", "heading", "listItem", "bulletList", "orderedList") else " "
    return separator.join(text_parts)


class JiraConnector:
    def __init__(self) -> None:
        self._jira_url = os.environ.get("JIRA_URL", "").rstrip("/")
        email = os.environ.get("JIRA_EMAIL", "")
        token = os.environ.get("JIRA_API_TOKEN", "")
        creds = base64.b64encode(f"{email}:{token}".encode()).decode()
        self._client = httpx.AsyncClient(
            base_url=self._jira_url,
            headers={
                "Authorization": f"Basic {creds}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )

    async def fetch_issues(
        self, project_key: str, since: datetime
    ) -> list[RawArtifactEvent]:
        since_str = since.strftime("%Y-%m-%d")
        jql = f'project={project_key} AND updated >= "{since_str}" ORDER BY updated DESC'
        try:
            resp = await self._client.get(
                "/rest/api/3/search",
                params={
                    "jql": jql,
                    "fields": "summary,description,comment,status,assignee,priority",
                    "maxResults": 100,
                },
            )
            resp.raise_for_status()
            issues = resp.json().get("issues", [])
        except Exception:
            return []

        events: list[RawArtifactEvent] = []
        for issue in issues:
            fields = issue.get("fields", {})
            key = issue.get("key", "")
            summary = fields.get("summary", "")
            description_adf = fields.get("description")
            description_text = _extract_adf_text(description_adf) if description_adf else ""
            comments_data = fields.get("comment", {}).get("comments", [])
            latest_comments = comments_data[-3:] if len(comments_data) > 3 else comments_data
            comment_texts = []
            for c in latest_comments:
                body_adf = c.get("body")
                if body_adf:
                    comment_texts.append(_extract_adf_text(body_adf))
            comments_joined = "\n---\n".join(comment_texts)
            content_raw = (
                f"TICKET {key}: {summary}\n\n"
                f"Description: {description_text}\n\n"
                f"Comments: {comments_joined}"
            )
            content = sanitize_artifact_content(content_raw)
            if not content:
                continue
            status = fields.get("status", {}).get("name", "")
            assignee = (fields.get("assignee") or {}).get("displayName", "")
            priority = (fields.get("priority") or {}).get("name", "")
            events.append(
                RawArtifactEvent(
                    source=ArtifactSource.jira,
                    content=content,
                    metadata={
                        "issue_key": key,
                        "project": project_key,
                        "status": status,
                        "assignee": assignee,
                        "priority": priority,
                        "url": f"{self._jira_url}/browse/{key}",
                        "artifact_type": "ticket",
                    },
                )
            )
        return events

    async def close(self) -> None:
        await self._client.aclose()
