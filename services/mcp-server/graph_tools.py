from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

_graph: Any = None
_firestore: Any = None


def init(graph: Any, firestore: Any) -> None:
    global _graph, _firestore
    _graph = graph
    _firestore = firestore


async def get_recent_decisions(limit: int = 10) -> list[dict[str, Any]]:
    cypher = (
        "MATCH (d:Decision) "
        "RETURN d ORDER BY d.created_at DESC LIMIT $limit"
    )
    rows = await _graph.execute_query(cypher, {"limit": limit})
    return [dict(r["d"]) for r in rows]


async def get_person_expertise(person_id: str) -> dict[str, Any]:
    cypher = (
        "MATCH (p:Person {id: $id})-[:HAS_EXPERTISE_IN]->(c:Concept) "
        "RETURN p, collect(c) AS concepts"
    )
    rows = await _graph.execute_query(cypher, {"id": person_id})
    if not rows:
        return {}
    row = rows[0]
    return {
        "person": dict(row["p"]),
        "concepts": [dict(c) for c in row["concepts"]],
    }


async def get_active_risks(severity: str | None = None) -> list[dict[str, Any]]:
    if severity:
        cypher = "MATCH (r:Risk) WHERE r.severity = $severity RETURN r"
        rows = await _graph.execute_query(cypher, {"severity": severity})
    else:
        cypher = "MATCH (r:Risk) RETURN r"
        rows = await _graph.execute_query(cypher)
    return [dict(r["r"]) for r in rows]


async def get_concept_graph(concept_id: str, depth: int = 2) -> dict[str, Any]:
    cypher = (
        "MATCH path = (c:Concept {id: $id})-[*1..$depth]-(related) "
        "RETURN c, collect(DISTINCT related) AS neighbors"
    )
    rows = await _graph.execute_query(cypher, {"id": concept_id, "depth": depth})
    if not rows:
        return {}
    row = rows[0]
    return {
        "concept": dict(row["c"]),
        "neighbors": [dict(n) for n in row["neighbors"]],
    }


async def get_contradictions(limit: int = 20) -> list[dict[str, Any]]:
    cypher = (
        "MATCH (c:Contradiction) "
        "RETURN c ORDER BY c.created_at DESC LIMIT $limit"
    )
    rows = await _graph.execute_query(cypher, {"limit": limit})
    return [dict(r["c"]) for r in rows]


async def get_consciousness_score() -> dict[str, Any]:
    doc = _firestore.collection("consciousness_scores").document("latest").get()
    if doc.exists:
        return doc.to_dict() or {}
    return {}


async def get_org_summary() -> dict[str, Any]:
    counts_cypher = (
        "MATCH (n) "
        "RETURN labels(n)[0] AS label, count(n) AS count"
    )
    rows = await _graph.execute_query(counts_cypher)
    node_counts = {r["label"]: r["count"] for r in rows if r.get("label")}

    rel_cypher = "MATCH ()-[r]->() RETURN type(r) AS rel_type, count(r) AS count"
    rel_rows = await _graph.execute_query(rel_cypher)
    rel_counts = {r["rel_type"]: r["count"] for r in rel_rows if r.get("rel_type")}

    return {
        "node_counts": node_counts,
        "relationship_counts": rel_counts,
        "total_nodes": sum(node_counts.values()),
        "total_relationships": sum(rel_counts.values()),
    }


async def find_decision_path(from_decision_id: str, to_decision_id: str) -> list[dict[str, Any]]:
    cypher = (
        "MATCH path = shortestPath("
        "(a:Decision {id: $from_id})-[*]-(b:Decision {id: $to_id})"
        ") RETURN [n IN nodes(path) | properties(n)] AS path_nodes"
    )
    rows = await _graph.execute_query(
        cypher, {"from_id": from_decision_id, "to_id": to_decision_id}
    )
    if not rows:
        return []
    return rows[0]["path_nodes"]


async def search_nodes(query: str, node_type: str | None = None, limit: int = 20) -> list[dict[str, Any]]:
    if node_type:
        cypher = (
            f"MATCH (n:{node_type}) "
            "WHERE toLower(n.title) CONTAINS toLower($query) "
            "   OR toLower(n.name) CONTAINS toLower($query) "
            "   OR toLower(n.description) CONTAINS toLower($query) "
            "RETURN n LIMIT $limit"
        )
    else:
        cypher = (
            "MATCH (n) "
            "WHERE toLower(coalesce(n.title, '')) CONTAINS toLower($query) "
            "   OR toLower(coalesce(n.name, '')) CONTAINS toLower($query) "
            "   OR toLower(coalesce(n.description, '')) CONTAINS toLower($query) "
            "RETURN n LIMIT $limit"
        )
    rows = await _graph.execute_query(cypher, {"query": query, "limit": limit})
    return [dict(r["n"]) for r in rows]
