from __future__ import annotations

import asyncio
import os
import signal
import time

import schedule
from dotenv import load_dotenv

from shared.utils.logger import get_logger
from shared.utils.security import generate_trace_id

if os.environ.get("ENVIRONMENT", "development") == "development":
    load_dotenv()

os.environ.setdefault("SERVICE_NAME", "nexusdrift-ingestion")
logger = get_logger("nexusdrift-ingestion")

_pipeline = None
_cycle_count = 0
_running = True


def _handle_sigterm(*_: object) -> None:
    global _running
    logger.info("SIGTERM received, shutting down")
    _running = False


signal.signal(signal.SIGTERM, _handle_sigterm)


async def _run_cycle() -> None:
    global _cycle_count
    _cycle_count += 1
    trace_id = generate_trace_id()
    start = time.monotonic()
    logger.info("Ingestion cycle %d starting trace_id=%s", _cycle_count, trace_id)
    try:
        result = await _pipeline.run_cycle()
        duration = round(time.monotonic() - start, 2)
        logger.info(
            "Ingestion cycle %d complete trace_id=%s github=%d jira=%d slack=%d published=%d duration_s=%s",
            _cycle_count,
            trace_id,
            result["github_count"],
            result["jira_count"],
            result["slack_count"],
            result["total_published"],
            duration,
        )
    except Exception as exc:
        logger.error("Ingestion cycle %d failed: %s", _cycle_count, exc)


def _run_cycle_sync() -> None:
    asyncio.run(_run_cycle())


async def main() -> None:
    global _pipeline
    from pipeline import IngestionPipeline

    _pipeline = IngestionPipeline()
    logger.info("nexusdrift-ingestion starting")

    # Immediate first cycle
    await _run_cycle()

    # Schedule every 5 minutes
    schedule.every(5).minutes.do(_run_cycle_sync)

    while _running:
        schedule.run_pending()
        time.sleep(30)

    await _pipeline.close()
    logger.info("nexusdrift-ingestion stopped")


if __name__ == "__main__":
    asyncio.run(main())
