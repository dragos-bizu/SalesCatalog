"""createProduct Lambda handler.

POST /products — create a new product. Admin only (Cognito JWT).

Request body:
    {
      "name": "string (required, non-empty)",
      "categoryId": "uuid (required, must exist)",
      "ean": "string (optional)",
      "description": "string (optional)",
      "images": ["key", ...]  (optional)
    }

Server-generated fields: id, nameLower, createdAt, updatedAt.

Response:
    201 -> the created product
    400 -> validation error
"""

import uuid
from datetime import datetime, timezone

from aws_lambda_powertools import Logger

from salescatalog_shared import db, http

logger = Logger()

# Internal-only fields removed before returning a product to clients.
_INTERNAL_FIELDS = ("nameLower",)


def _clean(item: dict) -> dict:
    """Strip internal-only attributes from a product item."""
    return {k: v for k, v in item.items() if k not in _INTERNAL_FIELDS}


def _now_iso() -> str:
    """Current UTC time as an ISO-8601 string (seconds precision, Z suffix)."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _category_exists(category_id: str) -> bool:
    """Return True if a category with the given id exists."""
    result = db.categories_table().get_item(Key={"id": category_id})
    return "Item" in result


@logger.inject_lambda_context(log_event=False)
def lambda_handler(event, context):
    """Entry point for the createProduct Lambda."""
    try:
        body = http.parse_json_body(event)
    except ValueError as exc:
        return http.error(400, str(exc))

    # --- validate required fields ---
    name = str(body.get("name", "")).strip()
    if not name:
        return http.error(400, "Field 'name' is required")

    category_id = str(body.get("categoryId", "")).strip()
    if not category_id:
        return http.error(400, "Field 'categoryId' is required")
    if not _category_exists(category_id):
        return http.error(400, "Category does not exist")

    # --- optional fields ---
    images = body.get("images", [])
    if not isinstance(images, list):
        return http.error(400, "Field 'images' must be a list")

    now = _now_iso()
    item = {
        "id": str(uuid.uuid4()),
        "ean": str(body.get("ean", "")),
        "categoryId": category_id,
        "name": name,
        "nameLower": name.lower(),
        "description": str(body.get("description", "")),
        "images": images,
        "createdAt": now,
        "updatedAt": now,
    }

    db.products_table().put_item(Item=item)

    logger.info("Created product", extra={"id": item["id"]})
    return http.created(_clean(item))
