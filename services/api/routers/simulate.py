from __future__ import annotations

import os
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from shared.utils.pubsub import publish_message

router = APIRouter()


class SimulationRequest(BaseModel):
    scenario_name: str
    decision_node_ids: list[str]
    parameters: dict[str, Any] = {}


@router.post("/api/simulate")
async def start_simulation(body: SimulationRequest, request: Request) -> dict[str, Any]:
    job_id = str(uuid4())
    fs = request.app.state.firestore

    job_data = {
        "job_id": job_id,
        "scenario_name": body.scenario_name,
        "decision_node_ids": body.decision_node_ids,
        "parameters": body.parameters,
        "status": "queued",
        "requested_by": getattr(request.state, "user_id", None),
        "trace_id": getattr(request.state, "trace_id", None),
    }
    fs.collection("simulations").document(job_id).set(job_data)

    topic_id = os.environ.get("PUBSUB_TOPIC_GRAPH_UPDATES", "nexusdrift-graph-updates")
    try:
        from shared.models.agent_events import GraphUpdateEvent, GraphOperation
        from uuid import UUID
        event = GraphUpdateEvent(
            operation=GraphOperation.node_created,
            node_type="Simulation",
            node_id=UUID(job_id),
            agent_id="nexusdrift-api",
        )
        publish_message(topic_id, event)
    except Exception:
        pass

    return {"job_id": job_id, "status": "queued"}


@router.get("/api/simulate/{job_id}")
async def get_simulation(job_id: str, request: Request) -> dict[str, Any]:
    fs = request.app.state.firestore
    doc = fs.collection("simulations").document(job_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Simulation job not found")
    return doc.to_dict()
