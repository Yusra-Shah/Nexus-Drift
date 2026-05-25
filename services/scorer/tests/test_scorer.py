from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


def _full_metrics(**overrides: int) -> dict:
    base = {
        "total_nodes": 30,
        "total_relationships": 20,
        "concept_count": 10,
        "connected_concept_count": 8,
        "decision_count": 5,
        "decision_with_outcome_count": 4,
        "contradictions_count": 1,
        "person_count": 4,
        "expertise_edge_count": 10,
        "multi_expert_concept_count": 3,
        "artifact_count": 8,
        "artifact_with_source_count": 7,
        "recent_node_count": 6,
        "risk_count": 3,
        "high_severity_risk_count": 1,
    }
    base.update(overrides)
    return base


@pytest.mark.asyncio
async def test_compute_score_returns_expected_keys() -> None:
    from scorer import OrgConsciousnessScorer

    s = OrgConsciousnessScorer()
    result = await s.compute_score(_full_metrics())

    assert "score_id" in result
    assert "overall_score" in result
    assert "dimensions" in result
    assert "metrics" in result
    assert "computed_at" in result
    dims = result["dimensions"]
    for key in (
        "knowledge_coherence",
        "decision_consistency",
        "expertise_distribution",
        "memory_completeness",
        "learning_velocity",
        "risk_awareness",
    ):
        assert key in dims


@pytest.mark.asyncio
async def test_compute_score_range() -> None:
    from scorer import OrgConsciousnessScorer

    s = OrgConsciousnessScorer()
    result = await s.compute_score(_full_metrics())

    assert 0.0 <= result["overall_score"] <= 100.0
    for v in result["dimensions"].values():
        assert 0.0 <= v <= 100.0


@pytest.mark.asyncio
async def test_compute_score_all_zeros() -> None:
    from scorer import OrgConsciousnessScorer

    s = OrgConsciousnessScorer()
    metrics = {k: 0 for k in _full_metrics()}
    result = await s.compute_score(metrics)

    assert result["overall_score"] == 0.0


@pytest.mark.asyncio
async def test_compute_score_weighted_formula() -> None:
    from scorer import OrgConsciousnessScorer

    s = OrgConsciousnessScorer()
    metrics = _full_metrics(
        concept_count=20,
        connected_concept_count=20,
        decision_count=10,
        decision_with_outcome_count=10,
        contradictions_count=0,
        person_count=5,
        expertise_edge_count=20,
        multi_expert_concept_count=20,
        artifact_count=10,
        artifact_with_source_count=10,
        total_nodes=50,
        recent_node_count=10,
        risk_count=5,
        high_severity_risk_count=5,
    )
    result = await s.compute_score(metrics)
    assert result["overall_score"] == 100.0


@pytest.mark.asyncio
async def test_persist_score_calls_firestore() -> None:
    from scorer import OrgConsciousnessScorer

    s = OrgConsciousnessScorer()
    result = (await s.compute_score(_full_metrics()))

    firestore = MagicMock()
    doc_mock = MagicMock()
    firestore.collection.return_value.document.return_value = doc_mock

    with patch("scorer.publish_message"):
        await s.persist_score(result, firestore, MagicMock(), "proj.ds.table", None, "alerts-topic")

    firestore.collection.assert_called_once_with("consciousness_scores")
    firestore.collection.return_value.document.assert_called_once_with("latest")
    doc_mock.set.assert_called_once_with(result)


@pytest.mark.asyncio
async def test_persist_score_calls_bigquery() -> None:
    from scorer import OrgConsciousnessScorer

    s = OrgConsciousnessScorer()
    result = await s.compute_score(_full_metrics(risk_count=0))

    bq = MagicMock()
    bq.insert_rows_json.return_value = []
    firestore = MagicMock()
    firestore.collection.return_value.document.return_value = MagicMock()

    await s.persist_score(result, firestore, bq, "proj.ds.table", None, "alerts-topic")

    bq.insert_rows_json.assert_called_once()
    call_args = bq.insert_rows_json.call_args
    assert call_args[0][0] == "proj.ds.table"
    row = call_args[0][1][0]
    assert row["score_id"] == result["score_id"]


@pytest.mark.asyncio
async def test_persist_score_dispatches_alert_when_low() -> None:
    from scorer import OrgConsciousnessScorer

    s = OrgConsciousnessScorer()
    metrics = {k: 0 for k in _full_metrics()}
    result = await s.compute_score(metrics)
    assert result["overall_score"] < 50.0

    firestore = MagicMock()
    firestore.collection.return_value.document.return_value = MagicMock()

    with patch("scorer.publish_message") as mock_pub:
        await s.persist_score(result, firestore, MagicMock(), "proj.ds.table", None, "alerts-topic")

    mock_pub.assert_called_once()
    alert = mock_pub.call_args[0][1]
    assert alert.alert_type == "consciousness_score_degraded"


@pytest.mark.asyncio
async def test_run_cycle_integrates_collect_and_score() -> None:
    from scorer import OrgConsciousnessScorer

    s = OrgConsciousnessScorer()
    graph = AsyncMock()
    graph.execute_query = AsyncMock(return_value=[{"value": 5}])
    firestore = MagicMock()
    firestore.collection.return_value.document.return_value = MagicMock()
    bq = MagicMock()
    bq.insert_rows_json.return_value = []

    with patch("scorer.publish_message"):
        result = await s.run_cycle(graph, firestore, bq, "p.d.t", None, "alerts")

    assert "overall_score" in result
    assert "dimensions" in result
