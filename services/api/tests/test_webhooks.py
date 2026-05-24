from __future__ import annotations

import hashlib
import hmac
import json
import os
import pytest

from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch


@pytest.fixture()
def client(monkeypatch):
    monkeypatch.setenv("GITHUB_WEBHOOK_SECRET", "test-secret")
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "test-project")

    with (
        patch("shared.graph.neo4j_client.AsyncGraphDatabase"),
        patch("shared.graph.pinecone_client.Pinecone"),
        patch("google.cloud.firestore.Client"),
        patch("shared.utils.pubsub.pubsub_v1.PublisherClient"),
    ):
        from main import app

        app.state.graph = AsyncMock()
        app.state.firestore = MagicMock()

        with TestClient(app, raise_server_exceptions=False) as c:
            yield c


def _github_sig(body: bytes, secret: str) -> str:
    return "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def test_github_webhook_valid_signature(client: TestClient) -> None:
    payload = json.dumps({"action": "opened", "number": 1}).encode()
    sig = _github_sig(payload, "test-secret")
    response = client.post(
        "/api/webhooks/github",
        content=payload,
        headers={"X-Hub-Signature-256": sig, "X-GitHub-Event": "pull_request"},
    )
    assert response.status_code == 200


def test_github_webhook_invalid_signature(client: TestClient) -> None:
    payload = json.dumps({"action": "opened"}).encode()
    response = client.post(
        "/api/webhooks/github",
        content=payload,
        headers={"X-Hub-Signature-256": "sha256=bad"},
    )
    assert response.status_code == 401
