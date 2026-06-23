"""Pytest configuration shared by the whole backend test suite.

Makes the Lambda Layer package importable (``salescatalog_shared``) and the
individual Lambda handler modules importable, without installing anything.
"""

import os
import sys

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Layer package lives under src/shared/python/ (Lambda layer convention).
_LAYER_PATH = os.path.join(_ROOT, "src", "shared", "python")

if _LAYER_PATH not in sys.path:
    sys.path.insert(0, _LAYER_PATH)
