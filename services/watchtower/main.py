from __future__ import annotations

import asyncio
import os
import signal
import time

from dotenv import load_dotenv

from shared.utils.logger import get_logger

if os.environ.get("ENVIRONMENT", "development") == "development":
    load_dotenv()

os.environ.setdefault("SERVICE_NAME", "nexusdrift-watchtower")
logger = get_logger("nexusdrift-watchtower")

_running = True
_cycle_count = 0


def _handle_sigterm(*_: object) -> None:
    global _running
    logger.info("SIGTERM received, shutting down")
    _running = False


signal.signal(signal.SIGTERM, _handle_sigterm)


async def main() -> None:
    global _cycle_count

    from shared.graph.neo4j_client import NexusDriftGraph
    from agent import run_watchtower_cycle

    graph = NexusDriftGraph()

    try:
        from google.cloud import pubsub_v1, firestore

        publisher = pubsub_v1.PublisherClient()
        fs = firestore.Client()
    except Exception:
        publisher = None
        fs = None

    interval = int(os.environ.get("WATCHTOWER_INTERVAL_SECONDS", "3600"))
    logger.info("nexusdrift-watchtower starting, interval=%ds", interval)

    while _running:
        _cycle_count += 1
        start = time.monotonic()
        logger.info("Watchtower cycle %d starting", _cycle_count)
        try:
            summary = await run_watchtower_cycle(graph, publisher, fs)
            duration = round(time.monotonic() - start, 2)
            logger.info(
                "Watchtower cycle %d complete duration_s=%s summary=%s",
                _cycle_count,
                duration,
                summary[:200],
            )
        except Exception as exc:
            logger.error("Watchtower cycle %d failed: %s", _cycle_count, exc)

        for _ in range(interval):
            if not _running:
                break
            await asyncio.sleep(1)

    await graph.close()
    logger.info("nexusdrift-watchtower stopped")


if __name__ == "__main__":
    asyncio.run(main())
