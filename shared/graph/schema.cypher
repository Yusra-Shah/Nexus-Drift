// Nexus Drift Neo4j Schema Initialization
// Run once before first deployment via: make neo4j-schema

// Unique constraints
CREATE CONSTRAINT decision_id_unique IF NOT EXISTS FOR (n:Decision) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT person_id_unique IF NOT EXISTS FOR (n:Person) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT concept_id_unique IF NOT EXISTS FOR (n:Concept) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT artifact_id_unique IF NOT EXISTS FOR (n:Artifact) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT risk_id_unique IF NOT EXISTS FOR (n:Risk) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT simulation_id_unique IF NOT EXISTS FOR (n:Simulation) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT contradiction_id_unique IF NOT EXISTS FOR (n:Contradiction) REQUIRE n.id IS UNIQUE;

// Lookup indexes
CREATE INDEX decision_type_idx IF NOT EXISTS FOR (n:Decision) ON (n.decision_type);
CREATE INDEX decision_outcome_idx IF NOT EXISTS FOR (n:Decision) ON (n.outcome);
CREATE INDEX risk_severity_idx IF NOT EXISTS FOR (n:Risk) ON (n.severity);
CREATE INDEX risk_resolved_idx IF NOT EXISTS FOR (n:Risk) ON (n.resolved);
CREATE INDEX contradiction_resolved_idx IF NOT EXISTS FOR (n:Contradiction) ON (n.resolved);
CREATE INDEX artifact_source_idx IF NOT EXISTS FOR (n:Artifact) ON (n.source);
