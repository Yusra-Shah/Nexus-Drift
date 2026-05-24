from __future__ import annotations

import asyncio
import json
import os
import signal

from dotenv import load_dotenv

from shared.utils.logger import get_logger
from shared.utils.security import generate_trace_id

if os.environ.get("ENVIRONMENT", "development") == "development":
    load_dotenv()

os.environ.setdefault("SERVICE_NAME", "nexusdrift-parser")
logger = get_logger("nexusdrift-parser")

_running = True


def _handle_sigterm(*_: object) -> None:
    global _running
    logger.info("SIGTERM received, shutting down")
    _running = False


signal.signal(signal.SIGTERM, _handle_sigterm)


def main() -> None:
    from google.cloud import firestore, pubsub_v1

    from embedding_client import EmbeddingClient
    from gemini_client import GeminiParserClient
    from processor import ArtifactProcessor
    from shared.graph.pinecone_client import NexusDriftVectors
    from shared.models.agent_events import ParsedEntityEvent, RawArtifactEvent

    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
    subscription_id = os.environ.get(
        "PUBSUB_SUBSCRIPTION_RAW_ARTIFACTS",
        "nexusdrift-raw-artifacts-parser-sub",
    )
    parsed_topic = os.environ.get(
        "PUBSUB_TOPIC_PARSED_ENTITIES", "nexusdrift-parsed-entities"
    )

    gemini = GeminiParserClient()
    embedding = EmbeddingClient()
    vectors = NexusDriftVectors()
    processor = ArtifactProcessor(gemini, embedding, vectors)

    publisher = pubsub_v1.PublisherClient()
    parsed_topic_path = publisher.topic_path(project_id, parsed_topic)

    fs = firestore.Client(
        project=os.environ.get("FIRESTORE_PROJECT_ID", project_id)
    )

    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    def callback(message: pubsub_v1.subscriber.message.Message) -> None:
        trace_id = generate_trace_id()
        try:
            raw = json.loads(message.data.decode("utf-8"))
            event = RawArtifactEvent.model_validate(raw)
            parsed_event: ParsedEntityEvent = asyncio.run(processor.process(event))
            publisher.publish(
                parsed_topic_path,
                parsed_event.model_dump_json().encode("utf-8"),
            )
            fs.collection("agent_state").document(f"nexusdrift-parser-{trace_id[:8]}").set(
                {
                    "agent_name": "nexusdrift-parser",
                    "status": "success",
                    "trace_id": trace_id,
                    "artifact_id": str(event.artifact_id),
                    "decisions_extracted": len(parsed_event.decisions),
                    "persons_extracted": len(parsed_event.persons),
                    "concepts_extracted": len(parsed_event.concepts),
                }
            )
            message.ack()
        except Exception as exc:
            logger.error("Processing failed trace_id=%s: %s", trace_id, exc)
            fs.collection("agent_state").document(f"nexusdrift-parser-{trace_id[:8]}").set(
                {
                    "agent_name": "nexusdrift-parser",
                    "status": "error",
                    "trace_id": trace_id,
                    "error_message": str(exc),
                }
            )
            message.nack()

    logger.info("nexusdrift-parser subscribing to %s", subscription_id)
    streaming_pull = subscriber.subscribe(
        subscription_path, callback=callback, flow_control=pubsub_v1.types.FlowControl(max_messages=5)
    )

    with subscriber:
        try:
            streaming_pull.result()
        except Exception as exc:
            logger.error("Streaming pull terminated: %s", exc)
            streaming_pull.cancel()


if __name__ == "__main__":
    main()
