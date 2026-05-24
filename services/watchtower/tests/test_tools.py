from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_graph(**kwargs) -> AsyncMock:
    graph = AsyncMock()
    graph.execute_query = AsyncMock(return_value=kwargs.get("rows", []))
    return graph


# ---------------------------------------------------------------------------
# test_query_recent_decisions_returns_rows
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_query_recent_decisions_returns_rows():
    import tools

    rows = [
        {"id": "d1", "title": "Use Postgres", "outcome": "pending", "decision_type": "architectural"},
        {"id": "d2", "title": "Use Redis", "outcome": "success", "decision_type": "technical"},
    ]
    tools._graph = _make_graph(rows=rows)
    tools._graph.execute_query = AsyncMock(return_value=rows)

    result = await tools.query_recent_decisions(limit=10)
    assert len(result) == 2
    assert result[0]["id"] == "d1"


# ---------------------------------------------------------------------------
# test_query_unresolved_risks_filters_by_severity
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_query_unresolved_risks_filters_by_severity():
    import tools

    rows = [
        {"id": "r1", "risk_type": "knowledge_silo", "severity": "high", "score": 0.7},
        {"id": "r2", "risk_type": "repeated_failure", "severity": "critical", "score": 0.9},
    ]
    tools._graph = AsyncMock()
    tools._graph.execute_query = AsyncMock(return_value=rows)

    result = await tools.query_unresolved_risks("high")
    assert len(result) == 2


# ---------------------------------------------------------------------------
# test_query_knowledge_gaps_returns_silos
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_query_knowledge_gaps_returns_silos():
    import tools

    rows = [
        {"id": "p1", "name": "Alice", "expertise_count": 0},
        {"id": "p2", "name": "Bob", "expertise_count": 1},
    ]
    tools._graph = AsyncMock()
    tools._graph.execute_query = AsyncMock(return_value=rows)

    result = await tools.query_knowledge_gaps()
    assert len(result) == 2
    assert result[0]["name"] == "Alice"


# ---------------------------------------------------------------------------
# test_dispatch_alert_returns_alert_id
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_dispatch_alert_returns_alert_id():
    import tools

    tools._graph = AsyncMock()
    tools._publisher = None
    tools._firestore = None

    evidence = [str(uuid4()), str(uuid4()), str(uuid4())]
    alert_id = await tools.dispatch_alert(
        "knowledge_silo",
        "high",
        "Three persons are knowledge silos.",
        evidence,
    )

    assert isinstance(alert_id, str)
    assert len(alert_id) > 0


# ---------------------------------------------------------------------------
# test_dispatch_alert_writes_to_firestore
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_dispatch_alert_writes_to_firestore():
    import tools

    tools._graph = AsyncMock()
    tools._publisher = None

    mock_doc = MagicMock()
    mock_collection = MagicMock()
    mock_collection.document.return_value = mock_doc
    mock_fs = MagicMock()
    mock_fs.collection.return_value = mock_collection
    tools._firestore = mock_fs

    await tools.dispatch_alert("critical_risk", "critical", "Critical risk found.", [])

    mock_fs.collection.assert_called_once_with("alerts")
    mock_doc.set.assert_called_once()


# ---------------------------------------------------------------------------
# test_compute_org_health_summary_healthy
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_compute_org_health_summary_healthy():
    import tools

    rows = [{"total_decisions": 50, "open_risks": 2, "open_contradictions": 1}]
    tools._graph = AsyncMock()
    tools._graph.execute_query = AsyncMock(return_value=rows)

    result = await tools.compute_org_health_summary()
    assert "health_score" in result
    assert 0.0 <= result["health_score"] <= 1.0
    assert result["total_decisions"] == 50
