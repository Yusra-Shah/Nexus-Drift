from __future__ import annotations

import hashlib
import hmac
import json
import pytest

from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock


@pytest.fixture()
def client(monkeypatch):
    monkeypatch.setenv("GITHUB_WEBHOOK_SECRET", "test-secret")
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "test-project")

    from main import app

    with TestClient(app, raise_server_exceptions=False) as c:
        c.app.state.graph = AsyncMock()
        c.app.state.firestore = MagicMock()
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
