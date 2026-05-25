from __future__ import annotations

import sys
import types
from unittest.mock import AsyncMock, MagicMock



def _inject_fastmcp_stub() -> None:
    """Inject a minimal fastmcp stub so server.py can be imported in tests."""
    if "fastmcp" not in sys.modules:
        stub = types.ModuleType("fastmcp")

        class FastMCP:
            def __init__(self, name: str, instructions: str = "") -> None:
                self.name = name
                self._tools: list = []

            def tool(self):
                def decorator(fn):
                    self._tools.append(fn)
                    return fn
                return decorator

            def run(self, *args, **kwargs) -> None:
                pass

        stub.FastMCP = FastMCP
        sys.modules["fastmcp"] = stub


def test_server_imports_without_error() -> None:
    _inject_fastmcp_stub()
    import graph_tools
    graph_tools.init(AsyncMock(), MagicMock())

    if "server" in sys.modules:
        del sys.modules["server"]
    import server  # noqa: F401

    assert hasattr(server, "mcp")


def test_mcp_has_expected_tools() -> None:
    _inject_fastmcp_stub()
    import graph_tools
    graph_tools.init(AsyncMock(), MagicMock())

    if "server" in sys.modules:
        del sys.modules["server"]
    import server

    tool_names = [fn.__name__ for fn in getattr(server.mcp, "_tools", [])]
    expected = [
        "get_recent_decisions",
        "get_person_expertise",
        "get_active_risks",
        "get_concept_graph",
        "get_contradictions",
        "get_consciousness_score",
        "get_org_summary",
        "find_decision_path",
        "search_nodes",
    ]
    for name in expected:
        assert name in tool_names, f"Missing tool: {name}"


def test_stub_mcp_when_fastmcp_unavailable() -> None:
    saved = sys.modules.pop("fastmcp", None)
    if "server" in sys.modules:
        del sys.modules["server"]

    try:
        import graph_tools
        graph_tools.init(AsyncMock(), MagicMock())
        import server
        assert hasattr(server.mcp, "run")
    finally:
        if saved is not None:
            sys.modules["fastmcp"] = saved
        sys.modules.pop("server", None)
