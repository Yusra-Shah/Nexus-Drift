from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request

router = APIRouter()


@router.get("/api/risks")
async def list_risks(
    request: Request,
    severity: str | None = None,
    resolved: bool | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
) -> dict[str, Any]:
    graph = request.app.state.graph

    conditions = []
    params: dict[str, Any] = {"offset": offset, "limit": limit}

    if severity:
        conditions.append("n.severity = $severity")
        params["severity"] = severity
    if resolved is not None:
        conditions.append("n.resolved = $resolved")
        params["resolved"] = resolved

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    cypher = f"MATCH (n:Risk) {where} RETURN n SKIP $offset LIMIT $limit"
    rows = await graph.execute_query(cypher, params)
    return {"risks": [dict(r["n"]) for r in rows]}


@router.get("/api/risks/{risk_id}")
async def get_risk(risk_id: str, request: Request) -> dict[str, Any]:
    graph = request.app.state.graph
    node = await graph.get_node(risk_id)
    if not node:
        raise HTTPException(status_code=404, detail="Risk not found")

    evidence_cypher = (
        "MATCH (r:Risk {id: $id})-[:DETECTED_IN|TRIGGERED_RISK*1..2]-(evidence) "
        "RETURN DISTINCT evidence"
    )
    evidence_rows = await graph.execute_query(evidence_cypher, {"id": risk_id})
    evidence = [dict(r["evidence"]) for r in evidence_rows]

    return {"risk": node, "evidence_chain": evidence}
