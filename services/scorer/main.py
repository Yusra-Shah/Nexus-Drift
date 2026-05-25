from __future__ import annotations

import asyncio
import os
import signal

from dotenv import load_dotenv

from shared.utils.logger import get_logger

if os.environ.get("ENVIRONMENT", "development") == "development":
    load_dotenv()

os.environ.setdefault("SERVICE_NAME", "nexusdrift-scorer")
logger = get_logger("nexusdrift-scorer")

_shutdown = asyncio.Event()


def _handle_sigterm(*_: object) -> None:
    logger.info("SIGTERM received, shutting down")
    _shutdown.set()


async def _run() -> None:
    from google.cloud import bigquery, firestore

    from shared.graph.neo4j_client import NexusDriftGraph
    from scorer import OrgConsciousnessScorer

    interval = int(os.environ.get("SCORER_INTERVAL_SECONDS", "900"))
    bigquery_table_id = (
        f"{os.environ['GOOGLE_CLOUD_PROJECT']}."
        f"{os.environ.get('BIGQUERY_DATASET', 'nexusdrift')}."
        "consciousness_scores"
    )
    alerts_topic = os.environ.get("PUBSUB_TOPIC_ALERTS", "nexusdrift-alerts")

    graph = NexusDriftGraph()
    await graph.connect()

    fs_client = firestore.Client(project=os.environ.get("FIRESTORE_PROJECT_ID"))
    bq_client = bigquery.Client()
    scorer = OrgConsciousnessScorer()

    fs_client.collection("agent_state").document("nexusdrift-scorer").set(
        {"status": "running", "started_at": firestore.SERVER_TIMESTAMP}
    )
    logger.info("nexusdrift-scorer started, interval=%ds", interval)

    try:
        while not _shutdown.is_set():
            try:
                result = await scorer.run_cycle(
                    graph,
                    fs_client,
                    bq_client,
                    bigquery_table_id,
                    None,
                    alerts_topic,
                )
                logger.info("cycle complete overall_score=%s", result["overall_score"])
            except Exception as exc:
                logger.error("Scoring cycle error: %s", exc)
            try:
                await asyncio.wait_for(_shutdown.wait(), timeout=interval)
            except asyncio.TimeoutError:
                pass
    finally:
        await graph.close()
        logger.info("nexusdrift-scorer stopped")


def main() -> None:
    signal.signal(signal.SIGTERM, _handle_sigterm)
    asyncio.run(_run())


if __name__ == "__main__":
    main()
