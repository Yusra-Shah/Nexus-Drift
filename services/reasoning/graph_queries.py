from __future__ import annotations

from typing import Any


async def fetch_recent_decision_ids(graph: Any, limit: int = 100) -> list[str]:
    rows = await graph.execute_query(
        "MATCH (n:Decision) RETURN n.id AS id ORDER BY n.created_at DESC LIMIT $limit",
        {"limit": limit},
    )
    return [r["id"] for r in rows if r.get("id")]


async def fetch_decision_node(graph: Any, node_id: str) -> dict[str, Any] | None:
    rows = await graph.execute_query(
        "MATCH (n:Decision {id: $id}) RETURN n",
        {"id": node_id},
    )
    if not rows:
        return None
    return rows[0].get("n", rows[0])


async def fetch_persons_for_project(graph: Any, project_key: str) -> list[dict[str, Any]]:
    rows = await graph.execute_query(
        """
        MATCH (p:Person)-[:MADE_BY|CONTRIBUTED_TO]->(d:Decision)
        WHERE d.project_key = $project_key
        RETURN p.id AS id, p.name AS name, p.expertise_domains AS domains
        """,
        {"project_key": project_key},
    )
    return list(rows)


async def fetch_decisions_for_project(graph: Any, project_key: str) -> list[dict[str, Any]]:
    rows = await graph.execute_query(
        """
        MATCH (d:Decision)
        WHERE d.project_key = $project_key
        RETURN d.id AS id, d.title AS title, d.outcome AS outcome,
               d.decision_type AS decision_type, d.created_at AS created_at
        ORDER BY d.created_at DESC
        """,
        {"project_key": project_key},
    )
    return list(rows)


async def fetch_failed_decisions(graph: Any, project_key: str) -> list[dict[str, Any]]:
    rows = await graph.execute_query(
        """
        MATCH (d:Decision {outcome: 'failure'})
        WHERE d.project_key = $project_key
        RETURN d.id AS id, d.title AS title, d.decision_type AS decision_type,
               d.created_at AS created_at
        ORDER BY d.created_at DESC
        """,
        {"project_key": project_key},
    )
    return list(rows)


async def fetch_concept_coverage(graph: Any, project_key: str) -> list[dict[str, Any]]:
    rows = await graph.execute_query(
        """
        MATCH (c:Concept)<-[:REFERENCES]-(d:Decision)
        WHERE d.project_key = $project_key
        RETURN c.label AS label, c.domain AS domain,
               count(d) AS decision_count, c.importance_score AS importance_score
        ORDER BY decision_count DESC
        """,
        {"project_key": project_key},
    )
    return list(rows)


async def fetch_knowledge_silos(graph: Any) -> list[dict[str, Any]]:
    rows = await graph.execute_query(
        """
        MATCH (p:Person)
        WHERE NOT (p)-[:HAS_EXPERTISE_IN]->(:Concept)
              OR size((p)-[:MADE_BY|CONTRIBUTED_TO]->(:Decision)) <= 1
        RETURN p.id AS id, p.name AS name, p.expertise_domains AS domains
        """,
        {},
    )
    return list(rows)


async def fetch_cross_team_collaboration(graph: Any) -> float:
    rows = await graph.execute_query(
        """
        MATCH (p1:Person)-[:MADE_BY]->(d:Decision)<-[:MADE_BY]-(p2:Person)
        WHERE p1.id <> p2.id AND p1.team <> p2.team
        WITH count(DISTINCT d) AS cross_team_decisions
        MATCH (d2:Decision)
        WITH cross_team_decisions, count(d2) AS total_decisions
        RETURN CASE WHEN total_decisions = 0 THEN 0.0
                    ELSE toFloat(cross_team_decisions) / total_decisions END AS score
        """,
        {},
    )
    if rows:
        return float(rows[0].get("score", 0.0))
    return 0.0


async def fetch_decision_velocity(graph: Any, project_key: str, days: int = 30) -> float:
    rows = await graph.execute_query(
        """
        MATCH (d:Decision)
        WHERE d.project_key = $project_key
          AND d.created_at >= datetime() - duration({days: $days})
        RETURN count(d) AS count
        """,
        {"project_key": project_key, "days": days},
    )
    if rows:
        raw = float(rows[0].get("count", 0))
        return min(raw / 10.0, 1.0)
    return 0.0


async def fetch_unresolved_contradictions(graph: Any, project_key: str) -> list[dict[str, Any]]:
    rows = await graph.execute_query(
        """
        MATCH (c:Contradiction {resolved: false})
        WHERE c.project_key = $project_key
        RETURN c.id AS id, c.severity AS severity, c.contradiction_type AS contradiction_type,
               c.node_a_id AS node_a_id, c.node_b_id AS node_b_id
        """,
        {"project_key": project_key},
    )
    return list(rows)


async def write_contradiction_node(graph: Any, contradiction: dict[str, Any]) -> str:
    rows = await graph.execute_query(
        """
        CREATE (c:Contradiction {
            id: $id,
            node_a_id: $node_a_id,
            node_b_id: $node_b_id,
            contradiction_type: $contradiction_type,
            severity: $severity,
            explanation: $explanation,
            detected_at: datetime(),
            resolved: false,
            project_key: $project_key
        })
        RETURN c.id AS id
        """,
        contradiction,
    )
    if rows:
        return rows[0]["id"]
    return contradiction.get("id", "")


async def write_risk_node(graph: Any, risk: dict[str, Any]) -> str:
    rows = await graph.execute_query(
        """
        CREATE (r:Risk {
            id: $id,
            risk_type: $risk_type,
            severity: $severity,
            score: $score,
            predicted_at: datetime(),
            evidence_node_ids: $evidence_node_ids,
            resolved: false,
            project_key: $project_key
        })
        RETURN r.id AS id
        """,
        risk,
    )
    if rows:
        return rows[0]["id"]
    return risk.get("id", "")
