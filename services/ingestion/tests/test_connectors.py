from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_push_event(repo: str = "org/repo") -> dict:
    return {
        "type": "PushEvent",
        "actor": {"login": "dev"},
        "payload": {
            "commits": [
                {"sha": "abc12345", "message": "feat: add login endpoint", "author": {"name": "dev"}},
            ]
        },
    }


def _make_pr_event(repo: str = "org/repo") -> dict:
    return {
        "type": "PullRequestEvent",
        "actor": {"login": "dev"},
        "payload": {
            "action": "opened",
            "pull_request": {
                "number": 42,
                "title": "Add OAuth support",
                "body": "Implements OAuth 2.0 flow",
                "state": "open",
                "user": {"login": "dev"},
                "html_url": f"https://github.com/{repo}/pull/42",
            },
        },
    }


def _make_issue_comment_event() -> dict:
    return {
        "type": "IssueCommentEvent",
        "actor": {"login": "dev"},
        "payload": {"action": "created", "comment": {"body": "looks good"}},
    }


# ---------------------------------------------------------------------------
# test_github_connector_filters_events
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_github_connector_filters_events(monkeypatch):
    monkeypatch.setenv("GITHUB_TOKEN", "test-token")

    from connectors.github_connector import GithubConnector

    connector = GithubConnector()
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = [
        _make_push_event(),
        _make_pr_event(),
        _make_issue_comment_event(),
    ]

    with patch.object(connector._client, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        since = datetime(2024, 1, 1, tzinfo=timezone.utc)
        results = await connector.fetch_events(since, ["org/repo"])

    await connector.close()

    # Should return PushEvent (1 commit) + PullRequestEvent = 2 events, not IssueCommentEvent
    assert len(results) == 2
    types = {r.metadata["event_type"] for r in results}
    assert "PushEvent" in types
    assert "PullRequestEvent" in types
    assert "IssueCommentEvent" not in types


# ---------------------------------------------------------------------------
# test_sanitize_applied_to_content
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_sanitize_applied_to_content(monkeypatch):
    monkeypatch.setenv("GITHUB_TOKEN", "test-token")

    from connectors.github_connector import GithubConnector

    connector = GithubConnector()
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = [
        {
            "type": "PullRequestEvent",
            "actor": {"login": "dev"},
            "payload": {
                "action": "opened",
                "pull_request": {
                    "number": 1,
                    "title": "Fix <b>bold</b> issue",
                    "body": "<script>alert('xss')</script>Real body",
                    "state": "open",
                    "user": {"login": "dev"},
                    "html_url": "",
                },
            },
        }
    ]

    with patch.object(connector._client, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        since = datetime(2024, 1, 1)
        results = await connector.fetch_events(since, ["org/repo"])

    await connector.close()

    assert len(results) == 1
    content = results[0].content
    assert "<b>" not in content
    assert "<script>" not in content
    assert "Real body" in content


# ---------------------------------------------------------------------------
# test_jira_adf_text_extraction
# ---------------------------------------------------------------------------

def test_jira_adf_text_extraction():
    from connectors.jira_connector import _extract_adf_text

    adf = {
        "type": "doc",
        "version": 1,
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "This is "},
                    {"type": "text", "text": "a description."},
                ],
            },
            {
                "type": "bulletList",
                "content": [
                    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Item one"}]}]},
                    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Item two"}]}]},
                ],
            },
        ],
    }

    result = _extract_adf_text(adf)
    assert "This is" in result
    assert "a description" in result
    assert "Item one" in result
    assert "Item two" in result


# ---------------------------------------------------------------------------
# test_slack_filters_short_messages
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_slack_filters_short_messages(monkeypatch):
    monkeypatch.setenv("SLACK_BOT_TOKEN", "xoxb-test")

    from connectors.slack_connector import SlackConnector

    connector = SlackConnector()

    history_response = MagicMock()
    history_response.raise_for_status = MagicMock()
    history_response.json.return_value = {
        "ok": True,
        "messages": [
            {"ts": "1", "text": "Hi", "user": "U1"},
            {"ts": "2", "text": "ok thanks", "user": "U2"},
            {"ts": "3", "text": "x" * 200, "user": "U3"},
        ],
    }

    with patch.object(connector._client, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = history_response
        since = datetime(2024, 1, 1)
        results = await connector.fetch_messages(["C123"], since)

    await connector.close()

    assert len(results) == 1
    assert len(results[0].content) >= 50


# ---------------------------------------------------------------------------
# test_empty_repos_returns_empty_list
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_empty_repos_returns_empty_list(monkeypatch):
    monkeypatch.setenv("GITHUB_TOKEN", "test-token")

    from connectors.github_connector import GithubConnector

    connector = GithubConnector()
    with patch.object(connector._client, "get", new_callable=AsyncMock) as mock_get:
        since = datetime(2024, 1, 1)
        results = await connector.fetch_events(since, [])

    await connector.close()

    assert results == []
    mock_get.assert_not_called()
