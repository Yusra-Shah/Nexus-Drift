from __future__ import annotations

import os
from datetime import datetime
from typing import Any
from uuid import UUID

from edge_writer import EdgeWriter
from node_writer import NodeWriter
from shared.graph.neo4j_client import NexusDriftGraph
from shared.models.agent_events import GraphOperation, GraphUpdateEvent, ParsedEntityEvent
from shared.utils.logger import get_logger
from shared.utils.security import generate_trace_id

logger = get_logger("nexusdrift-graph-writer")

_AGENT_ID = "nexusdrift-graph-writer"


class GraphWriterService:
    def __init__(
        self,
        graph: NexusDriftGraph,
        node_writer: NodeWriter,
        edge_writer: EdgeWriter,
        publisher: Any,
    ) -> None:
        self._graph = graph
        self._nodes = node_writer
        self._edges = edge_writer
        self._publisher = publisher
        self._updates_topic = self._make_topic_path()

    def _make_topic_path(self) -> str:
        try:
            from google.cloud import pubsub_v1

            project = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
            topic = os.environ.get("PUBSUB_TOPIC_GRAPH_UPDATES", "nexusdrift-graph-updates")
            return pubsub_v1.PublisherClient().topic_path(project, topic)
        except Exception:
            return ""

    async def process_parsed_event(self, event: ParsedEntityEvent) -> dict[str, Any]:
        trace_id = generate_trace_id()
        written_decisions: list[str] = []
        written_persons: list[str] = []
        written_concepts: list[str] = []
        edges_created = 0

        # Step 1: Write Artifact node
        artifact_id = await self._nodes.write_artifact(event)

        # Step 2: Write Decision nodes
        for d in event.decisions:
            node_id = await self._nodes.write_decision(d)
            written_decisions.append(node_id)

        # Step 3: Write Person nodes
        for p in event.persons:
            node_id = await self._nodes.write_person(p)
            written_persons.append(node_id)

        # Step 4: Write Concept nodes
        for c in event.concepts:
            node_id = await self._nodes.write_concept(c)
            written_concepts.append(node_id)

        # Step 5: Write edges
        for decision_id in written_decisions:
            await self._edges.link_decision_to_artifact(
                decision_id, artifact_id, _AGENT_ID, 1.0
            )
            edges_created += 1

        for person_id in written_persons:
            await self._edges.link_person_to_artifact(person_id, artifact_id, _AGENT_ID)
            edges_created += 1

        for concept_id in written_concepts:
            await self._edges.link_concept_to_artifact(
                concept_id, artifact_id, _AGENT_ID, 1.0
            )
            edges_created += 1

        for decision_id in written_decisions:
            await self._edges.attempt_decision_links(
                decision_id,
                written_persons,
                written_concepts,
                _AGENT_ID,
                artifact_id,
            )
            edges_created += len(written_persons) + len(written_concepts)
            edges_created += len(written_persons) * len(written_concepts)

        # Step 6: Publish GraphUpdateEvent for each new Decision
        for decision_id in written_decisions:
            self._publish_graph_update(decision_id)

        # Step 7: Write Firestore execution record
        self._write_execution_record(trace_id, event, written_decisions, written_persons, written_concepts)

        return {
            "written_decisions": len(written_decisions),
            "written_persons": len(written_persons),
            "written_concepts": len(written_concepts),
            "edges_created": edges_created,
        }

    def _publish_graph_update(self, decision_id: str) -> None:
        try:
            update_event = GraphUpdateEvent(
                operation=GraphOperation.node_created,
                node_type="Decision",
                node_id=UUID(decision_id),
                agent_id=_AGENT_ID,
            )
            self._publisher.publish(
                self._updates_topic,
                update_event.model_dump_json().encode("utf-8"),
            )
        except Exception as exc:
            logger.warning("Failed to publish graph update for %s: %s", decision_id, exc)

    def _write_execution_record(
        self,
        trace_id: str,
        event: ParsedEntityEvent,
        decisions: list[str],
        persons: list[str],
        concepts: list[str],
    ) -> None:
        try:
            from google.cloud import firestore

            project_id = os.environ.get(
                "FIRESTORE_PROJECT_ID",
                os.environ.get("GOOGLE_CLOUD_PROJECT", ""),
            )
            fs = firestore.Client(project=project_id)
            fs.collection("agent_state").document(
                f"nexusdrift-graph-writer-{trace_id[:8]}"
            ).set(
                {
                    "agent_name": "nexusdrift-graph-writer",
                    "status": "success",
                    "trace_id": trace_id,
                    "artifact_id": str(event.artifact_id),
                    "decisions_written": len(decisions),
                    "persons_written": len(persons),
                    "concepts_written": len(concepts),
                    "completed_at": datetime.utcnow().isoformat(),
                }
            )
        except Exception as exc:
            logger.warning("Failed to write execution record: %s", exc)
