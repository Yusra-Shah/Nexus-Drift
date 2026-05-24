from __future__ import annotations

import os
from datetime import datetime
from typing import Any

import httpx

from shared.models.agent_events import RawArtifactEvent
from shared.models.graph_nodes import ArtifactSource
from shared.utils.security import sanitize_artifact_content


class GithubConnector:
    def __init__(self) -> None:
        token = os.environ.get("GITHUB_TOKEN", "")
        self._client = httpx.AsyncClient(
            base_url="https://api.github.com",
            headers={
                "Authorization": f"Bearer {token}",
                "User-Agent": "nexusdrift/1.0",
                "Accept": "application/vnd.github+json",
            },
            timeout=30.0,
        )

    async def fetch_events(
        self, since: datetime, repos: list[str]
    ) -> list[RawArtifactEvent]:
        if not repos:
            return []

        events: list[RawArtifactEvent] = []
        since_iso = since.isoformat() + "Z"

        for repo in repos:
            repo = repo.strip()
            if not repo:
                continue
            try:
                resp = await self._client.get(
                    f"/repos/{repo}/events",
                    params={"per_page": 100, "since": since_iso},
                )
                resp.raise_for_status()
                for item in resp.json():
                    event = self._parse_event(item, repo)
                    if event:
                        events.append(event)
            except Exception:
                continue

        return events

    def _parse_event(self, item: dict[str, Any], repo: str) -> RawArtifactEvent | None:
        event_type = item.get("type", "")
        payload = item.get("payload", {})
        actor = item.get("actor", {}).get("login", "unknown")

        if event_type == "PushEvent":
            commits = payload.get("commits", [])
            results = []
            for commit in commits:
                sha = commit.get("sha", "")[:8]
                message = commit.get("message", "").split("\n")[0]
                content = sanitize_artifact_content(f"COMMIT {sha}: {message}")
                if not content:
                    continue
                results.append(
                    RawArtifactEvent(
                        source=ArtifactSource.github,
                        content=content,
                        metadata={
                            "repo": repo,
                            "sha": sha,
                            "author": commit.get("author", {}).get("name", actor),
                            "event_type": "PushEvent",
                            "artifact_type": "commit",
                        },
                    )
                )
            # Return the first commit event; we aggregate per push
            return results[0] if results else None

        elif event_type == "PullRequestEvent":
            pr = payload.get("pull_request", {})
            number = pr.get("number", 0)
            title = pr.get("title", "")
            body = pr.get("body") or ""
            state = pr.get("state", "open")
            action = payload.get("action", "")
            content = sanitize_artifact_content(f"PR {number}: {title}\n\n{body}")
            if not content:
                return None
            return RawArtifactEvent(
                source=ArtifactSource.github,
                content=content,
                metadata={
                    "repo": repo,
                    "pr_number": number,
                    "action": action,
                    "author": pr.get("user", {}).get("login", actor),
                    "state": state,
                    "url": pr.get("html_url", ""),
                    "event_type": "PullRequestEvent",
                    "artifact_type": "pr",
                },
            )

        elif event_type == "PullRequestReviewEvent":
            pr = payload.get("pull_request", {})
            review = payload.get("review", {})
            pr_number = pr.get("number", 0)
            body = review.get("body") or ""
            review_state = review.get("state", "")
            reviewer = item.get("actor", {}).get("login", "unknown")
            content = sanitize_artifact_content(
                f"PR REVIEW on #{pr_number}: {body}"
            )
            if not content:
                return None
            return RawArtifactEvent(
                source=ArtifactSource.github,
                content=content,
                metadata={
                    "repo": repo,
                    "pr_number": pr_number,
                    "reviewer": reviewer,
                    "review_state": review_state,
                    "event_type": "PullRequestReviewEvent",
                    "artifact_type": "pr",
                },
            )

        return None

    async def close(self) -> None:
        await self._client.aclose()
