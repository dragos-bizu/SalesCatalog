"""DynamoDB helpers shared by all SalesCatalog Lambdas.

Responsibilities:
    - Provide cached DynamoDB resource/table handles (created once per warm
      container, never at import time so unit tests can patch the environment).
    - Encode/decode opaque pagination cursors (DynamoDB ``LastEvaluatedKey``
      <-> base64 string returned to clients).

Table names are read from environment variables so nothing is hard-coded:
    - ``PRODUCTS_TABLE``
    - ``CATEGORIES_TABLE``
"""

from __future__ import annotations

import base64
import json
import os
from functools import lru_cache
from typing import Any

import boto3

# Default page size for paginated list endpoints.
DEFAULT_PAGE_SIZE = 20
# Hard upper bound so a caller cannot request an unbounded page.
MAX_PAGE_SIZE = 100


@lru_cache(maxsize=1)
def _resource():
    """Return a cached DynamoDB service resource.

    Cached for the lifetime of the warm Lambda container. Not created at
    import time, so tests may set AWS_* / endpoint env vars beforehand.
    """
    return boto3.resource("dynamodb")


def _table_name(env_var: str) -> str:
    """Read a required table name from the environment.

    Raises:
        RuntimeError: if the environment variable is missing or empty.
    """
    name = os.environ.get(env_var)
    if not name:
        raise RuntimeError(f"Environment variable {env_var} is not set")
    return name


def products_table():
    """Return the DynamoDB Table handle for products."""
    # Resolve the name first so a missing env var fails fast with a clear
    # RuntimeError before any boto3 client (which needs a region) is created.
    name = _table_name("PRODUCTS_TABLE")
    return _resource().Table(name)


def categories_table():
    """Return the DynamoDB Table handle for categories."""
    name = _table_name("CATEGORIES_TABLE")
    return _resource().Table(name)


def clamp_page_size(value: Any) -> int:
    """Clamp a requested page size into the allowed range.

    Falls back to ``DEFAULT_PAGE_SIZE`` when ``value`` is missing or invalid.
    """
    try:
        size = int(value)
    except (TypeError, ValueError):
        return DEFAULT_PAGE_SIZE
    if size < 1:
        return DEFAULT_PAGE_SIZE
    return min(size, MAX_PAGE_SIZE)


def encode_cursor(last_evaluated_key: dict | None) -> str | None:
    """Encode a DynamoDB ``LastEvaluatedKey`` as an opaque base64 token.

    Returns ``None`` when there is no further page.
    """
    if not last_evaluated_key:
        return None
    raw = json.dumps(last_evaluated_key, separators=(",", ":"), sort_keys=True)
    return base64.urlsafe_b64encode(raw.encode("utf-8")).decode("ascii")


def decode_cursor(cursor: str | None) -> dict | None:
    """Decode an opaque base64 cursor back into a DynamoDB key.

    Returns ``None`` when ``cursor`` is falsy.

    Raises:
        ValueError: if the cursor is present but malformed.
    """
    if not cursor:
        return None
    try:
        raw = base64.urlsafe_b64decode(cursor.encode("ascii"))
        key = json.loads(raw.decode("utf-8"))
    except (ValueError, json.JSONDecodeError) as exc:
        raise ValueError("Invalid pagination cursor") from exc
    if not isinstance(key, dict):
        raise ValueError("Invalid pagination cursor")
    return key
