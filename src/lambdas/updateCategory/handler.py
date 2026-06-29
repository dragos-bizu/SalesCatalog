"""updateCategory Lambda handler.

PUT /categories/{id} — rename a category. Admin only (Cognito JWT).

Request body:
    { "name": "string (required, non-empty)" }

Enforces case-insensitive name uniqueness (excluding the category being
updated). 'updatedAt' is refreshed; 'createdAt' is preserved.

Response:
    200 -> the updated category
    400 -> validation error
    404 -> category not found
    409 -> another category already uses this name (case-insensitive)
"""

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


def _name_taken_by_other(table, name_lower: str, current_id: str) -> bool:
    """Return True if a *different* category already uses this lowercased name.

    Note: no ``Limit`` is used because DynamoDB applies ``Limit`` to items
    *read* before the filter runs, which could miss a match. The categories
    table is small, so scanning one page is acceptable.
    """
    result = table.scan(
        FilterExpression=Attr("nameLower").eq(name_lower) & Attr("id").ne(current_id),
        ProjectionExpression="id",
    )
    return bool(result.get("Items"))


@logger.inject_lambda_context(log_event=False)
def lambda_handler(event, context):
    """Entry point for the updateCategory Lambda."""
    try:
        auth.require_admin(event)
    except auth.UnauthorizedError as exc:
        return http.error(401, str(exc))
    except auth.ForbiddenError as exc:
        return http.error(403, str(exc))

    category_id = (event.get("pathParameters") or {}).get("id")
    if not category_id:
        return http.error(400, "Missing category id")

    try:
        body = http.parse_json_body(event)
    except ValueError as exc:
        return http.error(400, str(exc))

    name = str(body.get("name", "")).strip()
    if not name:
        return http.error(400, "Field 'name' is required")

    table = db.categories_table()
    existing = table.get_item(Key={"id": category_id}).get("Item")
    if not existing:
        return http.error(404, "Category not found")

    name_lower = name.lower()
    if _name_taken_by_other(table, name_lower, category_id):
        return http.error(409, "A category with this name already exists")

    merged = {
        **existing,
        "name": name,
        "nameLower": name_lower,
        "updatedAt": _now_iso(),
    }
    table.put_item(Item=merged)

    logger.info("Updated category", extra={"id": category_id})
    return http.ok(_clean(merged))
