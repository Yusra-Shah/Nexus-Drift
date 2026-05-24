from __future__ import annotations

import os
from typing import Any
from uuid import uuid4

try:
    from langgraph.graph import StateGraph, END
except ImportError:
    StateGraph = None  # type: ignore[assignment,misc]
    END = "__end__"

from state import RiskScoringState

try:
    from graph_queries import (
        fetch_decisions_for_project,
        fetch_failed_decisions,
        fetch_knowledge_silos,
        fetch_persons_for_project,
        fetch_unresolved_contradictions,
        fetch_cross_team_collaboration,
        fetch_decision_velocity,
        write_risk_node,
    )
except ImportError:
    fetch_decisions_for_project = None  # type: ignore[assignment]
    fetch_failed_decisions = None  # type: ignore[assignment]
    fetch_knowledge_silos = None  # type: ignore[assignment]
    fetch_persons_for_project = None  # type: ignore[assignment]
    fetch_unresolved_contradictions = None  # type: ignore[assignment]
    fetch_cross_team_collaboration = None  # type: ignore[assignment]
    fetch_decision_velocity = None  # type: ignore[assignment]
    write_risk_node = None  # type: ignore[assignment]

_graph: Any = None
_bq_client: Any = None

RISK_SCORING_INTERVAL = int(os.environ.get("RISK_SCORING_INTERVAL_SECONDS", "1800"))


async def collect_graph_metrics(state: RiskScoringState) -> RiskScoringState:
    import sys
    _mod = sys.modules[__name__]
    graph = _graph
    project_key = state["project_key"]
    metrics: dict[str, Any] = {}

    try:
        decisions = await _mod.fetch_decisions_for_project(graph, project_key)
        failed = await _mod.fetch_failed_decisions(graph, project_key)
        silos = await _mod.fetch_knowledge_silos(graph)
        persons = await _mod.fetch_persons_for_project(graph, project_key)
        contradictions = await _mod.fetch_unresolved_contradictions(graph, project_key)

        metrics = {
            "total_decisions": len(decisions),
            "failed_decisions": len(failed),
            "knowledge_silos": len(silos),
            "total_persons": len(persons),
            "unresolved_contradictions": len(contradictions),
            "failure_rate": len(failed) / max(len(decisions), 1),
        }
    except Exception as exc:
        state["errors"].append(f"collect_metrics: {exc}")

    return {**state, "graph_metrics": metrics}


async def score_risks(state: RiskScoringState) -> RiskScoringState:
    metrics = state["graph_metrics"]
    risk_signals: list[dict[str, Any]] = []

    silo_count = metrics.get("knowledge_silos", 0)
    if silo_count >= 5:
        severity = "critical"
    elif silo_count >= 3:
        severity = "high"
    elif silo_count >= 1:
        severity = "medium"
    else:
        severity = "low"

    if silo_count > 0:
        risk_signals.append({
            "id": str(uuid4()),
            "risk_type": "knowledge_silo",
            "severity": severity,
            "score": min(silo_count / 10.0, 1.0),
            "evidence_node_ids": [],
            "project_key": state["project_key"],
        })

    failure_rate = metrics.get("failure_rate", 0.0)
    if failure_rate >= 0.4:
        risk_signals.append({
            "id": str(uuid4()),
            "risk_type": "repeated_failure",
            "severity": "high" if failure_rate >= 0.6 else "medium",
            "score": min(failure_rate, 1.0),
            "evidence_node_ids": [],
            "project_key": state["project_key"],
        })

    contradiction_count = metrics.get("unresolved_contradictions", 0)
    if contradiction_count >= 2:
        risk_signals.append({
            "id": str(uuid4()),
            "risk_type": "roadmap_contradiction",
            "severity": "high" if contradiction_count >= 5 else "medium",
            "score": min(contradiction_count / 10.0, 1.0),
            "evidence_node_ids": [],
            "project_key": state["project_key"],
        })

    return {**state, "risk_signals": risk_signals}


async def compute_consciousness_score(state: RiskScoringState) -> RiskScoringState:
    import sys
    _mod = sys.modules[__name__]
    graph = _graph
    project_key = state["project_key"]
    metrics = state["graph_metrics"]

    try:
        collaboration = await _mod.fetch_cross_team_collaboration(graph)
        velocity = await _mod.fetch_decision_velocity(graph, project_key)
    except Exception:
        collaboration = 0.0
        velocity = 0.0

    total_decisions = max(metrics.get("total_decisions", 0), 1)
    silo_count = metrics.get("knowledge_silos", 0)
    contradiction_count = metrics.get("unresolved_contradictions", 0)
    failure_rate = metrics.get("failure_rate", 0.0)

    memory_continuity = min(total_decisions / 50.0, 1.0)
    knowledge_distribution = max(0.0, 1.0 - (silo_count / max(metrics.get("total_persons", 1), 1)))
    decision_quality = max(0.0, 1.0 - failure_rate)
    contradiction_health = max(0.0, 1.0 - (contradiction_count / 10.0))

    raw = (
        0.2 * memory_continuity
        + 0.2 * knowledge_distribution
        + 0.15 * decision_quality
        + 0.15 * collaboration
        + 0.15 * velocity
        + 0.15 * contradiction_health
    )
    score = max(0.0, min(1.0, raw))

    consciousness = {
        "project_key": project_key,
        "score": score,
        "dimensions": {
            "memory_continuity": memory_continuity,
            "knowledge_distribution": knowledge_distribution,
            "decision_quality": decision_quality,
            "cross_team_collaboration": collaboration,
            "decision_velocity": velocity,
            "contradiction_health": contradiction_health,
        },
    }

    return {**state, "consciousness_score": consciousness}


async def persist_results(state: RiskScoringState) -> RiskScoringState:
    import sys
    _mod = sys.modules[__name__]
    try:
        graph = _graph
        scored: list[dict[str, Any]] = []
        for risk in state["risk_signals"]:
            node_id = await _mod.write_risk_node(graph, risk)
            scored.append({**risk, "node_id": node_id})
        state = {**state, "scored_risks": scored}
    except Exception as exc:
        state["errors"].append(f"persist_risks: {exc}")

    try:
        bq = _bq_client
        if bq is not None:
            _write_consciousness_to_bq(bq, state["consciousness_score"])
    except Exception as exc:
        state["errors"].append(f"persist_consciousness: {exc}")

    return state


def _write_consciousness_to_bq(bq: Any, consciousness: dict[str, Any]) -> None:
    import os
    from datetime import datetime, timezone

    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
    dataset = os.environ.get("BIGQUERY_DATASET", "nexusdrift")
    table = f"{project_id}.{dataset}.consciousness_scores"

    row = {
        "project_key": consciousness.get("project_key", ""),
        "score": consciousness.get("score", 0.0),
        "dimensions": str(consciousness.get("dimensions", {})),
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }
    bq.insert_rows_json(table, [row])


def _build_workflow() -> Any:
    if StateGraph is None:
        return None
    workflow = StateGraph(RiskScoringState)
    workflow.add_node("collect_graph_metrics", collect_graph_metrics)
    workflow.add_node("score_risks", score_risks)
    workflow.add_node("compute_consciousness_score", compute_consciousness_score)
    workflow.add_node("persist_results", persist_results)
    workflow.set_entry_point("collect_graph_metrics")
    workflow.add_edge("collect_graph_metrics", "score_risks")
    workflow.add_edge("score_risks", "compute_consciousness_score")
    workflow.add_edge("compute_consciousness_score", "persist_results")
    workflow.add_edge("persist_results", END)
    return workflow.compile()


risk_workflow = _build_workflow()


async def run_risk_forecasting(
    project_key: str,
    graph: Any,
    bq_client: Any = None,
) -> dict[str, Any]:
    global _graph, _bq_client
    _graph = graph
    _bq_client = bq_client

    if risk_workflow is None:
        return {"scored_risks": [], "consciousness_score": {}, "errors": []}

    initial_state: RiskScoringState = {
        "project_key": project_key,
        "graph_metrics": {},
        "risk_signals": [],
        "scored_risks": [],
        "consciousness_score": {},
        "errors": [],
    }
    result = await risk_workflow.ainvoke(initial_state)
    return {
        "scored_risks": result.get("scored_risks", []),
        "consciousness_score": result.get("consciousness_score", {}),
        "errors": result.get("errors", []),
    }
