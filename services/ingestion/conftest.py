import os
import sys

# Project root → shared/ importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
# Service root → connectors/, pipeline, etc. importable
sys.path.insert(0, os.path.dirname(__file__))
