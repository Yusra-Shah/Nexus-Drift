from __future__ import annotations

import logging
from datetime import datetime
from typing import Any
from uuid import uuid4

from shared.models.agent_events import AlertEvent
from shared.models.graph_nodes import Severity
from shared.utils.pubsub import publish_message

from metrics import collect_all_metrics

logger = logging.getLogger(__name__)


def _clamp(value: float) -> float:
    return max(0.0, min(100.0, value))


def _knowledge_coherence(m: dict[str, int]) -> float:
    concepts = m.get("concept_count", 0)
    connected = m.get("connected_concept_count", 0)
    connectivity = connected / max(concepts, 1)
    depth = min(concepts / 20.0, 1.0)
    return _clamp((connectivity * 0.6 + depth * 0.4) * 100)


def _decision_consistency(m: dict[str, int]) -> float:
    decisions = m.get("decision_count", 0)
    with_outcome = m.get("decision_with_outcome_count", 0)
    contradictions = m.get("contradictions_count", 0)
    outcome_ratio = with_outcome / max(decisions, 1)
    penalty = min(contradictions / max(decisions, 1), 0.5)
    return _clamp((outcome_ratio - penalty) * 100)


def _expertise_distribution(m: dict[str, int]) -> float:
    persons = m.get("person_count", 0)
    edges = m.get("expertise_edge_count", 0)
    multi = m.get("multi_expert_concept_count", 0)
    concepts = m.get("concept_count", 0)
    breadth = min(edges / max(persons * 2, 1), 1.0)
    depth = multi / max(concepts, 1)
    return _clamp((breadth * 0.5 + depth * 0.5) * 100)


def _memory_completeness(m: dict[str, int]) -> float:
    artifacts = m.get("artifact_count", 0)
    with_source = m.get("artifact_with_source_count", 0)
    total_nodes = m.get("total_nodes", 0)
    source_ratio = with_source / max(artifacts, 1)
    coverage = min(total_nodes / 50.0, 1.0)
    return _clamp((source_ratio * 0.5 + coverage * 0.5) * 100)


def _learning_velocity(m: dict[str, int]) -> float:
    recent = m.get("recent_node_count", 0)
    return _clamp(min(recent / 10.0, 1.0) * 100)


def _risk_awareness(m: dict[str, int]) -> float:
    risks = m.get("risk_count", 0)
    if risks == 0:
        return 0.0
    high = m.get("high_severity_risk_count", 0)
    severity_ratio = high / risks
    volume = min(risks / 5.0, 1.0)
    return _clamp((severity_ratio * 0.4 + volume * 0.6) * 100)


class OrgConsciousnessScorer:
    async def compute_score(self, metrics: dict[str, int]) -> dict[str, Any]:
        knowledge_coherence = _knowledge_coherence(metrics)
        decision_consistency = _decision_consistency(metrics)
        expertise_distribution = _expertise_distribution(metrics)
        memory_completeness = _memory_completeness(metrics)
        learning_velocity = _learning_velocity(metrics)
        risk_awareness = _risk_awareness(metrics)

        weighted_sum = (
            knowledge_coherence * 0.25
            + decision_consistency * 0.20
            + expertise_distribution * 0.20
            + memory_completeness * 0.15
            + learning_velocity * 0.10
            + risk_awareness * 0.10
        )
        overall = round(max(0, min(100, weighted_sum)), 2)

        return {
            "score_id": str(uuid4()),
            "overall_score": overall,
            "dimensions": {
                "knowledge_coherence": round(knowledge_coherence, 2),
                "decision_consistency": round(decision_consistency, 2),
                "expertise_distribution": round(expertise_distribution, 2),
                "memory_completeness": round(memory_completeness, 2),
                "learning_velocity": round(learning_velocity, 2),
                "risk_awareness": round(risk_awareness, 2),
            },
            "metrics": metrics,
            "computed_at": datetime.utcnow().isoformat() + "Z",
        }

    async def persist_score(
        self,
        result: dict[str, Any],
        firestore: Any,
        bigquery: Any,
        bigquery_table_id: str,
        publisher: Any,
        alerts_topic: str,
    ) -> None:
        try:
            firestore.collection("consciousness_scores").document("latest").set(result)
            logger.info("Firestore updated: consciousness_scores/latest")
        except Exception as exc:
            logger.warning("Firestore persist failed: %s", exc)

        try:
            row = {
                "score_id": result["score_id"],
                "overall_score": result["overall_score"],
                "computed_at": result["computed_at"],
                **{f"dim_{k}": v for k, v in result["dimensions"].items()},
            }
            errors = bigquery.insert_rows_json(bigquery_table_id, [row])
            if errors:
                logger.warning("BigQuery insert errors: %s", errors)
        except Exception as exc:
            logger.warning("BigQuery persist failed: %s", exc)

        if result["overall_score"] < 50.0:
            try:
                alert = AlertEvent(
                    severity=Severity.high,
                    alert_type="consciousness_score_degraded",
                    explanation=(
                        f"Org consciousness score dropped to {result['overall_score']} "
                        f"(threshold: 50.0)"
                    ),
                )
                publish_message(alerts_topic, alert)
                logger.info("Alert dispatched: consciousness_score_degraded score=%s", result["overall_score"])
            except Exception as exc:
                logger.warning("Alert dispatch failed: %s", exc)

    async def run_cycle(
        self,
        graph: Any,
        firestore: Any,
        bigquery: Any,
        bigquery_table_id: str,
        publisher: Any,
        alerts_topic: str,
    ) -> dict[str, Any]:
        metrics = await collect_all_metrics(graph)
        result = await self.compute_score(metrics)
        await self.persist_score(result, firestore, bigquery, bigquery_table_id, publisher, alerts_topic)
        logger.info(
            "Scoring cycle complete: overall_score=%s score_id=%s",
            result["overall_score"],
            result["score_id"],
        )
        return result
