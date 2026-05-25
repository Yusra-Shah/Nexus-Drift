from __future__ import annotations

import logging
from typing import Any

import graph_tools

logger = logging.getLogger(__name__)

try:
    from fastmcp import FastMCP
    _mcp_available = True
except ImportError:
    FastMCP = None  # type: ignore[assignment,misc]
    _mcp_available = False

if _mcp_available:
    mcp = FastMCP(
        name="nexusdrift-mcp",
        instructions=(
            "NexusDrift knowledge graph MCP server. "
            "Provides tools for querying organisational consciousness data: "
            "decisions, people, concepts, risks, contradictions, and scores."
        ),
    )

    @mcp.tool()
    async def get_recent_decisions(limit: int = 10) -> list[dict[str, Any]]:
        """Return the most recently created Decision nodes."""
        return await graph_tools.get_recent_decisions(limit=limit)

    @mcp.tool()
    async def get_person_expertise(person_id: str) -> dict[str, Any]:
        """Return a person and all concepts they have expertise in."""
        return await graph_tools.get_person_expertise(person_id)

    @mcp.tool()
    async def get_active_risks(severity: str | None = None) -> list[dict[str, Any]]:
        """Return Risk nodes, optionally filtered by severity."""
        return await graph_tools.get_active_risks(severity=severity)

    @mcp.tool()
    async def get_concept_graph(concept_id: str, depth: int = 2) -> dict[str, Any]:
        """Return a concept and its neighbourhood up to the given depth."""
        return await graph_tools.get_concept_graph(concept_id, depth=depth)

    @mcp.tool()
    async def get_contradictions(limit: int = 20) -> list[dict[str, Any]]:
        """Return the most recent Contradiction nodes."""
        return await graph_tools.get_contradictions(limit=limit)

    @mcp.tool()
    async def get_consciousness_score() -> dict[str, Any]:
        """Return the latest organisational consciousness score from Firestore."""
        return await graph_tools.get_consciousness_score()

    @mcp.tool()
    async def get_org_summary() -> dict[str, Any]:
        """Return aggregate node and relationship counts for the entire graph."""
        return await graph_tools.get_org_summary()

    @mcp.tool()
    async def find_decision_path(from_decision_id: str, to_decision_id: str) -> list[dict[str, Any]]:
        """Return the shortest path between two Decision nodes."""
        return await graph_tools.find_decision_path(from_decision_id, to_decision_id)

    @mcp.tool()
    async def search_nodes(
        query: str, node_type: str | None = None, limit: int = 20
    ) -> list[dict[str, Any]]:
        """Full-text search across node titles, names, and descriptions."""
        return await graph_tools.search_nodes(query, node_type=node_type, limit=limit)

else:
    logger.warning("fastmcp not installed — MCP server stubs active")

    class _StubMCP:
        def run(self, *args: Any, **kwargs: Any) -> None:
            logger.warning("fastmcp unavailable, run() is a no-op")

    mcp = _StubMCP()  # type: ignore[assignment]
