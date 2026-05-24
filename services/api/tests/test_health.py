from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch


@pytest.fixture()
def client():
    with (
        patch("shared.graph.neo4j_client.AsyncGraphDatabase"),
        patch("shared.graph.pinecone_client.Pinecone"),
        patch("google.cloud.firestore.Client"),
    ):
        from main import app

        app.state.graph = AsyncMock()
        app.state.graph.ping = AsyncMock(return_value=True)
        app.state.firestore = MagicMock()

        with TestClient(app, raise_server_exceptions=False) as c:
            yield c


def test_health_returns_200(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "version" in data
    assert "dependencies" in data


def test_health_includes_request_id_header(client: TestClient) -> None:
    response = client.get("/api/health")
    assert "X-Request-ID" in response.headers
