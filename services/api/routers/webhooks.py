from __future__ import annotations

import hashlib
import hmac
import os
import time
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request, Response

from shared.models.agent_events import RawArtifactEvent
from shared.models.graph_nodes import ArtifactSource
from shared.utils.pubsub import publish_message
from shared.utils.security import sanitize_artifact_content

router = APIRouter()


def _verify_github_signature(body: bytes, signature_header: str | None) -> bool:
    secret = os.environ.get("GITHUB_WEBHOOK_SECRET", "")
    if not secret or not signature_header:
        return False
    expected = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header)


def _verify_slack_signature(body: bytes, timestamp: str | None, signature: str | None) -> bool:
    secret = os.environ.get("SLACK_SIGNING_SECRET", "")
    if not secret or not timestamp or not signature:
        return False
    if abs(time.time() - float(timestamp)) > 300:
        return False
    base = f"v0:{timestamp}:{body.decode()}"
    expected = "v0=" + hmac.new(secret.encode(), base.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/api/webhooks/github")
async def github_webhook(request: Request) -> dict[str, Any]:
    body = await request.body()
    sig = request.headers.get("X-Hub-Signature-256")
    if not _verify_github_signature(body, sig):
        raise HTTPException(status_code=401, detail="Invalid GitHub webhook signature")

    payload = await request.json()
    event_type = request.headers.get("X-GitHub-Event", "unknown")
    topic = os.environ.get("PUBSUB_TOPIC_RAW_ARTIFACTS", "nexusdrift-raw-artifacts")

    content = sanitize_artifact_content(str(payload))
    event = RawArtifactEvent(
        source=ArtifactSource.github,
        content=content,
        metadata={"event_type": event_type, "delivery": request.headers.get("X-GitHub-Delivery")},
    )
    publish_message(topic, event)
    return {"status": "accepted", "artifact_id": str(event.artifact_id)}


@router.post("/api/webhooks/slack")
async def slack_webhook(request: Request) -> Response:
    body = await request.body()
    timestamp = request.headers.get("X-Slack-Request-Timestamp")
    sig = request.headers.get("X-Slack-Signature")
    if not _verify_slack_signature(body, timestamp, sig):
        raise HTTPException(status_code=401, detail="Invalid Slack webhook signature")

    payload = await request.json()

    # Slack URL verification challenge
    if payload.get("type") == "url_verification":
        return Response(content=payload["challenge"], media_type="text/plain")

    topic = os.environ.get("PUBSUB_TOPIC_RAW_ARTIFACTS", "nexusdrift-raw-artifacts")
    content = sanitize_artifact_content(str(payload))
    event = RawArtifactEvent(
        source=ArtifactSource.slack,
        content=content,
        metadata={"event_type": payload.get("type")},
    )
    publish_message(topic, event)
    return Response(status_code=200)


@router.post("/api/webhooks/clerk")
async def clerk_webhook(request: Request) -> dict[str, Any]:
    secret = os.environ.get("CLERK_WEBHOOK_SECRET", "")
    body = await request.body()
    svix_id = request.headers.get("svix-id")
    svix_timestamp = request.headers.get("svix-timestamp")
    svix_signature = request.headers.get("svix-signature")

    if secret and not (svix_id and svix_timestamp and svix_signature):
        raise HTTPException(status_code=401, detail="Missing Svix headers")

    payload = await request.json()
    event_type = payload.get("type")
    data = payload.get("data", {})
    graph = request.app.state.graph

    if event_type == "user.created":
        from shared.models.graph_nodes import Person
        person = Person(
            id=data.get("id", str(uuid4())),
            name=f"{data.get('first_name', '')} {data.get('last_name', '')}".strip(),
            role="member",
            team="unknown",
        )
        props = person.model_dump(mode="json")
        await graph.create_node("Person", props)

    elif event_type == "user.deleted":
        user_id = data.get("id")
        if user_id:
            await graph.execute_query("MATCH (n:Person {id: $id}) DETACH DELETE n", {"id": user_id})

    return {"status": "processed", "event_type": event_type}
