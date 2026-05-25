from __future__ import annotations

import json
import os
from collections.abc import Callable
from typing import Any

from pydantic import BaseModel

try:
    from google.cloud import pubsub_v1
except ImportError:
    class _Future:
        def result(self) -> str:
            return ""
        def cancel(self) -> None:
            pass

    class _Message:
        data: bytes = b""
        def ack(self) -> None: pass
        def nack(self) -> None: pass

    class _PublisherClient:
        def topic_path(self, project_id: str, topic_id: str) -> str:
            return f"projects/{project_id}/topics/{topic_id}"
        def publish(self, topic_path: str, data: bytes, **kwargs: Any) -> _Future:
            return _Future()

    class _SubscriberClient:
        def subscription_path(self, project_id: str, sub_id: str) -> str:
            return f"projects/{project_id}/subscriptions/{sub_id}"
        def subscribe(self, subscription_path: str, callback: Any) -> _Future:
            return _Future()
        def __enter__(self) -> "_SubscriberClient":
            return self
        def __exit__(self, *args: Any) -> None:
            pass

    class _PubSubV1:
        PublisherClient = _PublisherClient
        SubscriberClient = _SubscriberClient

        class subscriber:
            message = type("message", (), {"Message": _Message})

    pubsub_v1 = _PubSubV1()  # type: ignore[assignment]


def publish_message(topic_id: str, message: BaseModel) -> str:
    project_id = os.environ["GOOGLE_CLOUD_PROJECT"]
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)
    data = message.model_dump_json().encode("utf-8")
    future = publisher.publish(topic_path, data)
    return future.result()


def subscribe_and_process(
    subscription_id: str,
    handler_func: Callable[[dict[str, Any]], None],
    max_messages: int = 10,
) -> None:
    project_id = os.environ["GOOGLE_CLOUD_PROJECT"]
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    def callback(message: Any) -> None:
        try:
            data = json.loads(message.data.decode("utf-8"))
            handler_func(data)
            message.ack()
        except Exception:
            message.nack()

    streaming_pull_future = subscriber.subscribe(subscription_path, callback=callback)
    with subscriber:
        try:
            streaming_pull_future.result()
        except Exception:
            streaming_pull_future.cancel()
            streaming_pull_future.result()
