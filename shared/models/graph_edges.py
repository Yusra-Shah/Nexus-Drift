from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class BaseEdge(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    source_artifact_id: UUID
    agent_id: str


class MadeBy(BaseEdge):
    from_id: UUID  # Decision
    to_id: UUID    # Person


class InfluencedBy(BaseEdge):
    from_id: UUID  # Decision
    to_id: UUID    # Decision


class SupersededBy(BaseEdge):
    from_id: UUID  # Decision
    to_id: UUID    # Decision


class Contradicts(BaseEdge):
    from_id: UUID  # Decision or Concept
    to_id: UUID    # Decision or Concept


class References(BaseEdge):
    from_id: UUID  # Artifact
    to_id: UUID    # Decision or Concept


class AuthoredBy(BaseEdge):
    from_id: UUID  # Artifact
    to_id: UUID    # Person


class HasExpertiseIn(BaseEdge):
    from_id: UUID  # Person
    to_id: UUID    # Concept


class TriggeredRisk(BaseEdge):
    from_id: UUID  # Decision or Concept
    to_id: UUID    # Risk


class DetectedIn(BaseEdge):
    from_id: UUID  # Risk or Contradiction
    to_id: UUID    # Artifact


class Simulates(BaseEdge):
    from_id: UUID  # Simulation
    to_id: UUID    # Decision


class Impacts(BaseEdge):
    from_id: UUID  # Decision or Risk
    to_id: UUID    # Concept or Person
