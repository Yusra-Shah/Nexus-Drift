from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from shared.models.graph_nodes import ArtifactSource, Severity


class GraphOperation(str, Enum):
    node_created = "node_created"
    node_updated = "node_updated"
    edge_created = "edge_created"


class RawArtifactEvent(BaseModel):
    artifact_id: UUID = Field(default_factory=uuid4)
    source: ArtifactSource
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ParsedEntityEvent(BaseModel):
    artifact_id: UUID
    decisions: list[dict[str, Any]] = Field(default_factory=list)
    persons: list[dict[str, Any]] = Field(default_factory=list)
    concepts: list[dict[str, Any]] = Field(default_factory=list)
    agent_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class GraphUpdateEvent(BaseModel):
    operation: GraphOperation
    node_type: str
    node_id: UUID
    agent_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AlertEvent(BaseModel):
    alert_id: UUID = Field(default_factory=uuid4)
    severity: Severity
    alert_type: str
    explanation: str
    evidence_node_ids: list[UUID] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
