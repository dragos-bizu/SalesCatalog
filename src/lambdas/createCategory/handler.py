"""createCategory Lambda handler.

POST /categories — create a new category. Admin only (Cognito JWT).

Request body:
    { "name": "string (required, non-empty)" }

Category names are unique case-insensitively: a 'nameLower' attribute is
stored and used to detect collisions.

Server-generated fields: id, nameLower, createdAt, updatedAt.

Response:
    201 -> the created category
    400 -> validation error
    409 -> a category with the same name (case-insensitive) already exists
"""

import uuid
from datetime import datetime, timezone

from aws_lambda_powertools import Logger
from boto3.dynamodb.conditions import Attr

from salescatalog_shared import auth, db, http

logger = Logger()

_INTERNAL_FIELDS = ("nameLower",)


def _clean(item: dict) -> dict:
    """Strip internal-only attributes from a category item."""
    return {k: v for k, v in item.items() if k not in _INTERNAL_FIELDS}


def _now_iso() -> str:
    """Current UTC time as an ISO-8601 string (seconds precision, Z suffix)."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _name_taken(table, name_lower: str) -> bool:
    """Return True if any category already uses this lowercased name.

    Note: no ``Limit`` is used because DynamoDB applies ``Limit`` to items
    *read* before the filter runs, which could miss a match. The categories
    table is small, so scanning one page is acceptable.
    """
    result = table.scan(
        FilterExpression=Attr("nameLower").eq(name_lower),
        ProjectionExpression="id",
    )
    return bool(result.get("Items"))


@logger.inject_lambda_context(log_event=False)
def lambda_handler(event, context):
    """Entry point for the createCategory Lambda."""
    try:
        auth.require_admin(event)
        body = http.parse_json_body(event)
    except auth.UnauthorizedError as exc:
        return http.error(401, str(exc))
    except auth.ForbiddenError as exc:
        return http.error(403, str(exc))
    except ValueError as exc:
        return http.error(400, str(exc))

    name = str(body.get("name", "")).strip()
    if not name:
        return http.error(400, "Field 'name' is required")

    table = db.categories_table()
    name_lower = name.lower()
    if _name_taken(table, name_lower):
        return http.error(409, "A category with this name already exists")

    now = _now_iso()
    item = {
        "id": str(uuid.uuid4()),
        "name": name,
        "nameLower": name_lower,
        "createdAt": now,
        "updatedAt": now,
    }
    table.put_item(Item=item)

    logger.info("Created category", extra={"id": item["id"]})
    return http.created(_clean(item))
