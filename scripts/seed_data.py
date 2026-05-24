"""Seed Neo4j with realistic demo data for hackathon demonstration."""
from __future__ import annotations

import os
import sys
from datetime import datetime, timedelta
from uuid import uuid4


def main() -> None:
    try:
        from neo4j import GraphDatabase
    except ImportError:
        print("ERROR: neo4j driver not installed. Run: pip install neo4j")
        sys.exit(1)

    uri = os.environ.get("NEO4J_URI")
    username = os.environ.get("NEO4J_USERNAME", "neo4j")
    password = os.environ.get("NEO4J_PASSWORD")

    if not uri or not password:
        print("ERROR: NEO4J_URI and NEO4J_PASSWORD must be set")
        sys.exit(1)

    driver = GraphDatabase.driver(uri, auth=(username, password))
    db = os.environ.get("NEO4J_DATABASE", "neo4j")

    # --- Persons ---
    persons = [
        {"id": str(uuid4()), "name": "Sarah Chen", "role": "CTO", "team": "leadership", "expertise_domains": ["architecture", "distributed-systems", "ml-infrastructure"], "tenure_months": 48, "activity_score": 0.92},
        {"id": str(uuid4()), "name": "Marcus Rodriguez", "role": "Senior Backend Engineer", "team": "platform", "expertise_domains": ["python", "neo4j", "pub-sub", "api-design"], "tenure_months": 30, "activity_score": 0.88},
        {"id": str(uuid4()), "name": "Priya Patel", "role": "Product Manager", "team": "product", "expertise_domains": ["roadmap-planning", "user-research", "metrics"], "tenure_months": 18, "activity_score": 0.75},
        {"id": str(uuid4()), "name": "Jake Williams", "role": "Frontend Lead", "team": "frontend", "expertise_domains": ["react", "nextjs", "typescript", "design-systems"], "tenure_months": 24, "activity_score": 0.81},
        {"id": str(uuid4()), "name": "Aiko Tanaka", "role": "DevOps Engineer", "team": "infrastructure", "expertise_domains": ["terraform", "gcp", "docker", "cloud-run", "ci-cd"], "tenure_months": 36, "activity_score": 0.85},
    ]

    # --- Decisions ---
    now = datetime.utcnow()
    decisions = [
        {"id": str(uuid4()), "title": "Adopt Neo4j as primary graph store", "content": "After evaluating Neptune, TigerGraph, and Neo4j, we selected Neo4j Aura for its Cypher query language, managed cloud offering, and strong Python driver support.", "decision_type": "architectural", "outcome": "success", "created_at": (now - timedelta(days=180)).isoformat(), "confidence": 0.95},
        {"id": str(uuid4()), "title": "Use Pub/Sub for inter-service messaging", "content": "We chose Google Cloud Pub/Sub over Kafka to minimize operational overhead on Cloud Run. Pub/Sub push subscriptions align with our serverless model.", "decision_type": "architectural", "outcome": "success", "created_at": (now - timedelta(days=170)).isoformat(), "confidence": 0.90},
        {"id": str(uuid4()), "title": "Migrate from REST to GraphQL for client API", "content": "Product team pushed for GraphQL to enable flexible frontend queries. Decision was reversed 6 weeks later due to N+1 query complexity and team unfamiliarity.", "decision_type": "architectural", "outcome": "failure", "created_at": (now - timedelta(days=120)).isoformat(), "confidence": 0.60},
        {"id": str(uuid4()), "title": "Revert to REST API with typed OpenAPI spec", "content": "GraphQL migration was abandoned. Reverted to REST with strict OpenAPI 3.1 spec and FastAPI auto-generation. Reduced API latency by 40%.", "decision_type": "architectural", "outcome": "success", "created_at": (now - timedelta(days=78)).isoformat(), "confidence": 0.92},
        {"id": str(uuid4()), "title": "Implement Clerk for authentication", "content": "Selected Clerk over Auth0 and custom JWT for faster time-to-market and built-in organization support matching our multi-tenant model.", "decision_type": "technical", "outcome": "success", "created_at": (now - timedelta(days=150)).isoformat(), "confidence": 0.88},
        {"id": str(uuid4()), "title": "Use LangGraph for reasoning agent orchestration", "content": "LangGraph chosen over raw LangChain and custom state machines for its explicit graph-based flow control and built-in checkpointing.", "decision_type": "technical", "outcome": "pending", "created_at": (now - timedelta(days=45)).isoformat(), "confidence": 0.78},
        {"id": str(uuid4()), "title": "Deploy on Cloud Run instead of GKE", "content": "Cloud Run selected for zero-ops scaling and cost efficiency at low traffic. GKE would be reconsidered if any service requires persistent state beyond 60s.", "decision_type": "architectural", "outcome": "success", "created_at": (now - timedelta(days=200)).isoformat(), "confidence": 0.93},
        {"id": str(uuid4()), "title": "Use Pinecone for vector embeddings", "content": "Pinecone selected over pgvector and Weaviate. Managed service eliminates index maintenance, and metadata filtering matches our node-type queries.", "decision_type": "technical", "outcome": "unknown", "created_at": (now - timedelta(days=60)).isoformat(), "confidence": 0.82},
    ]

    # --- Concepts ---
    concepts = [
        {"id": str(uuid4()), "label": "auth-system", "domain": "security", "importance_score": 0.90, "last_referenced": (now - timedelta(days=2)).isoformat()},
        {"id": str(uuid4()), "label": "payment-pipeline", "domain": "billing", "importance_score": 0.75, "last_referenced": (now - timedelta(days=15)).isoformat()},
        {"id": str(uuid4()), "label": "ml-inference", "domain": "ai", "importance_score": 0.88, "last_referenced": (now - timedelta(days=1)).isoformat()},
        {"id": str(uuid4()), "label": "frontend-architecture", "domain": "frontend", "importance_score": 0.72, "last_referenced": (now - timedelta(days=7)).isoformat()},
        {"id": str(uuid4()), "label": "database-schema", "domain": "data", "importance_score": 0.85, "last_referenced": (now - timedelta(days=3)).isoformat()},
    ]

    # --- Risks ---
    risks = [
        {"id": str(uuid4()), "risk_type": "knowledge_silo", "severity": "high", "score": 0.82, "predicted_at": now.isoformat(), "evidence_node_ids": [], "resolved": False},
        {"id": str(uuid4()), "risk_type": "repeated_failure", "severity": "medium", "score": 0.61, "predicted_at": now.isoformat(), "evidence_node_ids": [], "resolved": False},
        {"id": str(uuid4()), "risk_type": "architectural_drift", "severity": "low", "score": 0.35, "predicted_at": now.isoformat(), "evidence_node_ids": [], "resolved": False},
    ]

    # --- Contradictions ---
    contradictions = [
        {"id": str(uuid4()), "node_a_id": decisions[2]["id"], "node_b_id": decisions[3]["id"], "contradiction_type": "logical", "severity": 0.88, "explanation": "Decision to adopt GraphQL directly contradicts the subsequent decision to revert to REST. The original decision underestimated migration complexity.", "detected_at": now.isoformat(), "resolved": True},
        {"id": str(uuid4()), "node_a_id": decisions[5]["id"], "node_b_id": decisions[1]["id"], "contradiction_type": "temporal", "severity": 0.42, "explanation": "LangGraph orchestration design assumes synchronous state updates, but Pub/Sub messaging is inherently asynchronous. Coordination strategy not yet defined.", "detected_at": now.isoformat(), "resolved": False},
    ]

    with driver.session(database=db) as session:
        # Create nodes
        for p in persons:
            session.run("MERGE (n:Person {id: $id}) SET n += $props", {"id": p["id"], "props": p})
        for d in decisions:
            session.run("MERGE (n:Decision {id: $id}) SET n += $props", {"id": d["id"], "props": d})
        for c in concepts:
            session.run("MERGE (n:Concept {id: $id}) SET n += $props", {"id": c["id"], "props": c})
        for r in risks:
            session.run("MERGE (n:Risk {id: $id}) SET n += $props", {"id": r["id"], "props": r})
        for ct in contradictions:
            session.run("MERGE (n:Contradiction {id: $id}) SET n += $props", {"id": ct["id"], "props": ct})

        # MADE_BY edges: decisions[0,1,6] by Sarah Chen (CTO)
        for d_idx in [0, 1, 6]:
            session.run(
                "MATCH (d:Decision {id: $d_id}), (p:Person {id: $p_id}) "
                "MERGE (d)-[:MADE_BY]->(p)",
                {"d_id": decisions[d_idx]["id"], "p_id": persons[0]["id"]},
            )
        # decisions[2,3] by Marcus
        for d_idx in [2, 3]:
            session.run(
                "MATCH (d:Decision {id: $d_id}), (p:Person {id: $p_id}) "
                "MERGE (d)-[:MADE_BY]->(p)",
                {"d_id": decisions[d_idx]["id"], "p_id": persons[1]["id"]},
            )
        # decisions[4] by Sarah, decisions[5] by Marcus, decisions[7] by Aiko
        for d_idx, p_idx in [(4, 0), (5, 1), (7, 4)]:
            session.run(
                "MATCH (d:Decision {id: $d_id}), (p:Person {id: $p_id}) "
                "MERGE (d)-[:MADE_BY]->(p)",
                {"d_id": decisions[d_idx]["id"], "p_id": persons[p_idx]["id"]},
            )

        # SUPERSEDED_BY: GraphQL decision superseded by REST revert
        session.run(
            "MATCH (a:Decision {id: $a}), (b:Decision {id: $b}) MERGE (a)-[:SUPERSEDED_BY]->(b)",
            {"a": decisions[2]["id"], "b": decisions[3]["id"]},
        )

        # INFLUENCED_BY: REST revert influenced by Pub/Sub decision
        session.run(
            "MATCH (a:Decision {id: $a}), (b:Decision {id: $b}) MERGE (a)-[:INFLUENCED_BY]->(b)",
            {"a": decisions[3]["id"], "b": decisions[1]["id"]},
        )

        # HAS_EXPERTISE_IN
        expertise_map = [
            (0, 0), (0, 2),  # Sarah: auth-system, ml-inference
            (1, 4), (1, 2),  # Marcus: database-schema, ml-inference
            (3, 3),          # Jake: frontend-architecture
            (4, 1),          # Aiko: payment-pipeline
        ]
        for p_idx, c_idx in expertise_map:
            session.run(
                "MATCH (p:Person {id: $p_id}), (c:Concept {id: $c_id}) "
                "MERGE (p)-[:HAS_EXPERTISE_IN]->(c)",
                {"p_id": persons[p_idx]["id"], "c_id": concepts[c_idx]["id"]},
            )

        # REFERENCES: some decisions reference concepts
        session.run(
            "MATCH (d:Decision {id: $d}), (c:Concept {id: $c}) MERGE (d)-[:REFERENCES]->(c)",
            {"d": decisions[4]["id"], "c": concepts[0]["id"]},  # Clerk -> auth-system
        )
        session.run(
            "MATCH (d:Decision {id: $d}), (c:Concept {id: $c}) MERGE (d)-[:REFERENCES]->(c)",
            {"d": decisions[0]["id"], "c": concepts[4]["id"]},  # Neo4j -> database-schema
        )

        # Count nodes
        counts = {}
        for label in ["Person", "Decision", "Concept", "Risk", "Contradiction"]:
            result = session.run(f"MATCH (n:{label}) RETURN count(n) AS c")
            counts[label] = result.single()["c"]

    driver.close()

    print("Seed complete. Node counts:")
    for label, count in counts.items():
        print(f"  {label}: {count}")


if __name__ == "__main__":
    main()
