from __future__ import annotations

import pytest
from unittest.mock import AsyncMock
from uuid import uuid4


def _make_graph_mock() -> AsyncMock:
    graph = AsyncMock()
    graph.execute_query = AsyncMock(return_value=[])
    graph.create_node = AsyncMock(return_value={})
    graph.update_node = AsyncMock()
    return graph


# ---------------------------------------------------------------------------
# test_write_decision_creates_new_node
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_write_decision_creates_new_node():
    from node_writer import NodeWriter

    graph = _make_graph_mock()
    graph.execute_query.return_value = []  # no existing node

    writer = NodeWriter(graph)
    decision_id = str(uuid4())
    result = await writer.write_decision(
        {
            "id": decision_id,
            "title": "Adopt microservices",
            "content": "We chose microservices for independent scaling.",
            "decision_type": "architectural",
            "outcome": "pending",
            "confidence": 0.9,
        }
    )

    graph.create_node.assert_called_once()
    call_args = graph.create_node.call_args
    assert call_args.args[0] == "Decision"
    assert call_args.args[1]["title"] == "Adopt microservices"
    assert result == decision_id


# ---------------------------------------------------------------------------
# test_write_decision_deduplicates_same_title
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_write_decision_deduplicates_same_title():
    from node_writer import NodeWriter

    existing_id = str(uuid4())
    graph = _make_graph_mock()
    graph.execute_query.return_value = [{"id": existing_id, "outcome": "pending"}]

    writer = NodeWriter(graph)
    result = await writer.write_decision(
        {
            "title": "Adopt microservices",
            "content": "Same decision again",
            "decision_type": "architectural",
            "outcome": "pending",  # same outcome → no update
        }
    )

    graph.create_node.assert_not_called()
    assert result == existing_id


# ---------------------------------------------------------------------------
# test_write_person_merges_expertise
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_write_person_merges_expertise():
    from node_writer import NodeWriter

    existing_id = str(uuid4())
    graph = _make_graph_mock()
    graph.execute_query.return_value = [
        {"id": existing_id, "domains": ["python", "neo4j"]}
    ]

    writer = NodeWriter(graph)
    result = await writer.write_person(
        {
            "name": "Alice",
            "role": "engineer",
            "expertise_domains": ["neo4j", "fastapi"],  # neo4j overlaps
        }
    )

    graph.update_node.assert_called_once()
    updated_props = graph.update_node.call_args.args[1]
    merged = set(updated_props["expertise_domains"])
    assert "python" in merged
    assert "neo4j" in merged
    assert "fastapi" in merged
    assert result == existing_id
    graph.create_node.assert_not_called()


# ---------------------------------------------------------------------------
# test_write_concept_updates_existing
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_write_concept_updates_existing():
    from node_writer import NodeWriter

    existing_id = str(uuid4())
    graph = _make_graph_mock()
    graph.execute_query.return_value = [{"id": existing_id}]

    writer = NodeWriter(graph)
    result = await writer.write_concept(
        {"label": "auth-system", "domain": "auth", "importance_score": 0.9}
    )

    graph.update_node.assert_called_once()
    graph.create_node.assert_not_called()
    assert result == existing_id
