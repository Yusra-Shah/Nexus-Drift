from __future__ import annotations

import pytest
from uuid import UUID

from shared.models.graph_nodes import (
    Decision,
    DecisionOutcome,
    DecisionType,
    Person,
    Concept,
    Risk,
    RiskType,
    Severity,
    Contradiction,
    ContradictionType,
    Simulation,
    Artifact,
    ArtifactSource,
    ArtifactType,
)
from shared.models.agent_events import (
    RawArtifactEvent,
    ParsedEntityEvent,
    GraphUpdateEvent,
    GraphOperation,
    AlertEvent,
)


def test_decision_defaults() -> None:
    d = Decision(title="Use Postgres", content="We chose Postgres", decision_type=DecisionType.architectural)
    assert isinstance(d.id, UUID)
    assert d.outcome == DecisionOutcome.unknown
    assert 0.0 <= d.confidence <= 1.0


def test_person_model() -> None:
    p = Person(name="Alice", role="engineer", team="backend")
    assert isinstance(p.id, UUID)
    assert p.expertise_domains == []


def test_risk_model() -> None:
    r = Risk(risk_type=RiskType.knowledge_silo, severity=Severity.high, score=0.85)
    assert r.resolved is False
    assert r.evidence_node_ids == []


def test_contradiction_model() -> None:
    from uuid import uuid4
    c = Contradiction(
        node_a_id=uuid4(),
        node_b_id=uuid4(),
        contradiction_type=ContradictionType.logical,
        explanation="These decisions conflict",
    )
    assert c.resolved is False


def test_raw_artifact_event() -> None:
    e = RawArtifactEvent(source=ArtifactSource.github, content="PR merged", metadata={})
    assert isinstance(e.artifact_id, UUID)


def test_graph_update_event() -> None:
    from uuid import uuid4
    e = GraphUpdateEvent(
        operation=GraphOperation.node_created,
        node_type="Decision",
        node_id=uuid4(),
        agent_id="nexusdrift-parser",
    )
    assert e.operation == GraphOperation.node_created
