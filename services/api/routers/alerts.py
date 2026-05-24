from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request
from google.cloud.firestore_v1 import SERVER_TIMESTAMP

router = APIRouter()


@router.get("/api/alerts")
async def list_alerts(
    request: Request,
    severity: str | None = None,
    acknowledged: bool | None = None,
    limit: int = Query(default=50, le=200),
) -> dict[str, Any]:
    fs = request.app.state.firestore
    query = fs.collection("alerts").limit(limit)

    if severity:
        query = query.where("severity", "==", severity)
    if acknowledged is not None:
        query = query.where("acknowledged", "==", acknowledged)

    try:
        docs = query.stream()
        alerts = [{"id": d.id, **d.to_dict()} for d in docs]
    except Exception:
        alerts = []

    return {"alerts": alerts}


@router.post("/api/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, request: Request) -> dict[str, Any]:
    fs = request.app.state.firestore
    ref = fs.collection("alerts").document(alert_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Alert not found")

    user_id = getattr(request.state, "user_id", None)
    ref.update({"acknowledged": True, "acknowledged_at": SERVER_TIMESTAMP, "acknowledged_by": user_id})
    return {"alert_id": alert_id, "acknowledged": True}
