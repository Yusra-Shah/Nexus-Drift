from __future__ import annotations

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from shared.models.agent_events import RawArtifactEvent
from shared.models.graph_nodes import ArtifactSource


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_event() -> RawArtifactEvent:
    return RawArtifactEvent(
        source=ArtifactSource.github,
        content="We decided to migrate from MongoDB to PostgreSQL for ACID compliance.",
        metadata={"artifact_type": "pr"},
    )


def _valid_parsed_artifact_json() -> str:
    return json.dumps({
        "decisions": [
            {
                "title": "Migrate from MongoDB to PostgreSQL",
                "content": "Decided to migrate for ACID compliance and relational query support.",
                "decision_type": "architectural",
                "outcome": "pending",
                "confidence": 0.9,
            }
        ],
        "persons": [],
        "concepts": [{"label": "database-migration", "domain": "data"}],
        "summary": "Team decided to migrate database for ACID compliance.",
        "confidence": 0.85,
    })


# ---------------------------------------------------------------------------
# test_system_prompt_contains_delimiter_markers
# ---------------------------------------------------------------------------

def test_system_prompt_contains_delimiter_markers():
    from gemini_client import GeminiParserClient

    assert "ARTIFACT_START" in GeminiParserClient.SYSTEM_PROMPT
    assert "ARTIFACT_END" in GeminiParserClient.SYSTEM_PROMPT


# ---------------------------------------------------------------------------
# test_system_prompt_says_never_instructions
# ---------------------------------------------------------------------------

def test_system_prompt_says_never_instructions():
    from gemini_client import GeminiParserClient

    prompt_lower = GeminiParserClient.SYSTEM_PROMPT.lower()
    assert "never" in prompt_lower and ("instruction" in prompt_lower or "instructions" in prompt_lower)


# ---------------------------------------------------------------------------
# test_parse_artifact_validates_schema
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_parse_artifact_validates_schema(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    mock_genai = MagicMock()
    mock_model = MagicMock()
    mock_response = MagicMock()
    mock_response.text = _valid_parsed_artifact_json()
    mock_model.generate_content_async = AsyncMock(return_value=mock_response)
    mock_genai.GenerativeModel.return_value = mock_model
    mock_genai.GenerationConfig = MagicMock(return_value={})

    with patch.dict("sys.modules", {"google.generativeai": mock_genai}):
        from importlib import reload
        import gemini_client as gc_module
        reload(gc_module)
        from gemini_client import GeminiParserClient

        client = GeminiParserClient.__new__(GeminiParserClient)
        client._model = mock_model

        result = await client.parse_artifact(_make_event())

    from schemas import ParsedArtifact
    assert isinstance(result, ParsedArtifact)
    assert len(result.decisions) == 1
    assert result.decisions[0].title == "Migrate from MongoDB to PostgreSQL"
    assert result.confidence == 0.85


# ---------------------------------------------------------------------------
# test_parse_artifact_rejects_invalid_schema
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_parse_artifact_rejects_invalid_schema(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    mock_model = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "NOT VALID JSON {{{"
    mock_model.generate_content_async = AsyncMock(return_value=mock_response)

    from gemini_client import GeminiParserClient
    from schemas import ParsedArtifact

    client = GeminiParserClient.__new__(GeminiParserClient)
    client._model = mock_model

    result = await client.parse_artifact(_make_event())

    assert isinstance(result, ParsedArtifact)
    assert result.confidence == 0.0
    assert result.decisions == []


# ---------------------------------------------------------------------------
# test_truncation_limit_decisions
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_truncation_limit_decisions(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")

    decisions_15 = [
        {
            "title": f"Decision {i}",
            "content": "Some decision content",
            "decision_type": "technical",
            "outcome": "unknown",
            "confidence": 0.7,
        }
        for i in range(15)
    ]
    payload = json.dumps({
        "decisions": decisions_15,
        "persons": [],
        "concepts": [],
        "summary": "Lots of decisions",
        "confidence": 0.8,
    })

    mock_model = MagicMock()
    mock_response = MagicMock()
    mock_response.text = payload
    mock_model.generate_content_async = AsyncMock(return_value=mock_response)

    from gemini_client import GeminiParserClient

    client = GeminiParserClient.__new__(GeminiParserClient)
    client._model = mock_model

    result = await client.parse_artifact(_make_event())

    assert len(result.decisions) <= 10
