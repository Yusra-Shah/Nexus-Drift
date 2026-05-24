from __future__ import annotations

import json
import os
from collections.abc import Callable
from typing import Any

from google.cloud import pubsub_v1
from pydantic import BaseModel


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

    def callback(message: pubsub_v1.subscriber.message.Message) -> None:
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
