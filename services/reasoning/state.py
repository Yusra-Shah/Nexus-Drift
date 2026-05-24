from __future__ import annotations

from typing import Any
from typing_extensions import TypedDict


class ReasoningState(TypedDict):
    node_ids: list[str]
    embeddings: dict[str, list[float]]
    candidate_pairs: list[tuple[str, str]]
    contradictions: list[dict[str, Any]]
    llm_verified: list[dict[str, Any]]
    errors: list[str]


class RiskScoringState(TypedDict):
    project_key: str
    graph_metrics: dict[str, Any]
    risk_signals: list[dict[str, Any]]
    scored_risks: list[dict[str, Any]]
    consciousness_score: dict[str, Any]
    errors: list[str]
