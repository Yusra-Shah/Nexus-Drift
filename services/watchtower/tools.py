from __future__ import annotations

import os
from typing import Any
from uuid import uuid4
from datetime import datetime, timezone

try:
    from google.adk.agents import tool
except ImportError:
    def tool(fn):  # type: ignore[misc]
        return fn

_graph: Any = None
_publisher: Any = None
_firestore: Any = None


def _get_alerts_topic() -> str:
    return os.environ.get("PUBSUB_TOPIC_ALERTS", "nexusdrift-alerts")


@tool
async def query_recent_decisions(limit: int = 20) -> list[dict[str, Any]]:
    """Return the most recent Decision nodes from the knowledge graph."""
    if _graph is None:
        return []
    rows = await _graph.execute_query(
        "MATCH (d:Decision) RETURN d.id AS id, d.title AS title, "
        "d.outcome AS outcome, d.decision_type AS decision_type, "
        "d.created_at AS created_at ORDER BY d.created_at DESC LIMIT $limit",
        {"limit": limit},
    )
    return list(rows)


@tool
async def query_unresolved_risks(severity: str = "high") -> list[dict[str, Any]]:
    """Return unresolved Risk nodes at or above the specified severity."""
    if _graph is None:
        return []
    severity_order = {"low": 0, "medium": 1, "high": 2, "critical": 3}
    min_level = severity_order.get(severity.lower(), 2)
    allowed = [k for k, v in severity_order.items() if v >= min_level]
    rows = await _graph.execute_query(
        "MATCH (r:Risk {resolved: false}) WHERE r.severity IN $allowed "
        "RETURN r.id AS id, r.risk_type AS risk_type, r.severity AS severity, "
        "r.score AS score, r.predicted_at AS predicted_at",
        {"allowed": allowed},
    )
    return list(rows)


@tool
async def query_knowledge_gaps() -> list[dict[str, Any]]:
    """Return persons who are potential knowledge silos."""
    if _graph is None:
        return []
    rows = await _graph.execute_query(
        """
        MATCH (p:Person)
        OPTIONAL MATCH (p)-[:HAS_EXPERTISE_IN]->(c:Concept)
        WITH p, count(c) AS expertise_count
        WHERE expertise_count <= 1
        RETURN p.id AS id, p.name AS name, expertise_count
        ORDER BY expertise_count ASC
        LIMIT 10
        """,
        {},
    )
    return list(rows)


@tool
async def query_contradictions(resolved: bool = False) -> list[dict[str, Any]]:
    """Return Contradiction nodes filtered by resolved status."""
    if _graph is None:
        return []
    rows = await _graph.execute_query(
        "MATCH (c:Contradiction {resolved: $resolved}) "
        "RETURN c.id AS id, c.contradiction_type AS contradiction_type, "
        "c.severity AS severity, c.explanation AS explanation, "
        "c.detected_at AS detected_at",
        {"resolved": resolved},
    )
    return list(rows)


@tool
async def dispatch_alert(
    alert_type: str,
    severity: str,
    explanation: str,
    evidence_node_ids: list[str] | None = None,
) -> str:
    """Dispatch an alert to the Pub/Sub alerts topic and persist to Firestore."""
    from shared.models.agent_events import AlertEvent
    from shared.models.graph_nodes import Severity

    alert_id = str(uuid4())
    try:
        sev = Severity(severity.lower())
    except ValueError:
        sev = Severity.medium

    event = AlertEvent(
        alert_id=alert_id,  # type: ignore[arg-type]
        severity=sev,
        alert_type=alert_type,
        explanation=explanation,
        evidence_node_ids=evidence_node_ids or [],
    )

    if _publisher is not None:
        try:
            from google.cloud import pubsub_v1

            project = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
            topic = _get_alerts_topic()
            publisher = pubsub_v1.PublisherClient()
            topic_path = publisher.topic_path(project, topic)
            publisher.publish(topic_path, event.model_dump_json().encode("utf-8"))
        except Exception:
            pass

    if _firestore is not None:
        try:
            _firestore.collection("alerts").document(alert_id).set(
                {
                    "alert_id": alert_id,
                    "alert_type": alert_type,
                    "severity": severity,
                    "explanation": explanation,
                    "evidence_node_ids": evidence_node_ids or [],
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            )
        except Exception:
            pass

    return alert_id


@tool
async def compute_org_health_summary() -> dict[str, Any]:
    """Compute a high-level organizational health summary from graph metrics."""
    if _graph is None:
        return {"status": "unavailable"}

    try:
        rows = await _graph.execute_query(
            """
            MATCH (d:Decision) WITH count(d) AS total_decisions
            MATCH (r:Risk {resolved: false}) WITH total_decisions, count(r) AS open_risks
            MATCH (c:Contradiction {resolved: false}) WITH total_decisions, open_risks, count(c) AS open_contradictions
            RETURN total_decisions, open_risks, open_contradictions
            """,
            {},
        )
        if rows:
            row = rows[0]
            health_score = max(
                0.0,
                1.0
                - (row.get("open_risks", 0) * 0.05)
                - (row.get("open_contradictions", 0) * 0.1),
            )
            return {
                "total_decisions": row.get("total_decisions", 0),
                "open_risks": row.get("open_risks", 0),
                "open_contradictions": row.get("open_contradictions", 0),
                "health_score": round(health_score, 3),
            }
    except Exception:
        pass
    return {"status": "error"}


@tool
async def mark_risk_resolved(risk_id: str) -> bool:
    """Mark a Risk node as resolved in the knowledge graph."""
    if _graph is None:
        return False
    try:
        await _graph.execute_query(
            "MATCH (r:Risk {id: $id}) SET r.resolved = true, r.resolved_at = datetime()",
            {"id": risk_id},
        )
        return True
    except Exception:
        return False
