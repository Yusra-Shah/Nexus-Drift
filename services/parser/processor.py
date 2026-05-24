from __future__ import annotations

from uuid import uuid4

from embedding_client import EmbeddingClient
from gemini_client import GeminiParserClient
from shared.graph.pinecone_client import NexusDriftVectors
from shared.models.agent_events import ParsedEntityEvent, RawArtifactEvent
from shared.utils.logger import get_logger

logger = get_logger("nexusdrift-parser")


class ArtifactProcessor:
    def __init__(
        self,
        gemini_client: GeminiParserClient,
        embedding_client: EmbeddingClient,
        vectors: NexusDriftVectors,
    ) -> None:
        self._gemini = gemini_client
        self._embedding = embedding_client
        self._vectors = vectors

    async def process(self, event: RawArtifactEvent) -> ParsedEntityEvent:
        parsed = await self._gemini.parse_artifact(event)

        decisions_out = []
        for decision in parsed.decisions:
            decision_id = str(uuid4())
            embed_text = f"{decision.title} {decision.content}"
            vector = await self._embedding.embed_text(embed_text)
            self._vectors.upsert_embedding(
                decision_id,
                vector,
                metadata={
                    "node_type": "Decision",
                    "title": decision.title,
                    "decision_type": decision.decision_type,
                    "source": event.source.value,
                },
            )
            decisions_out.append(
                {
                    "id": decision_id,
                    "title": decision.title,
                    "content": decision.content,
                    "decision_type": decision.decision_type,
                    "outcome": decision.outcome,
                    "confidence": decision.confidence,
                    "embedding_id": decision_id,
                    "source": event.source.value,
                    "artifact_type": event.metadata.get("artifact_type", "unknown"),
                }
            )

        persons_out = []
        for person in parsed.persons:
            person_id = str(uuid4())
            embed_text = f"{person.name} {' '.join(person.expertise_signals)}"
            vector = await self._embedding.embed_text(embed_text)
            self._vectors.upsert_embedding(
                person_id,
                vector,
                metadata={"node_type": "Person", "name": person.name},
            )
            persons_out.append(
                {
                    "id": person_id,
                    "name": person.name,
                    "role": person.role,
                    "expertise_domains": person.expertise_signals,
                    "embedding_id": person_id,
                }
            )

        concepts_out = []
        for concept in parsed.concepts:
            concept_id = str(uuid4())
            embed_text = f"{concept.label} {concept.domain}"
            vector = await self._embedding.embed_text(embed_text)
            self._vectors.upsert_embedding(
                concept_id,
                vector,
                metadata={
                    "node_type": "Concept",
                    "label": concept.label,
                    "domain": concept.domain,
                },
            )
            concepts_out.append(
                {
                    "id": concept_id,
                    "label": concept.label,
                    "domain": concept.domain,
                    "embedding_id": concept_id,
                }
            )

        return ParsedEntityEvent(
            artifact_id=event.artifact_id,
            decisions=decisions_out,
            persons=persons_out,
            concepts=concepts_out,
            agent_id="nexusdrift-parser",
        )
