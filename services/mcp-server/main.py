from __future__ import annotations

import os

from dotenv import load_dotenv

from shared.utils.logger import get_logger

if os.environ.get("ENVIRONMENT", "development") == "development":
    load_dotenv()

os.environ.setdefault("SERVICE_NAME", "nexusdrift-mcp-server")
logger = get_logger("nexusdrift-mcp-server")


def main() -> None:
    import asyncio

    from shared.graph.neo4j_client import NexusDriftGraph
    import graph_tools
    from server import mcp

    transport = os.environ.get("MCP_TRANSPORT", "sse")
    port = int(os.environ.get("MCP_PORT", "8090"))

    graph = NexusDriftGraph()
    asyncio.run(graph.connect())

    try:
        from google.cloud import firestore
        fs_client = firestore.Client(project=os.environ.get("FIRESTORE_PROJECT_ID"))
    except Exception as exc:
        logger.warning("Firestore init failed: %s — using None", exc)
        fs_client = None

    graph_tools.init(graph, fs_client)
    logger.info("nexusdrift-mcp-server starting transport=%s port=%d", transport, port)

    mcp.run(transport=transport, port=port)


if __name__ == "__main__":
    main()
