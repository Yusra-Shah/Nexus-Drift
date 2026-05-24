from __future__ import annotations

import os
from typing import Any
from uuid import uuid4

try:
    from langgraph.graph import StateGraph, END
except ImportError:
    StateGraph = None  # type: ignore[assignment,misc]
    END = "__end__"

from state import ReasoningState

_graph: Any = None
_vectors: Any = None
_llm: Any = None

SIMILARITY_THRESHOLD = float(os.environ.get("CONTRADICTION_SIMILARITY_THRESHOLD", "0.75"))
SEVERITY_THRESHOLD = float(os.environ.get("CONTRADICTION_SEVERITY_THRESHOLD", "0.3"))


async def fetch_candidates(state: ReasoningState) -> ReasoningState:
    vectors = _vectors
    node_ids = state["node_ids"]
    embeddings: dict[str, list[float]] = {}

    for node_id in node_ids:
        try:
            vec = vectors.fetch_embedding(node_id)
            if vec:
                embeddings[node_id] = vec
        except Exception as exc:
            state["errors"].append(f"fetch_embedding {node_id}: {exc}")

    candidate_pairs: list[tuple[str, str]] = []
    ids = list(embeddings.keys())
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            va = embeddings[ids[i]]
            vb = embeddings[ids[j]]
            score = _cosine_similarity(va, vb)
            if score >= SIMILARITY_THRESHOLD:
                candidate_pairs.append((ids[i], ids[j]))

    return {
        **state,
        "embeddings": embeddings,
        "candidate_pairs": candidate_pairs,
    }


async def detect_contradictions(state: ReasoningState) -> ReasoningState:
    graph = _graph
    contradictions: list[dict[str, Any]] = []

    for node_a_id, node_b_id in state["candidate_pairs"]:
        try:
            from graph_queries import fetch_decision_node
            node_a = await fetch_decision_node(graph, node_a_id)
            node_b = await fetch_decision_node(graph, node_b_id)
            if node_a is None or node_b is None:
                continue

            text_a = node_a.get("title", "") + " " + node_a.get("content", "")
            text_b = node_b.get("title", "") + " " + node_b.get("content", "")

            contradiction = _heuristic_contradiction(node_a_id, node_b_id, text_a, text_b)
            if contradiction and contradiction["severity"] >= SEVERITY_THRESHOLD:
                contradictions.append(contradiction)
        except Exception as exc:
            state["errors"].append(f"detect_contradictions {node_a_id}/{node_b_id}: {exc}")

    return {**state, "contradictions": contradictions}


async def verify_with_llm(state: ReasoningState) -> ReasoningState:
    llm = _llm
    verified: list[dict[str, Any]] = []

    for item in state["contradictions"]:
        try:
            if llm is None:
                verified.append({**item, "llm_confirmed": True})
                continue

            prompt = (
                f"Are these two statements contradictory?\n"
                f"A: {item.get('text_a', '')}\n"
                f"B: {item.get('text_b', '')}\n"
                f"Answer with YES or NO only."
            )
            response = await llm.ainvoke(prompt)
            content = response.content if hasattr(response, "content") else str(response)
            confirmed = "yes" in content.lower()
            if confirmed:
                verified.append({**item, "llm_confirmed": True})
        except Exception as exc:
            state["errors"].append(f"llm_verify {item.get('id')}: {exc}")
            verified.append({**item, "llm_confirmed": False})

    return {**state, "llm_verified": verified}


def _route_after_candidates(state: ReasoningState) -> str:
    if not state["candidate_pairs"]:
        return END
    return "detect_contradictions"


def _route_after_detect(state: ReasoningState) -> str:
    if not state["contradictions"]:
        return END
    return "verify_with_llm"


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _heuristic_contradiction(
    node_a_id: str,
    node_b_id: str,
    text_a: str,
    text_b: str,
) -> dict[str, Any] | None:
    negative_pairs = [
        ("adopt", "abandon"),
        ("migrate", "keep"),
        ("use", "remove"),
        ("enable", "disable"),
        ("increase", "decrease"),
        ("add", "remove"),
        ("start", "stop"),
        ("approve", "reject"),
    ]
    text_a_lower = text_a.lower()
    text_b_lower = text_b.lower()

    for pos, neg in negative_pairs:
        if (pos in text_a_lower and neg in text_b_lower) or (
            neg in text_a_lower and pos in text_b_lower
        ):
            return {
                "id": str(uuid4()),
                "node_a_id": node_a_id,
                "node_b_id": node_b_id,
                "contradiction_type": "logical",
                "severity": 0.7,
                "explanation": f"Opposing directives detected: '{pos}' vs '{neg}'",
                "text_a": text_a[:300],
                "text_b": text_b[:300],
            }
    return None


def _build_workflow() -> Any:
    if StateGraph is None:
        return None
    workflow = StateGraph(ReasoningState)
    workflow.add_node("fetch_candidates", fetch_candidates)
    workflow.add_node("detect_contradictions", detect_contradictions)
    workflow.add_node("verify_with_llm", verify_with_llm)
    workflow.set_entry_point("fetch_candidates")
    workflow.add_conditional_edges("fetch_candidates", _route_after_candidates)
    workflow.add_conditional_edges("detect_contradictions", _route_after_detect)
    workflow.add_edge("verify_with_llm", END)
    return workflow.compile()


contradiction_workflow = _build_workflow()


async def run_contradiction_detection(
    node_ids: list[str],
    graph: Any,
    vectors: Any,
    llm: Any = None,
) -> list[dict[str, Any]]:
    global _graph, _vectors, _llm
    _graph = graph
    _vectors = vectors
    _llm = llm

    if contradiction_workflow is None:
        return []

    initial_state: ReasoningState = {
        "node_ids": node_ids,
        "embeddings": {},
        "candidate_pairs": [],
        "contradictions": [],
        "llm_verified": [],
        "errors": [],
    }
    result = await contradiction_workflow.ainvoke(initial_state)
    return result.get("llm_verified", [])
