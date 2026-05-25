from __future__ import annotations

import pytest
from unittest.mock import AsyncMock


@pytest.mark.asyncio
async def test_collect_all_metrics_success() -> None:
    from metrics import collect_all_metrics

    graph = AsyncMock()
    graph.execute_query = AsyncMock(return_value=[{"value": 5}])

    result = await collect_all_metrics(graph)

    assert isinstance(result, dict)
    assert "total_nodes" in result
    assert "concept_count" in result
    assert "risk_count" in result
    assert result["total_nodes"] == 5
    assert len(result) == 15


@pytest.mark.asyncio
async def test_collect_all_metrics_partial_failure() -> None:
    from metrics import collect_all_metrics

    call_count = 0

    async def _side_effect(cypher: str, *args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 3:
            raise RuntimeError("query failed")
        return [{"value": 1}]

    graph = AsyncMock()
    graph.execute_query = AsyncMock(side_effect=_side_effect)

    result = await collect_all_metrics(graph)

    assert isinstance(result, dict)
    assert len(result) == 15
    keys = list(result.keys())
    assert result[keys[2]] == 0
    assert result[keys[0]] == 1
