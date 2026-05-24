from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_graph_with_nodes(node_a: dict, node_b: dict) -> AsyncMock:
    graph = AsyncMock()

    async def _execute_query(cypher: str, params: dict):
        node_id = params.get("id", "")
        if node_id == node_a.get("id"):
            return [{"n": node_a}]
        if node_id == node_b.get("id"):
            return [{"n": node_b}]
        return []

    graph.execute_query = _execute_query
    return graph


def _make_vectors(embeddings: dict) -> MagicMock:
    vectors = MagicMock()
    vectors.fetch_embedding = MagicMock(side_effect=lambda nid: embeddings.get(nid, []))
    return vectors


def _unit_vec(dim: int, offset: float = 0.0) -> list[float]:
    base = [1.0 + offset] + [0.0] * (dim - 1)
    norm = sum(x * x for x in base) ** 0.5
    return [x / norm for x in base]


# ---------------------------------------------------------------------------
# test_cosine_similarity_identical
# ---------------------------------------------------------------------------

def test_cosine_similarity_identical():
    from contradiction_detector import _cosine_similarity

    v = [0.5, 0.5, 0.5, 0.5]
    assert abs(_cosine_similarity(v, v) - 1.0) < 1e-6


# ---------------------------------------------------------------------------
# test_cosine_similarity_orthogonal
# ---------------------------------------------------------------------------

def test_cosine_similarity_orthogonal():
    from contradiction_detector import _cosine_similarity

    a = [1.0, 0.0]
    b = [0.0, 1.0]
    assert abs(_cosine_similarity(a, b)) < 1e-6


# ---------------------------------------------------------------------------
# test_cosine_similarity_empty
# ---------------------------------------------------------------------------

def test_cosine_similarity_empty():
    from contradiction_detector import _cosine_similarity

    assert _cosine_similarity([], []) == 0.0
    assert _cosine_similarity([1.0], []) == 0.0


# ---------------------------------------------------------------------------
# test_heuristic_contradiction_detects_adopt_abandon
# ---------------------------------------------------------------------------

def test_heuristic_contradiction_detects_adopt_abandon():
    from contradiction_detector import _heuristic_contradiction

    result = _heuristic_contradiction(
        "id-a",
        "id-b",
        "We will adopt microservices architecture",
        "We should abandon microservices and go monolith",
    )
    assert result is not None
    assert result["node_a_id"] == "id-a"
    assert result["contradiction_type"] == "logical"
    assert result["severity"] >= 0.3


# ---------------------------------------------------------------------------
# test_heuristic_contradiction_returns_none_for_compatible
# ---------------------------------------------------------------------------

def test_heuristic_contradiction_returns_none_for_compatible():
    from contradiction_detector import _heuristic_contradiction

    result = _heuristic_contradiction(
        "id-a",
        "id-b",
        "We will use Postgres for storage",
        "We will use Redis for caching",
    )
    assert result is None


# ---------------------------------------------------------------------------
# test_fetch_candidates_filters_below_threshold
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_fetch_candidates_filters_below_threshold():
    import contradiction_detector as cd

    v_high = [1.0, 0.0, 0.0]
    v_low = [0.0, 1.0, 0.0]

    vectors = _make_vectors({"id-1": v_high, "id-2": v_low})
    cd._vectors = vectors

    from state import ReasoningState
    state: ReasoningState = {
        "node_ids": ["id-1", "id-2"],
        "embeddings": {},
        "candidate_pairs": [],
        "contradictions": [],
        "llm_verified": [],
        "errors": [],
    }

    result = await cd.fetch_candidates(state)
    assert result["candidate_pairs"] == []


# ---------------------------------------------------------------------------
# test_fetch_candidates_includes_similar_pair
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_fetch_candidates_includes_similar_pair():
    import contradiction_detector as cd

    v1 = [1.0, 0.1, 0.0]
    v2 = [1.0, 0.05, 0.0]
    norm1 = sum(x * x for x in v1) ** 0.5
    norm2 = sum(x * x for x in v2) ** 0.5
    v1 = [x / norm1 for x in v1]
    v2 = [x / norm2 for x in v2]

    vectors = _make_vectors({"id-1": v1, "id-2": v2})
    cd._vectors = vectors
    cd.SIMILARITY_THRESHOLD = 0.5

    from state import ReasoningState
    state: ReasoningState = {
        "node_ids": ["id-1", "id-2"],
        "embeddings": {},
        "candidate_pairs": [],
        "contradictions": [],
        "llm_verified": [],
        "errors": [],
    }

    result = await cd.fetch_candidates(state)
    assert ("id-1", "id-2") in result["candidate_pairs"]


# ---------------------------------------------------------------------------
# test_run_contradiction_detection_no_nodes
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_run_contradiction_detection_no_nodes():
    from contradiction_detector import run_contradiction_detection

    graph = AsyncMock()
    vectors = MagicMock()
    vectors.fetch_embedding = MagicMock(return_value=[])

    result = await run_contradiction_detection([], graph, vectors)
    assert result == []
