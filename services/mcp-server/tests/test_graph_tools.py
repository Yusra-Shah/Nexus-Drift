from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock

import graph_tools


@pytest.fixture(autouse=True)
def reset_globals():
    original_graph = graph_tools._graph
    original_firestore = graph_tools._firestore
    yield
    graph_tools._graph = original_graph
    graph_tools._firestore = original_firestore


def _make_graph(*row_dicts):
    graph = AsyncMock()
    graph.execute_query = AsyncMock(return_value=list(row_dicts))
    return graph


@pytest.mark.asyncio
async def test_get_recent_decisions() -> None:
    graph = _make_graph({"d": {"id": "1", "title": "Adopt microservices"}})
    graph_tools.init(graph, MagicMock())

    result = await graph_tools.get_recent_decisions(limit=5)

    graph.execute_query.assert_called_once()
    assert result == [{"id": "1", "title": "Adopt microservices"}]


@pytest.mark.asyncio
async def test_get_person_expertise_found() -> None:
    graph = AsyncMock()
    graph.execute_query = AsyncMock(
        return_value=[{"p": {"id": "p1", "name": "Alice"}, "concepts": [{"id": "c1", "name": "Python"}]}]
    )
    graph_tools.init(graph, MagicMock())

    result = await graph_tools.get_person_expertise("p1")

    assert result["person"]["name"] == "Alice"
    assert len(result["concepts"]) == 1


@pytest.mark.asyncio
async def test_get_person_expertise_not_found() -> None:
    graph = _make_graph()
    graph_tools.init(graph, MagicMock())

    result = await graph_tools.get_person_expertise("unknown")

    assert result == {}


@pytest.mark.asyncio
async def test_get_active_risks_no_filter() -> None:
    graph = _make_graph({"r": {"id": "r1", "severity": "high"}})
    graph_tools.init(graph, MagicMock())

    result = await graph_tools.get_active_risks()

    assert result == [{"id": "r1", "severity": "high"}]


@pytest.mark.asyncio
async def test_get_active_risks_with_severity() -> None:
    graph = AsyncMock()
    graph.execute_query = AsyncMock(return_value=[{"r": {"id": "r1", "severity": "high"}}])
    graph_tools.init(graph, MagicMock())

    await graph_tools.get_active_risks(severity="high")

    call_args = graph.execute_query.call_args
    assert "severity" in call_args[0][0].lower() or "severity" in str(call_args)


@pytest.mark.asyncio
async def test_get_contradictions() -> None:
    graph = _make_graph({"c": {"id": "con1", "description": "conflict"}})
    graph_tools.init(graph, MagicMock())

    result = await graph_tools.get_contradictions()

    assert result == [{"id": "con1", "description": "conflict"}]


@pytest.mark.asyncio
async def test_get_consciousness_score_exists() -> None:
    fs = MagicMock()
    doc_mock = MagicMock()
    doc_mock.exists = True
    doc_mock.to_dict.return_value = {"overall_score": 72.5}
    fs.collection.return_value.document.return_value.get.return_value = doc_mock
    graph_tools.init(AsyncMock(), fs)

    result = await graph_tools.get_consciousness_score()

    assert result["overall_score"] == 72.5


@pytest.mark.asyncio
async def test_get_consciousness_score_missing() -> None:
    fs = MagicMock()
    doc_mock = MagicMock()
    doc_mock.exists = False
    fs.collection.return_value.document.return_value.get.return_value = doc_mock
    graph_tools.init(AsyncMock(), fs)

    result = await graph_tools.get_consciousness_score()

    assert result == {}


@pytest.mark.asyncio
async def test_search_nodes_with_type() -> None:
    graph = AsyncMock()
    graph.execute_query = AsyncMock(return_value=[{"n": {"id": "d1", "title": "adopt kafka"}}])
    graph_tools.init(graph, MagicMock())

    result = await graph_tools.search_nodes("kafka", node_type="Decision")

    assert len(result) == 1
    cypher_used = graph.execute_query.call_args[0][0]
    assert "Decision" in cypher_used
