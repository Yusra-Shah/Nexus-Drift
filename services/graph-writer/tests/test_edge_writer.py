from __future__ import annotations

import pytest
from unittest.mock import AsyncMock
from uuid import uuid4


def _make_graph_mock() -> AsyncMock:
    graph = AsyncMock()
    graph.execute_query = AsyncMock(return_value=[])
    graph.create_edge = AsyncMock()
    return graph


# ---------------------------------------------------------------------------
# test_link_decision_to_artifact_calls_create_edge
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_link_decision_to_artifact_calls_create_edge():
    from edge_writer import EdgeWriter

    graph = _make_graph_mock()
    writer = EdgeWriter(graph)

    decision_id = str(uuid4())
    artifact_id = str(uuid4())
    await writer.link_decision_to_artifact(decision_id, artifact_id, "test-agent", 0.9)

    graph.create_edge.assert_called_once()
    call_args = graph.create_edge.call_args
    assert call_args.args[0] == artifact_id   # from: artifact
    assert call_args.args[1] == "REFERENCES"
    assert call_args.args[2] == decision_id    # to: decision
    props = call_args.args[3]
    assert props["confidence"] == 0.9
    assert props["agent_id"] == "test-agent"


# ---------------------------------------------------------------------------
# test_link_person_expertise_updates_if_exists
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_link_person_expertise_updates_if_exists():
    from edge_writer import EdgeWriter

    graph = _make_graph_mock()
    # execute_query is used by link_person_expertise via MERGE Cypher (not create_edge)
    writer = EdgeWriter(graph)

    person_id = str(uuid4())
    concept_id = str(uuid4())
    await writer.link_person_expertise(person_id, concept_id, "agent", 0.7)

    # MERGE path uses execute_query, not create_edge
    graph.execute_query.assert_called_once()
    cypher_call = graph.execute_query.call_args
    cypher = cypher_call.args[0]
    params = cypher_call.args[1]

    assert "MERGE" in cypher
    assert "HAS_EXPERTISE_IN" in cypher
    assert "max" in cypher.lower() or "CASE WHEN" in cypher
    assert params["confidence"] == 0.7
    assert params["person_id"] == person_id
    assert params["concept_id"] == concept_id


# ---------------------------------------------------------------------------
# test_attempt_decision_links_creates_all_edges
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_attempt_decision_links_creates_all_edges():
    from edge_writer import EdgeWriter

    graph = _make_graph_mock()
    writer = EdgeWriter(graph)

    decision_id = str(uuid4())
    person_ids = [str(uuid4()), str(uuid4())]       # 2 persons
    concept_ids = [str(uuid4()), str(uuid4()), str(uuid4())]  # 3 concepts
    artifact_id = str(uuid4())

    await writer.attempt_decision_links(
        decision_id, person_ids, concept_ids, "agent", artifact_id
    )

    # create_edge calls: 2 MADE_BY + 3 REFERENCES = 5
    create_edge_calls = graph.create_edge.call_args_list
    edge_types = [c.args[1] for c in create_edge_calls]

    made_by_count = edge_types.count("MADE_BY")
    references_count = edge_types.count("REFERENCES")
    assert made_by_count == 2   # one per person
    assert references_count == 3  # one per concept

    # execute_query calls: 2 persons × 3 concepts = 6 HAS_EXPERTISE_IN MERGEs
    expertise_calls = [
        c for c in graph.execute_query.call_args_list
        if "HAS_EXPERTISE_IN" in (c.args[0] if c.args else "")
    ]
    assert len(expertise_calls) == 6
