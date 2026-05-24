from __future__ import annotations

import os
from typing import Any

from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/api/health")
async def health(request: Request) -> dict[str, Any]:
    graph = getattr(request.app.state, "graph", None)
    neo4j_ok = await graph.ping() if graph else False

    firestore_ok = False
    try:
        fs = getattr(request.app.state, "firestore", None)
        if fs:
            fs.collection("_health").document("ping")
            firestore_ok = True
    except Exception:
        firestore_ok = False

    return {
        "status": "ok" if neo4j_ok else "degraded",
        "version": "0.1.0",
        "environment": os.environ.get("ENVIRONMENT", "unknown"),
        "dependencies": {
            "neo4j": "ok" if neo4j_ok else "unreachable",
            "firestore": "ok" if firestore_ok else "unreachable",
        },
    }
