from __future__ import annotations

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from shared.models.agent_events import RawArtifactEvent
from shared.models.graph_nodes import ArtifactSource


def _make_event(source: ArtifactSource = ArtifactSource.github) -> RawArtifactEvent:
    return RawArtifactEvent(
        source=source,
        content="This is a meaningful artifact content string for testing.",
        metadata={"artifact_type": "commit"},
    )


class MockPubSubPublisher:
    def __init__(self) -> None:
        self.published: list[bytes] = []

    def publish(self, topic: str, data: bytes) -> MagicMock:
        self.published.append(data)
        future = MagicMock()
        future.result.return_value = "msg-id"
        return future


@pytest.mark.asyncio
async def test_full_ingestion_cycle_publishes_events(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "test-project")
    monkeypatch.setenv("GITHUB_REPOS", "org/repo")
    monkeypatch.setenv("JIRA_PROJECT_KEYS", "PROJ")
    monkeypatch.setenv("SLACK_CHANNEL_IDS", "C123")

    github_events = [_make_event(ArtifactSource.github) for _ in range(3)]
    jira_events = [_make_event(ArtifactSource.jira) for _ in range(2)]
    slack_events = [_make_event(ArtifactSource.slack) for _ in range(1)]

    mock_state = AsyncMock()
    mock_state.get_cursor.return_value = datetime(2024, 1, 1)
    mock_state.update_cursor = AsyncMock()

    mock_github = AsyncMock()
    mock_github.fetch_events.return_value = github_events

    mock_jira = AsyncMock()
    mock_jira.fetch_issues.return_value = jira_events

    mock_slack = AsyncMock()
    mock_slack.fetch_messages.return_value = slack_events

    mock_publisher = MockPubSubPublisher()
    mock_write_exec = MagicMock()

    from pipeline import IngestionPipeline

    # Bypass __init__ to avoid GCP client instantiation
    pipeline = IngestionPipeline.__new__(IngestionPipeline)
    pipeline._github = mock_github
    pipeline._jira = mock_jira
    pipeline._slack = mock_slack
    pipeline._state = mock_state
    pipeline._publisher = mock_publisher
    pipeline._topic_path = "projects/test/topics/nexusdrift-raw-artifacts"

    with patch.object(pipeline, "_write_execution_record", mock_write_exec):
        result = await pipeline.run_cycle()

    # Verify published count
    assert result["total_published"] == 6
    assert result["github_count"] == 3
    assert result["jira_count"] == 2
    assert result["slack_count"] == 1
    assert len(mock_publisher.published) == 6

    # Verify each published message is a valid RawArtifactEvent
    for raw in mock_publisher.published:
        event = RawArtifactEvent.model_validate_json(raw.decode())
        assert event.artifact_id is not None

    # Verify Firestore execution record was written
    mock_write_exec.assert_called_once()
    call_kwargs = mock_write_exec.call_args.kwargs
    assert call_kwargs["total_published"] == 6
