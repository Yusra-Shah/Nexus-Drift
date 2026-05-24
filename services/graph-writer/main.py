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

os.environ.setdefault("SERVICE_NAME", "nexusdrift-graph-writer")
logger = get_logger("nexusdrift-graph-writer")


def main() -> None:
    from google.cloud import pubsub_v1

    from edge_writer import EdgeWriter
    from graph_writer_service import GraphWriterService
    from node_writer import NodeWriter
    from shared.graph.neo4j_client import NexusDriftGraph
    from shared.models.agent_events import ParsedEntityEvent

    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
    subscription_id = os.environ.get(
        "PUBSUB_SUBSCRIPTION_PARSED_ENTITIES",
        "nexusdrift-parsed-entities-writer-sub",
    )

    graph = NexusDriftGraph()
    asyncio.run(graph.connect())

    publisher = pubsub_v1.PublisherClient()
    node_writer = NodeWriter(graph)
    edge_writer = EdgeWriter(graph)
    service = GraphWriterService(graph, node_writer, edge_writer, publisher)

    def _handle_sigterm(*_: object) -> None:
        logger.info("SIGTERM received, shutting down")
        asyncio.run(graph.close())

    signal.signal(signal.SIGTERM, _handle_sigterm)

    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    def callback(message: pubsub_v1.subscriber.message.Message) -> None:
        trace_id = generate_trace_id()
        try:
            raw = json.loads(message.data.decode("utf-8"))
            event = ParsedEntityEvent.model_validate(raw)
            result = asyncio.run(service.process_parsed_event(event))
            logger.info(
                "Processed artifact %s trace_id=%s decisions=%d persons=%d concepts=%d",
                event.artifact_id,
                trace_id,
                result["written_decisions"],
                result["written_persons"],
                result["written_concepts"],
            )
            message.ack()
        except Exception as exc:
            logger.error("Graph write failed trace_id=%s: %s", trace_id, exc)
            message.nack()

    logger.info("nexusdrift-graph-writer subscribing to %s", subscription_id)
    streaming_pull = subscriber.subscribe(
        subscription_path,
        callback=callback,
        flow_control=pubsub_v1.types.FlowControl(max_messages=10),
    )

    with subscriber:
        try:
            streaming_pull.result()
        except Exception as exc:
            logger.error("Streaming pull terminated: %s", exc)
            streaming_pull.cancel()


if __name__ == "__main__":
    main()
