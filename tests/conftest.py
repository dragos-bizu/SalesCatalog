"""Pytest configuration shared by the whole backend test suite.

Makes the Lambda Layer package importable (``salescatalog_shared``) and the
individual Lambda handler modules importable, without installing anything.
"""

import os
import sys

import pytest

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Layer package lives under src/shared/python/ (Lambda layer convention).
_LAYER_PATH = os.path.join(_ROOT, "src", "shared", "python")

if _LAYER_PATH not in sys.path:
    sys.path.insert(0, _LAYER_PATH)


class FakeLambdaContext:
    """Minimal Lambda context object for aws-lambda-powertools.

    The ``inject_lambda_context`` decorator reads these attributes; real
    Lambda always supplies them, so tests provide an equivalent stand-in.
    """

    function_name = "test-function"
    memory_limit_in_mb = 256
    invoked_function_arn = (
        "arn:aws:lambda:us-east-1:000000000000:function:test-function"
    )
    aws_request_id = "test-request-id"


@pytest.fixture()
def lambda_context():
    """Return a fake Lambda context instance."""
    return FakeLambdaContext()
