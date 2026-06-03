import sys
import os

_here = os.path.abspath(os.path.dirname(__file__))   # services/api/
_root = os.path.abspath(os.path.join(_here, "..", ".."))  # repo root

for p in (_root, _here):
    if p not in sys.path:
        sys.path.insert(0, p)


def pytest_runtest_setup(item: object) -> None:
    """Re-prioritize services/api/ before each api test.

    When pytest collects all services at once, each service conftest inserts
    its own directory at sys.path[0]. The last conftest loaded (alphabetically
    'watchtower') ends up first, so bare 'from main import app' resolves to
    services/watchtower/main.py. This hook fixes that before each api test.
    """
    fspath = str(getattr(item, "fspath", ""))
    if os.path.join("services", "api") in fspath or "services/api" in fspath:
        cached = sys.modules.get("main")
        if cached is not None:
            cached_file = getattr(cached, "__file__", "") or ""
            if not cached_file.startswith(_here):
                del sys.modules["main"]
        if _here in sys.path:
            sys.path.remove(_here)
        sys.path.insert(0, _here)
