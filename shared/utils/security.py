from __future__ import annotations

import re
import unicodedata
import uuid

_MAX_CONTENT_BYTES = 50 * 1024  # 50 KB
_HTML_TAG_RE = re.compile(r"<[^>]+>")
_NULL_BYTES_RE = re.compile(r"\x00")


def sanitize_artifact_content(text: str) -> str:
    text = _HTML_TAG_RE.sub("", text)
    text = _NULL_BYTES_RE.sub("", text)
    text = unicodedata.normalize("NFKC", text)
    encoded = text.encode("utf-8")
    if len(encoded) > _MAX_CONTENT_BYTES:
        encoded = encoded[:_MAX_CONTENT_BYTES]
        text = encoded.decode("utf-8", errors="ignore")
    return text.strip()


def validate_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return True
    except (ValueError, AttributeError):
        return False


def generate_trace_id() -> str:
    return str(uuid.uuid4())
