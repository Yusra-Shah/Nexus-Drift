from __future__ import annotations

from datetime import datetime

from shared.graph.neo4j_client import NexusDriftGraph
from shared.utils.logger import get_logger

logger = get_logger("nexusdrift-graph-writer")

_AGENT_ID = "nexusdrift-graph-writer"


class EdgeWriter:
    def __init__(self, graph: NexusDriftGraph) -> None:
        self._graph = graph

    async def link_decision_to_artifact(
        self,
        decision_id: str,
        artifact_id: str,
        agent_id: str,
        confidence: float,
    ) -> None:
        await self._graph.create_edge(
            artifact_id,
            "REFERENCES",
            decision_id,
            {
                "created_at": datetime.utcnow().isoformat(),
                "confidence": confidence,
                "source_artifact_id": artifact_id,
                "agent_id": agent_id,
            },
        )

    async def link_concept_to_artifact(
        self,
        concept_id: str,
        artifact_id: str,
        agent_id: str,
        confidence: float,
    ) -> None:
        await self._graph.create_edge(
            artifact_id,
            "REFERENCES",
            concept_id,
            {
                "created_at": datetime.utcnow().isoformat(),
                "confidence": confidence,
                "source_artifact_id": artifact_id,
                "agent_id": agent_id,
            },
        )

    async def link_person_to_artifact(
        self,
        person_id: str,
        artifact_id: str,
        agent_id: str,
    ) -> None:
        await self._graph.create_edge(
            artifact_id,
            "AUTHORED_BY",
            person_id,
            {
                "created_at": datetime.utcnow().isoformat(),
                "confidence": 1.0,
                "source_artifact_id": artifact_id,
                "agent_id": agent_id,
            },
        )

    async def link_person_expertise(
        self,
        person_id: str,
        concept_id: str,
        agent_id: str,
        confidence: float,
    ) -> None:
        # MERGE so we don't duplicate; update confidence to max(existing, new)
        cypher = (
            "MATCH (p:Person {id: $person_id}), (c:Concept {id: $concept_id}) "
            "MERGE (p)-[r:HAS_EXPERTISE_IN]->(c) "
            "ON CREATE SET r.confidence = $confidence, r.created_at = $created_at, r.agent_id = $agent_id "
            "ON MATCH SET r.confidence = CASE WHEN r.confidence > $confidence THEN r.confidence ELSE $confidence END"
        )
        await self._graph.execute_query(
            cypher,
            {
                "person_id": person_id,
                "concept_id": concept_id,
                "confidence": confidence,
                "created_at": datetime.utcnow().isoformat(),
                "agent_id": agent_id,
            },
        )

    async def attempt_decision_links(
        self,
        decision_id: str,
        person_ids: list[str],
        concept_ids: list[str],
        agent_id: str,
        artifact_id: str,
    ) -> None:
        now = datetime.utcnow().isoformat()

        # MADE_BY: inferred, confidence 0.6
        for person_id in person_ids:
            await self._graph.create_edge(
                decision_id,
                "MADE_BY",
                person_id,
                {
                    "created_at": now,
                    "confidence": 0.6,
                    "source_artifact_id": artifact_id,
                    "agent_id": agent_id,
                },
            )

        # Decision REFERENCES each concept
        for concept_id in concept_ids:
            await self._graph.create_edge(
                decision_id,
                "REFERENCES",
                concept_id,
                {
                    "created_at": now,
                    "confidence": 0.8,
                    "source_artifact_id": artifact_id,
                    "agent_id": agent_id,
                },
            )

        # HAS_EXPERTISE_IN: every person × every concept from same artifact
        for person_id in person_ids:
            for concept_id in concept_ids:
                await self.link_person_expertise(person_id, concept_id, agent_id, 0.6)
