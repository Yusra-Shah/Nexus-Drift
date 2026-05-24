from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import uuid4

from shared.graph.neo4j_client import NexusDriftGraph
from shared.models.agent_events import ParsedEntityEvent
from shared.utils.logger import get_logger

logger = get_logger("nexusdrift-graph-writer")


class NodeWriter:
    def __init__(self, graph: NexusDriftGraph) -> None:
        self._graph = graph

    async def write_decision(self, decision_dict: dict[str, Any]) -> str:
        title = decision_dict.get("title", "")
        # Fuzzy dedup: match exact title
        rows = await self._graph.execute_query(
            "MATCH (n:Decision) WHERE n.title = $title RETURN n.id AS id, n.outcome AS outcome LIMIT 1",
            {"title": title},
        )
        if rows:
            existing_id = rows[0]["id"]
            existing_outcome = rows[0]["outcome"]
            new_outcome = decision_dict.get("outcome", "unknown")
            if existing_outcome != new_outcome:
                await self._graph.update_node(
                    existing_id,
                    {
                        "outcome": new_outcome,
                        "confidence": decision_dict.get("confidence", 1.0),
                    },
                )
            return existing_id

        node_id = decision_dict.get("id") or str(uuid4())
        props: dict[str, Any] = {
            "id": node_id,
            "title": title,
            "content": decision_dict.get("content", ""),
            "decision_type": decision_dict.get("decision_type", "technical"),
            "outcome": decision_dict.get("outcome", "unknown"),
            "confidence": decision_dict.get("confidence", 1.0),
            "embedding_id": decision_dict.get("embedding_id", ""),
            "created_at": datetime.utcnow().isoformat(),
            "context_snapshot": {},
        }
        await self._graph.create_node("Decision", props)
        return node_id

    async def write_person(self, person_dict: dict[str, Any]) -> str:
        name = person_dict.get("name", "")
        rows = await self._graph.execute_query(
            "MATCH (n:Person) WHERE toLower(n.name) = toLower($name) RETURN n.id AS id, n.expertise_domains AS domains LIMIT 1",
            {"name": name},
        )
        if rows:
            existing_id = rows[0]["id"]
            existing_domains: list[str] = rows[0].get("domains") or []
            new_domains: list[str] = person_dict.get("expertise_domains", [])
            merged = list({*existing_domains, *new_domains})
            activity = min(1.0, (person_dict.get("activity_score", 0.0) or 0.0) + 0.05)
            await self._graph.update_node(
                existing_id,
                {"expertise_domains": merged, "activity_score": activity},
            )
            return existing_id

        node_id = person_dict.get("id") or str(uuid4())
        props: dict[str, Any] = {
            "id": node_id,
            "name": name,
            "role": person_dict.get("role", "unknown"),
            "team": person_dict.get("team", "unknown"),
            "expertise_domains": person_dict.get("expertise_domains", []),
            "tenure_months": person_dict.get("tenure_months", 0),
            "activity_score": person_dict.get("activity_score", 0.0),
            "embedding_id": person_dict.get("embedding_id", ""),
        }
        await self._graph.create_node("Person", props)
        return node_id

    async def write_concept(self, concept_dict: dict[str, Any]) -> str:
        label = concept_dict.get("label", "").lower()
        rows = await self._graph.execute_query(
            "MATCH (n:Concept) WHERE toLower(n.label) = $label RETURN n.id AS id LIMIT 1",
            {"label": label},
        )
        if rows:
            existing_id = rows[0]["id"]
            await self._graph.update_node(
                existing_id,
                {
                    "importance_score": min(1.0, concept_dict.get("importance_score", 0.5)),
                    "last_referenced": datetime.utcnow().isoformat(),
                },
            )
            return existing_id

        node_id = concept_dict.get("id") or str(uuid4())
        props: dict[str, Any] = {
            "id": node_id,
            "label": label,
            "domain": concept_dict.get("domain", "backend"),
            "importance_score": concept_dict.get("importance_score", 0.5),
            "last_referenced": datetime.utcnow().isoformat(),
            "embedding_id": concept_dict.get("embedding_id", ""),
        }
        await self._graph.create_node("Concept", props)
        return node_id

    async def write_artifact(self, event: ParsedEntityEvent) -> str:
        node_id = str(event.artifact_id)
        props: dict[str, Any] = {
            "id": node_id,
            "source": "unknown",
            "artifact_type": "document",
            "raw_url": "",
            "processed_at": datetime.utcnow().isoformat(),
            "entities_extracted": (
                len(event.decisions) + len(event.persons) + len(event.concepts)
            ),
        }
        # Infer source from first decision if available
        if event.decisions:
            props["source"] = event.decisions[0].get("source", "unknown")
            props["artifact_type"] = event.decisions[0].get("artifact_type", "document")
        await self._graph.create_node("Artifact", props)
        return node_id
