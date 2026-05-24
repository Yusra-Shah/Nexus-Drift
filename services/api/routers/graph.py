from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request

router = APIRouter()


@router.get("/api/graph/nodes")
async def list_nodes(
    request: Request,
    node_type: str | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
) -> dict[str, Any]:
    graph = request.app.state.graph
    type_filter = f":{node_type}" if node_type else ""
    cypher = f"MATCH (n{type_filter}) RETURN n SKIP $offset LIMIT $limit"
    rows = await graph.execute_query(cypher, {"offset": offset, "limit": limit})
    nodes = [dict(r["n"]) for r in rows]

    count_cypher = f"MATCH (n{type_filter}) RETURN count(n) AS total"
    count_rows = await graph.execute_query(count_cypher)
    total = count_rows[0]["total"] if count_rows else 0

    return {"nodes": nodes, "total": total, "offset": offset, "limit": limit}


@router.get("/api/graph/nodes/{node_id}")
async def get_node(node_id: str, request: Request) -> dict[str, Any]:
    graph = request.app.state.graph
    node = await graph.get_node(node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    edge_cypher = (
        "MATCH (n {id: $id})-[r]-(m) "
        "RETURN type(r) AS edge_type, r AS edge_props, m AS neighbor"
    )
    edge_rows = await graph.execute_query(edge_cypher, {"id": node_id})
    edges = [
        {
            "edge_type": r["edge_type"],
            "edge_props": dict(r["edge_props"]),
            "neighbor": dict(r["neighbor"]),
        }
        for r in edge_rows
    ]
    return {"node": node, "edges": edges}


@router.get("/api/graph/search")
async def semantic_search(
    request: Request,
    query: str = Query(..., min_length=1),
    top_k: int = Query(default=10, le=50),
) -> dict[str, Any]:
    vectors = request.app.state.vectors

    # Embed the query using Gemini — placeholder returns zero vector until parser is wired.
    # In production, call Vertex AI text-embedding-004 here.
    query_vector = [0.0] * 768

    results = vectors.search_similar(query_vector, top_k=top_k)
    return {"query": query, "results": results}


@router.get("/api/graph/path")
async def shortest_path(
    request: Request,
    from_id: str = Query(...),
    to_id: str = Query(...),
) -> dict[str, Any]:
    graph = request.app.state.graph
    cypher = (
        "MATCH p = shortestPath((a {id: $from_id})-[*]-(b {id: $to_id})) "
        "RETURN [node in nodes(p) | properties(node)] AS path_nodes, "
        "length(p) AS hops"
    )
    rows = await graph.execute_query(cypher, {"from_id": from_id, "to_id": to_id})
    if not rows:
        raise HTTPException(status_code=404, detail="No path found between nodes")
    return {"path": rows[0]["path_nodes"], "hops": rows[0]["hops"]}
