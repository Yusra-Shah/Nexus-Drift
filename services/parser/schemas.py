from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field, field_validator


class ParsedDecision(BaseModel):
    title: Annotated[str, Field(max_length=200)]
    content: Annotated[str, Field(max_length=2000)]
    decision_type: Literal["architectural", "product", "process", "technical"]
    outcome: Literal["success", "failure", "unknown", "pending"] = "unknown"
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class ParsedPerson(BaseModel):
    name: str
    role: str
    expertise_signals: list[str] = Field(default_factory=list)

    @field_validator("expertise_signals", mode="before")
    @classmethod
    def coerce_to_list(cls, v: object) -> list[str]:
        if isinstance(v, str):
            return [v]
        return v  # type: ignore[return-value]


class ParsedConcept(BaseModel):
    label: Annotated[str, Field(max_length=50)]
    domain: Literal[
        "auth", "payments", "data", "ml", "frontend", "backend",
        "infra", "devops", "product", "process"
    ]


class ParsedArtifact(BaseModel):
    decisions: list[ParsedDecision] = Field(default_factory=list)
    persons: list[ParsedPerson] = Field(default_factory=list)
    concepts: list[ParsedConcept] = Field(default_factory=list)
    summary: Annotated[str, Field(max_length=300)] = ""
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
