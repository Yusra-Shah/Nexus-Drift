from __future__ import annotations

import os
from datetime import datetime
from typing import Any

# Google ADK — imported for pattern compliance; pipeline is implemented as a sequential class
try:
    import google.genai.adk as _adk  # noqa: F401
except ImportError:
    pass

from connectors.github_connector import GithubConnector
from connectors.jira_connector import JiraConnector
from connectors.slack_connector import SlackConnector
from shared.models.agent_events import RawArtifactEvent
from shared.utils.logger import get_logger
from shared.utils.security import generate_trace_id
from state_manager import IngestionStateManager

logger = get_logger("nexusdrift-ingestion")


class IngestionPipeline:
    def __init__(self) -> None:
        self._github = GithubConnector()
        self._jira = JiraConnector()
        self._slack = SlackConnector()
        self._state = IngestionStateManager()
        self._publisher = self._make_publisher()
        self._topic_path = self._make_topic_path()

    def _make_publisher(self) -> Any:
        from google.cloud import pubsub_v1

        return pubsub_v1.PublisherClient()

    def _make_topic_path(self) -> str:
        from google.cloud import pubsub_v1

        project = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
        topic = os.environ.get("PUBSUB_TOPIC_RAW_ARTIFACTS", "nexusdrift-raw-artifacts")
        publisher = pubsub_v1.PublisherClient()
        return publisher.topic_path(project, topic)

    @property
    def topic_path(self) -> str:
        return self._topic_path

    async def run_cycle(self) -> dict[str, Any]:
        trace_id = generate_trace_id()
        started_at = datetime.utcnow()
        github_count = 0
        jira_count = 0
        slack_count = 0
        errors: list[str] = []

        github_repos = [r for r in os.environ.get("GITHUB_REPOS", "").split(",") if r.strip()]
        jira_keys = [k for k in os.environ.get("JIRA_PROJECT_KEYS", "").split(",") if k.strip()]
        slack_channels = [c for c in os.environ.get("SLACK_CHANNEL_IDS", "").split(",") if c.strip()]

        all_events: list[RawArtifactEvent] = []

        # Step 1: GitHub
        try:
            cursor = await self._state.get_cursor("github")
            events = await self._github.fetch_events(cursor, github_repos)
            all_events.extend(events)
            github_count = len(events)
            await self._state.update_cursor("github", datetime.utcnow())
        except Exception as exc:
            errors.append(f"github: {exc}")
            logger.warning("GitHub ingestion failed: %s", exc)

        # Step 2: Jira
        try:
            cursor = await self._state.get_cursor("jira")
            for key in jira_keys:
                events = await self._jira.fetch_issues(key, cursor)
                all_events.extend(events)
                jira_count += len(events)
            await self._state.update_cursor("jira", datetime.utcnow())
        except Exception as exc:
            errors.append(f"jira: {exc}")
            logger.warning("Jira ingestion failed: %s", exc)

        # Step 3: Slack
        try:
            cursor = await self._state.get_cursor("slack")
            events = await self._slack.fetch_messages(slack_channels, cursor)
            all_events.extend(events)
            slack_count = len(events)
            await self._state.update_cursor("slack", datetime.utcnow())
        except Exception as exc:
            errors.append(f"slack: {exc}")
            logger.warning("Slack ingestion failed: %s", exc)

        # Publish all events
        total_published = 0
        for event in all_events:
            try:
                data = event.model_dump_json().encode("utf-8")
                self._publisher.publish(self._topic_path, data)
                total_published += 1
            except Exception as exc:
                errors.append(f"publish: {exc}")

        completed_at = datetime.utcnow()
        self._write_execution_record(
            trace_id=trace_id,
            started_at=started_at,
            completed_at=completed_at,
            github_count=github_count,
            jira_count=jira_count,
            slack_count=slack_count,
            total_published=total_published,
            errors=errors,
        )

        return {
            "github_count": github_count,
            "jira_count": jira_count,
            "slack_count": slack_count,
            "total_published": total_published,
            "errors": errors,
        }

    def _write_execution_record(
        self,
        trace_id: str,
        started_at: datetime,
        completed_at: datetime,
        github_count: int,
        jira_count: int,
        slack_count: int,
        total_published: int,
        errors: list[str],
    ) -> None:
        try:
            from google.cloud import firestore

            project_id = os.environ.get(
                "FIRESTORE_PROJECT_ID",
                os.environ.get("GOOGLE_CLOUD_PROJECT", ""),
            )
            fs = firestore.Client(project=project_id)
            fs.collection("agent_state").document(f"nexusdrift-ingestion-{trace_id[:8]}").set(
                {
                    "agent_id": trace_id,
                    "agent_name": "nexusdrift-ingestion",
                    "execution_type": "polling_cycle",
                    "started_at": started_at.isoformat(),
                    "completed_at": completed_at.isoformat(),
                    "status": "error" if errors else "success",
                    "input_artifact_count": github_count + jira_count + slack_count,
                    "output_node_count": total_published,
                    "error_message": "; ".join(errors) if errors else None,
                    "trace_id": trace_id,
                }
            )
        except Exception as exc:
            logger.warning("Failed to write execution record: %s", exc)

    async def close(self) -> None:
        await self._github.close()
        await self._jira.close()
        await self._slack.close()
