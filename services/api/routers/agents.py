from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query, Request

router = APIRouter()

_AGENT_NAMES = [
    "nexusdrift-ingestion",
    "nexusdrift-parser",
    "nexusdrift-graph-writer",
    "nexusdrift-reasoning",
    "nexusdrift-simulation",
    "nexusdrift-watchtower",
    "nexusdrift-scorer",
    "nexusdrift-mcp-server",
    "nexusdrift-api",
]


@router.get("/api/agents/status")
async def agent_status(request: Request) -> dict[str, Any]:
    fs = request.app.state.firestore
    statuses = []
    for name in _AGENT_NAMES:
        try:
            doc = fs.collection("agent_state").document(name).get()
            data = doc.to_dict() or {}
        except Exception:
            data = {}
        statuses.append({"agent": name, **data})
    return {"agents": statuses}


@router.get("/api/agents/executions")
async def agent_executions(
    request: Request,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
) -> dict[str, Any]:
    fs = request.app.state.firestore
    try:
        query = (
            fs.collection("agent_state")
            .order_by("started_at", direction="DESCENDING")
            .limit(limit)
            .offset(offset)
        )
        docs = query.stream()
        executions = [{"id": d.id, **d.to_dict()} for d in docs]
    except Exception:
        executions = []
    return {"executions": executions, "limit": limit, "offset": offset}
