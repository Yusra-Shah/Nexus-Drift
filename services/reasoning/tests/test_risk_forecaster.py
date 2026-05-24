from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, patch


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_mock_graph(
    decisions=None,
    failed=None,
    silos=None,
    persons=None,
    contradictions=None,
    collaboration=0.5,
    velocity=0.4,
) -> AsyncMock:
    graph = AsyncMock()
    graph.execute_query = AsyncMock(return_value=[])

    async def _fetch_decisions_for_project(g, pk):
        return decisions or []

    async def _fetch_failed_decisions(g, pk):
        return failed or []

    async def _fetch_knowledge_silos(g):
        return silos or []

    async def _fetch_persons_for_project(g, pk):
        return persons or []

    async def _fetch_unresolved_contradictions(g, pk):
        return contradictions or []

    async def _fetch_cross_team_collaboration(g):
        return collaboration

    async def _fetch_decision_velocity(g, pk, days=30):
        return velocity

    async def _write_risk_node(g, risk):
        return risk.get("id", "test-id")

    return graph, {
        "fetch_decisions_for_project": _fetch_decisions_for_project,
        "fetch_failed_decisions": _fetch_failed_decisions,
        "fetch_knowledge_silos": _fetch_knowledge_silos,
        "fetch_persons_for_project": _fetch_persons_for_project,
        "fetch_unresolved_contradictions": _fetch_unresolved_contradictions,
        "fetch_cross_team_collaboration": _fetch_cross_team_collaboration,
        "fetch_decision_velocity": _fetch_decision_velocity,
        "write_risk_node": _write_risk_node,
    }


# ---------------------------------------------------------------------------
# test_score_risks_knowledge_silo_critical
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_score_risks_knowledge_silo_critical():
    from risk_forecaster import score_risks
    from state import RiskScoringState

    state: RiskScoringState = {
        "project_key": "PROJ",
        "graph_metrics": {
            "total_decisions": 20,
            "failed_decisions": 2,
            "knowledge_silos": 5,
            "total_persons": 10,
            "unresolved_contradictions": 0,
            "failure_rate": 0.1,
        },
        "risk_signals": [],
        "scored_risks": [],
        "consciousness_score": {},
        "errors": [],
    }

    result = await score_risks(state)
    silo_risks = [r for r in result["risk_signals"] if r["risk_type"] == "knowledge_silo"]
    assert len(silo_risks) == 1
    assert silo_risks[0]["severity"] == "critical"


# ---------------------------------------------------------------------------
# test_score_risks_no_risks_when_healthy
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_score_risks_no_risks_when_healthy():
    from risk_forecaster import score_risks
    from state import RiskScoringState

    state: RiskScoringState = {
        "project_key": "PROJ",
        "graph_metrics": {
            "total_decisions": 20,
            "failed_decisions": 0,
            "knowledge_silos": 0,
            "total_persons": 5,
            "unresolved_contradictions": 0,
            "failure_rate": 0.0,
        },
        "risk_signals": [],
        "scored_risks": [],
        "consciousness_score": {},
        "errors": [],
    }

    result = await score_risks(state)
    assert result["risk_signals"] == []


# ---------------------------------------------------------------------------
# test_score_risks_repeated_failure
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_score_risks_repeated_failure():
    from risk_forecaster import score_risks
    from state import RiskScoringState

    state: RiskScoringState = {
        "project_key": "PROJ",
        "graph_metrics": {
            "total_decisions": 10,
            "failed_decisions": 7,
            "knowledge_silos": 0,
            "total_persons": 5,
            "unresolved_contradictions": 0,
            "failure_rate": 0.7,
        },
        "risk_signals": [],
        "scored_risks": [],
        "consciousness_score": {},
        "errors": [],
    }

    result = await score_risks(state)
    failure_risks = [r for r in result["risk_signals"] if r["risk_type"] == "repeated_failure"]
    assert len(failure_risks) == 1
    assert failure_risks[0]["severity"] == "high"


# ---------------------------------------------------------------------------
# test_compute_consciousness_score_range
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_compute_consciousness_score_range():
    import risk_forecaster as rf
    from state import RiskScoringState

    rf._graph = AsyncMock()

    with patch("risk_forecaster.fetch_cross_team_collaboration", return_value=0.5), \
         patch("risk_forecaster.fetch_decision_velocity", return_value=0.4):

        state: RiskScoringState = {
            "project_key": "PROJ",
            "graph_metrics": {
                "total_decisions": 30,
                "failed_decisions": 6,
                "knowledge_silos": 2,
                "total_persons": 8,
                "unresolved_contradictions": 1,
                "failure_rate": 0.2,
            },
            "risk_signals": [],
            "scored_risks": [],
            "consciousness_score": {},
            "errors": [],
        }

        result = await rf.compute_consciousness_score(state)

    score = result["consciousness_score"]["score"]
    assert 0.0 <= score <= 1.0
    dims = result["consciousness_score"]["dimensions"]
    assert "memory_continuity" in dims
    assert "knowledge_distribution" in dims
    assert "decision_quality" in dims


# ---------------------------------------------------------------------------
# test_compute_consciousness_score_all_dimensions_present
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_compute_consciousness_score_all_dimensions_present():
    import risk_forecaster as rf
    from state import RiskScoringState

    rf._graph = AsyncMock()

    with patch("risk_forecaster.fetch_cross_team_collaboration", return_value=0.8), \
         patch("risk_forecaster.fetch_decision_velocity", return_value=0.6):

        state: RiskScoringState = {
            "project_key": "PROJ",
            "graph_metrics": {
                "total_decisions": 50,
                "failed_decisions": 5,
                "knowledge_silos": 0,
                "total_persons": 10,
                "unresolved_contradictions": 0,
                "failure_rate": 0.1,
            },
            "risk_signals": [],
            "scored_risks": [],
            "consciousness_score": {},
            "errors": [],
        }

        result = await rf.compute_consciousness_score(state)

    expected_dims = {
        "memory_continuity",
        "knowledge_distribution",
        "decision_quality",
        "cross_team_collaboration",
        "decision_velocity",
        "contradiction_health",
    }
    assert expected_dims == set(result["consciousness_score"]["dimensions"].keys())


# ---------------------------------------------------------------------------
# test_run_risk_forecasting_returns_expected_keys
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_run_risk_forecasting_returns_expected_keys():
    from risk_forecaster import run_risk_forecasting

    graph = AsyncMock()
    graph.execute_query = AsyncMock(return_value=[])

    with patch("risk_forecaster.fetch_decisions_for_project", return_value=[]), \
         patch("risk_forecaster.fetch_failed_decisions", return_value=[]), \
         patch("risk_forecaster.fetch_knowledge_silos", return_value=[]), \
         patch("risk_forecaster.fetch_persons_for_project", return_value=[]), \
         patch("risk_forecaster.fetch_unresolved_contradictions", return_value=[]), \
         patch("risk_forecaster.fetch_cross_team_collaboration", return_value=0.0), \
         patch("risk_forecaster.fetch_decision_velocity", return_value=0.0), \
         patch("risk_forecaster.write_risk_node", return_value="some-id"):

        result = await run_risk_forecasting("PROJ", graph)

    assert "scored_risks" in result
    assert "consciousness_score" in result
    assert "errors" in result
