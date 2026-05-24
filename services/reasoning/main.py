from __future__ import annotations

import asyncio
import os
import signal

from dotenv import load_dotenv

from shared.utils.logger import get_logger

if os.environ.get("ENVIRONMENT", "development") == "development":
    load_dotenv()

os.environ.setdefault("SERVICE_NAME", "nexusdrift-reasoning")
logger = get_logger("nexusdrift-reasoning")

_running = True


def _handle_sigterm(*_: object) -> None:
    global _running
    logger.info("SIGTERM received, shutting down")
    _running = False


signal.signal(signal.SIGTERM, _handle_sigterm)


async def _contradiction_loop() -> None:
    from shared.graph.neo4j_client import NexusDriftGraph
    from shared.graph.pinecone_client import NexusDriftVectors
    from contradiction_detector import run_contradiction_detection
    from graph_queries import fetch_recent_decision_ids

    graph = NexusDriftGraph()
    vectors = NexusDriftVectors()

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.0)
    except Exception:
        llm = None

    interval = int(os.environ.get("CONTRADICTION_INTERVAL_SECONDS", "900"))
    logger.info("Contradiction detection loop starting, interval=%ds", interval)

    while _running:
        try:
            node_ids = await fetch_recent_decision_ids(graph)
            found = await run_contradiction_detection(node_ids, graph, vectors, llm)
            logger.info("Contradiction detection complete: %d contradictions found", len(found))
        except Exception as exc:
            logger.error("Contradiction loop error: %s", exc)
        await asyncio.sleep(interval)

    await graph.close()


async def _risk_loop() -> None:
    from shared.graph.neo4j_client import NexusDriftGraph
    from risk_forecaster import run_risk_forecasting

    graph = NexusDriftGraph()

    try:
        from google.cloud import bigquery
        bq = bigquery.Client()
    except Exception:
        bq = None

    project_keys = [k for k in os.environ.get("JIRA_PROJECT_KEYS", "").split(",") if k.strip()]
    interval = int(os.environ.get("RISK_SCORING_INTERVAL_SECONDS", "1800"))
    logger.info("Risk forecasting loop starting, interval=%ds", interval)

    while _running:
        for key in project_keys:
            try:
                result = await run_risk_forecasting(key, graph, bq)
                score = result["consciousness_score"].get("score", 0.0)
                logger.info(
                    "Risk forecast complete project=%s risks=%d consciousness=%.3f",
                    key,
                    len(result["scored_risks"]),
                    score,
                )
            except Exception as exc:
                logger.error("Risk loop error project=%s: %s", key, exc)
        await asyncio.sleep(interval)

    await graph.close()


async def main() -> None:
    logger.info("nexusdrift-reasoning starting")
    await asyncio.gather(
        _contradiction_loop(),
        _risk_loop(),
    )
    logger.info("nexusdrift-reasoning stopped")


if __name__ == "__main__":
    asyncio.run(main())
