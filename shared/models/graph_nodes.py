from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class DecisionType(str, Enum):
    architectural = "architectural"
    product = "product"
    process = "process"
    technical = "technical"


class DecisionOutcome(str, Enum):
    success = "success"
    failure = "failure"
    unknown = "unknown"
    pending = "pending"


class Decision(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    title: str
    content: str
    decision_type: DecisionType
    outcome: DecisionOutcome = DecisionOutcome.unknown
    created_at: datetime = Field(default_factory=datetime.utcnow)
    context_snapshot: dict[str, Any] = Field(default_factory=dict)
    embedding_id: str = ""
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class Person(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    role: str
    team: str
    expertise_domains: list[str] = Field(default_factory=list)
    tenure_months: int = 0
    activity_score: float = Field(default=0.0, ge=0.0, le=1.0)
    embedding_id: str = ""


class Concept(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    label: str
    domain: str
    importance_score: float = Field(default=0.0, ge=0.0, le=1.0)
    last_referenced: datetime = Field(default_factory=datetime.utcnow)
    embedding_id: str = ""


class ArtifactSource(str, Enum):
    github = "github"
    jira = "jira"
    slack = "slack"
    confluence = "confluence"
    gdocs = "gdocs"
    email = "email"


class ArtifactType(str, Enum):
    commit = "commit"
    pr = "pr"
    ticket = "ticket"
    thread = "thread"
    document = "document"
    meeting = "meeting"


class Artifact(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    source: ArtifactSource
    artifact_type: ArtifactType
    raw_url: str
    processed_at: datetime = Field(default_factory=datetime.utcnow)
    entities_extracted: int = 0


class RiskType(str, Enum):
    knowledge_silo = "knowledge_silo"
    repeated_failure = "repeated_failure"
    architectural_drift = "architectural_drift"
    team_fragmentation = "team_fragmentation"
    roadmap_contradiction = "roadmap_contradiction"
    communication_breakdown = "communication_breakdown"


class Severity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Risk(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    risk_type: RiskType
    severity: Severity
    score: float = Field(default=0.0, ge=0.0, le=1.0)
    predicted_at: datetime = Field(default_factory=datetime.utcnow)
    evidence_node_ids: list[UUID] = Field(default_factory=list)
    resolved: bool = False


class Simulation(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    scenario_name: str
    decision_nodes: list[UUID] = Field(default_factory=list)
    parameters: dict[str, Any] = Field(default_factory=dict)
    outcomes: dict[str, Any] = Field(default_factory=dict)
    confidence_interval: float = Field(default=0.95, ge=0.0, le=1.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ContradictionType(str, Enum):
    semantic = "semantic"
    logical = "logical"
    temporal = "temporal"
    factual = "factual"


class Contradiction(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    node_a_id: UUID
    node_b_id: UUID
    contradiction_type: ContradictionType
    severity: float = Field(default=0.0, ge=0.0, le=1.0)
    explanation: str
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    resolved: bool = False
