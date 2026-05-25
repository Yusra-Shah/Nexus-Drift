from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock


@pytest.fixture()
def client():
    from main import app

    with TestClient(app, raise_server_exceptions=False) as c:
        c.app.state.graph = AsyncMock()
        c.app.state.graph.ping = AsyncMock(return_value=True)
        c.app.state.firestore = MagicMock()
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
