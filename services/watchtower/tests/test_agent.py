from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, patch


# ---------------------------------------------------------------------------
# test_system_prompt_contains_never_instructions
# ---------------------------------------------------------------------------

def test_system_prompt_contains_never_instructions():
    from agent import WATCHTOWER_SYSTEM_PROMPT

    prompt_lower = WATCHTOWER_SYSTEM_PROMPT.lower()
    assert "never" in prompt_lower
    assert "instruction" in prompt_lower or "instructions" in prompt_lower


# ---------------------------------------------------------------------------
# test_system_prompt_lists_alert_thresholds
# ---------------------------------------------------------------------------

def test_system_prompt_lists_alert_thresholds():
    from agent import WATCHTOWER_SYSTEM_PROMPT

    assert "knowledge_silo" in WATCHTOWER_SYSTEM_PROMPT
    assert "critical_risk" in WATCHTOWER_SYSTEM_PROMPT
    assert "health_score" in WATCHTOWER_SYSTEM_PROMPT.lower() or "health" in WATCHTOWER_SYSTEM_PROMPT.lower()


# ---------------------------------------------------------------------------
# test_fallback_cycle_dispatches_critical_alert
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_fallback_cycle_dispatches_critical_alert():
    from agent import _fallback_cycle
    import tools

    dispatched: list[dict] = []

    async def _mock_dispatch(alert_type, severity, explanation, evidence=None):
        dispatched.append({"alert_type": alert_type, "severity": severity})
        return "alert-id"

    tools._graph = AsyncMock()
    tools._publisher = None
    tools._firestore = None

    with patch.object(tools, "query_unresolved_risks", AsyncMock(return_value=[
        {"id": "r1", "risk_type": "knowledge_silo", "severity": "critical", "score": 0.95}
    ])), \
    patch.object(tools, "query_knowledge_gaps", AsyncMock(return_value=[])), \
    patch.object(tools, "query_contradictions", AsyncMock(return_value=[])), \
    patch.object(tools, "compute_org_health_summary", AsyncMock(return_value={"health_score": 0.8})), \
    patch.object(tools, "dispatch_alert", AsyncMock(side_effect=_mock_dispatch)):

        summary = await _fallback_cycle(tools._graph)

    critical_alerts = [d for d in dispatched if d["severity"] == "critical"]
    assert len(critical_alerts) >= 1
    assert isinstance(summary, str)
