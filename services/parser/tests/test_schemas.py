from __future__ import annotations

import pytest
from pydantic import ValidationError

from schemas import ParsedArtifact, ParsedConcept, ParsedDecision, ParsedPerson


def test_parsed_artifact_empty_is_valid():
    artifact = ParsedArtifact(
        decisions=[],
        persons=[],
        concepts=[],
        summary="",
        confidence=0.5,
    )
    assert artifact.confidence == 0.5
    assert artifact.decisions == []


def test_parsed_decision_confidence_bounds():
    with pytest.raises(ValidationError):
        ParsedDecision(
            title="Bad decision",
            content="Content",
            decision_type="technical",
            confidence=1.1,
        )

    # 0.0 is valid
    d = ParsedDecision(
        title="Valid decision",
        content="Content",
        decision_type="architectural",
        confidence=0.0,
    )
    assert d.confidence == 0.0


def test_parsed_concept_label_max_length():
    with pytest.raises(ValidationError):
        ParsedConcept(
            label="a" * 51,
            domain="data",
        )

    c = ParsedConcept(label="a" * 50, domain="data")
    assert len(c.label) == 50


def test_parsed_person_expertise_signals_list():
    # Must be a list (or coercible to one)
    p = ParsedPerson(
        name="Alice",
        role="engineer",
        expertise_signals=["python", "neo4j"],
    )
    assert isinstance(p.expertise_signals, list)
    assert len(p.expertise_signals) == 2

    # String should be coerced to single-element list
    p2 = ParsedPerson(
        name="Bob",
        role="pm",
        expertise_signals="roadmap",  # type: ignore[arg-type]
    )
    assert isinstance(p2.expertise_signals, list)
    assert p2.expertise_signals == ["roadmap"]


def test_parsed_decision_title_max_length():
    with pytest.raises(ValidationError):
        ParsedDecision(
            title="x" * 201,
            content="Content",
            decision_type="product",
        )


def test_parsed_artifact_confidence_bounds():
    with pytest.raises(ValidationError):
        ParsedArtifact(confidence=-0.1)
