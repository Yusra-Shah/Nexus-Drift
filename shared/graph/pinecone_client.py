from __future__ import annotations

import os
from typing import Any
from uuid import UUID

from pinecone import Pinecone


class NexusDriftVectors:
    def __init__(self) -> None:
        api_key = os.environ["PINECONE_API_KEY"]
        index_name = os.environ["PINECONE_INDEX_NAME"]
        self._pc = Pinecone(api_key=api_key)
        self._index = self._pc.Index(index_name)

    def upsert_embedding(
        self,
        node_id: str | UUID,
        vector: list[float],
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._index.upsert(
            vectors=[{"id": str(node_id), "values": vector, "metadata": metadata or {}}]
        )

    def search_similar(
        self,
        query_vector: list[float],
        top_k: int = 10,
        filter: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        kwargs: dict[str, Any] = {"vector": query_vector, "top_k": top_k, "include_metadata": True}
        if filter:
            kwargs["filter"] = filter
        result = self._index.query(**kwargs)
        return [
            {"id": match["id"], "score": match["score"], "metadata": match.get("metadata", {})}
            for match in result.get("matches", [])
        ]

    def fetch_embedding(self, node_id: str | UUID) -> list[float]:
        result = self._index.fetch(ids=[str(node_id)])
        vectors = result.get("vectors", {})
        entry = vectors.get(str(node_id))
        if entry is None:
            return []
        return entry.get("values", [])

    def delete_embedding(self, node_id: str | UUID) -> None:
        self._index.delete(ids=[str(node_id)])
