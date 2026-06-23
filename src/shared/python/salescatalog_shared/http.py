"""HTTP request/response helpers shared by all SalesCatalog Lambdas.

Centralizes JSON response building and request body parsing so handlers stay
thin and consistent. CORS headers are returned on every response; the API
Gateway HTTP API also applies CORS, but returning them here keeps direct
Lambda invocations and local testing consistent.
"""

from __future__ import annotations

import decimal
import json
from typing import Any

_DEFAULT_HEADERS = {
    "Content-Type": "application/json",
}


class _DecimalEncoder(json.JSONEncoder):
    """JSON encoder that renders DynamoDB ``Decimal`` values as numbers.

    Integers are emitted as ``int``; everything else as ``float``.
    """

    def default(self, o: Any) -> Any:  # noqa: D102 - see class docstring
        if isinstance(o, decimal.Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)


def response(status_code: int, body: Any) -> dict[str, Any]:
    """Build an API Gateway proxy response with a JSON body."""
    return {
        "statusCode": status_code,
        "headers": dict(_DEFAULT_HEADERS),
        "body": json.dumps(body, cls=_DecimalEncoder),
    }


def ok(body: Any) -> dict[str, Any]:
    """200 OK."""
    return response(200, body)


def created(body: Any) -> dict[str, Any]:
    """201 Created."""
    return response(201, body)


def no_content() -> dict[str, Any]:
    """204 No Content (empty body)."""
    return {"statusCode": 204, "headers": dict(_DEFAULT_HEADERS), "body": ""}


def error(status_code: int, message: str) -> dict[str, Any]:
    """Build a JSON error response of the form ``{"message": ...}``."""
    return response(status_code, {"message": message})


def parse_json_body(event: dict[str, Any]) -> dict[str, Any]:
    """Parse and return the JSON object from an API Gateway event body.

    Returns an empty dict when there is no body.

    Raises:
        ValueError: if the body is present but is not a valid JSON object.
    """
    raw = event.get("body")
    if raw is None or raw == "":
        return {}
    try:
        parsed = json.loads(raw)
    except (ValueError, TypeError) as exc:
        raise ValueError("Request body is not valid JSON") from exc
    if not isinstance(parsed, dict):
        raise ValueError("Request body must be a JSON object")
    return parsed
