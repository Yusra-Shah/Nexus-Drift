from __future__ import annotations

import pytest

from shared.utils.security import generate_trace_id, sanitize_artifact_content, validate_uuid


def test_sanitize_strips_html() -> None:
    result = sanitize_artifact_content("<b>Hello</b> world")
    assert "<b>" not in result
    assert "Hello" in result


def test_sanitize_removes_null_bytes() -> None:
    result = sanitize_artifact_content("Hello\x00World")
    assert "\x00" not in result


def test_sanitize_enforces_50kb_limit() -> None:
    large = "a" * (60 * 1024)
    result = sanitize_artifact_content(large)
    assert len(result.encode("utf-8")) <= 50 * 1024


def test_validate_uuid_valid() -> None:
    import uuid
    assert validate_uuid(str(uuid.uuid4())) is True


def test_validate_uuid_invalid() -> None:
    assert validate_uuid("not-a-uuid") is False
    assert validate_uuid("") is False


def test_generate_trace_id_is_uuid() -> None:
    import uuid
    trace_id = generate_trace_id()
    uuid.UUID(trace_id)  # raises if invalid
