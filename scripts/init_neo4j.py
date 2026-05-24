"""Initialize Neo4j schema: constraints and indexes. Run once before first deployment."""
from __future__ import annotations

import os
import sys


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
        print("ERROR: NEO4J_URI and NEO4J_PASSWORD must be set in environment")
        sys.exit(1)

    schema_path = os.path.join(os.path.dirname(__file__), "..", "shared", "graph", "schema.cypher")
    with open(schema_path) as f:
        raw = f.read()

    statements = [
        line.strip()
        for line in raw.splitlines()
        if line.strip() and not line.strip().startswith("//")
    ]

    driver = GraphDatabase.driver(uri, auth=(username, password))
    with driver.session(database=os.environ.get("NEO4J_DATABASE", "neo4j")) as session:
        for stmt in statements:
            try:
                session.run(stmt)
                print(f"  OK  {stmt[:80]}")
            except Exception as exc:
                print(f"  ERR {stmt[:80]}\n      {exc}")

    driver.close()
    print("\nSchema initialization complete.")


if __name__ == "__main__":
    main()
