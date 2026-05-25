from __future__ import annotations

import os
from typing import Any
from uuid import UUID

try:
    from neo4j import AsyncDriver, AsyncGraphDatabase
except ImportError:
    AsyncDriver = None  # type: ignore[assignment,misc]
    AsyncGraphDatabase = None  # type: ignore[assignment,misc]


class NexusDriftGraph:
    def __init__(self) -> None:
        self._driver: AsyncDriver | None = None

    async def connect(self) -> None:
        uri = os.environ["NEO4J_URI"]
        username = os.environ["NEO4J_USERNAME"]
        password = os.environ["NEO4J_PASSWORD"]
        self._driver = AsyncGraphDatabase.driver(
            uri,
            auth=(username, password),
            max_connection_pool_size=50,
        )
        await self._driver.verify_connectivity()

    async def close(self) -> None:
        if self._driver:
            await self._driver.close()
            self._driver = None

    async def __aenter__(self) -> "NexusDriftGraph":
        await self.connect()
        return self

    async def __aexit__(self, *_: Any) -> None:
        await self.close()

    async def execute_query(
        self, cypher: str, params: dict[str, Any] | None = None
    ) -> list[dict[str, Any]]:
        assert self._driver, "Not connected — call connect() first"
        async with self._driver.session(
            database=os.environ.get("NEO4J_DATABASE", "neo4j")
        ) as session:
            result = await session.run(cypher, params or {})
            return [dict(record) async for record in result]

    async def create_node(self, label: str, properties: dict[str, Any]) -> dict[str, Any]:
        cypher = f"CREATE (n:{label} $props) RETURN n"
        rows = await self.execute_query(cypher, {"props": properties})
        return dict(rows[0]["n"]) if rows else {}

    async def create_edge(
        self,
        from_id: str | UUID,
        edge_type: str,
        to_id: str | UUID,
        properties: dict[str, Any] | None = None,
    ) -> None:
        cypher = (
            "MATCH (a {id: $from_id}), (b {id: $to_id}) "
            f"CREATE (a)-[r:{edge_type} $props]->(b)"
        )
        await self.execute_query(
            cypher,
            {"from_id": str(from_id), "to_id": str(to_id), "props": properties or {}},
        )

    async def get_node(self, node_id: str | UUID) -> dict[str, Any] | None:
        rows = await self.execute_query(
            "MATCH (n {id: $id}) RETURN n", {"id": str(node_id)}
        )
        return dict(rows[0]["n"]) if rows else None

    async def update_node(self, node_id: str | UUID, properties: dict[str, Any]) -> None:
        await self.execute_query(
            "MATCH (n {id: $id}) SET n += $props",
            {"id": str(node_id), "props": properties},
        )

    async def find_neighbors(
        self,
        node_id: str | UUID,
        edge_type: str | None = None,
        depth: int = 1,
    ) -> list[dict[str, Any]]:
        rel_pattern = f"[r:{edge_type}*1..{depth}]" if edge_type else f"[r*1..{depth}]"
        cypher = f"MATCH (n {{id: $id}})-{rel_pattern}-(m) RETURN DISTINCT m"
        rows = await self.execute_query(cypher, {"id": str(node_id)})
        return [dict(row["m"]) for row in rows]

    async def ping(self) -> bool:
        try:
            await self.execute_query("RETURN 1")
            return True
        except Exception:
            return False
