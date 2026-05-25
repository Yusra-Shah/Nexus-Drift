from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

_QUERIES: list[tuple[str, str]] = [
    ("total_nodes", "MATCH (n) RETURN count(n) AS value"),
    ("total_relationships", "MATCH ()-[r]->() RETURN count(r) AS value"),
    ("concept_count", "MATCH (n:Concept) RETURN count(n) AS value"),
    (
        "connected_concept_count",
        "MATCH (n:Concept)--() RETURN count(DISTINCT n) AS value",
    ),
    ("decision_count", "MATCH (n:Decision) RETURN count(n) AS value"),
    (
        "decision_with_outcome_count",
        "MATCH (n:Decision) WHERE n.outcome IS NOT NULL RETURN count(n) AS value",
    ),
    ("contradictions_count", "MATCH (n:Contradiction) RETURN count(n) AS value"),
    ("person_count", "MATCH (n:Person) RETURN count(n) AS value"),
    (
        "expertise_edge_count",
        "MATCH ()-[r:HAS_EXPERTISE_IN]->() RETURN count(r) AS value",
    ),
    (
        "multi_expert_concept_count",
        (
            "MATCH (c:Concept)<-[:HAS_EXPERTISE_IN]-() "
            "WITH c, count(*) AS experts WHERE experts > 1 "
            "RETURN count(c) AS value"
        ),
    ),
    ("artifact_count", "MATCH (n:Artifact) RETURN count(n) AS value"),
    (
        "artifact_with_source_count",
        "MATCH (n:Artifact) WHERE n.source IS NOT NULL RETURN count(n) AS value",
    ),
    (
        "recent_node_count",
        (
            "MATCH (n) WHERE n.created_at >= datetime() - duration('P30D') "
            "RETURN count(n) AS value"
        ),
    ),
    ("risk_count", "MATCH (n:Risk) RETURN count(n) AS value"),
    (
        "high_severity_risk_count",
        "MATCH (n:Risk) WHERE n.severity = 'high' RETURN count(n) AS value",
    ),
]


async def collect_all_metrics(graph: Any) -> dict[str, int]:
    results: dict[str, int] = {}
    for metric_name, cypher in _QUERIES:
        try:
            rows = await graph.execute_query(cypher)
            results[metric_name] = int(rows[0]["value"]) if rows else 0
        except Exception as exc:
            logger.warning("Metric query '%s' failed: %s", metric_name, exc)
            results[metric_name] = 0
    return results
