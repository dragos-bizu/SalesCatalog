"""updateProduct Lambda handler.

PUT /products/{id} — update an existing product. Admin only (Cognito JWT).

Partial update: only the fields present in the request body are changed;
omitted fields are left untouched.

Updatable fields: name, categoryId, ean, description, images.
    - If 'name' is provided, 'nameLower' is regenerated.
    - If 'categoryId' is provided, it is validated against the categories table.
Server-managed fields (id, createdAt, nameLower) cannot be set by the client.
'updatedAt' is always refreshed.

Response:
    200 -> the updated product
    400 -> validation error
    404 -> product not found
"""

from datetime import datetime, timezone

from aws_lambda_powertools import Logger

from salescatalog_shared import db, http

logger = Logger()

_INTERNAL_FIELDS = ("nameLower",)
# Fields a client is allowed to update.
_UPDATABLE = ("name", "categoryId", "ean", "description", "images")


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
    """Entry point for the updateProduct Lambda."""
    product_id = (event.get("pathParameters") or {}).get("id")
    if not product_id:
        return http.error(400, "Missing product id")

    try:
        body = http.parse_json_body(event)
    except ValueError as exc:
        return http.error(400, str(exc))

    table = db.products_table()
    existing = table.get_item(Key={"id": product_id}).get("Item")
    if not existing:
        return http.error(404, "Product not found")

    # Build the set of changes from allowed fields only.
    updates: dict = {}

    if "name" in body:
        name = str(body["name"]).strip()
        if not name:
            return http.error(400, "Field 'name' must not be empty")
        updates["name"] = name
        updates["nameLower"] = name.lower()

    if "categoryId" in body:
        category_id = str(body["categoryId"]).strip()
        if not category_id:
            return http.error(400, "Field 'categoryId' must not be empty")
        if not _category_exists(category_id):
            return http.error(400, "Category does not exist")
        updates["categoryId"] = category_id

    if "ean" in body:
        updates["ean"] = str(body["ean"])

    if "description" in body:
        updates["description"] = str(body["description"])

    if "images" in body:
        if not isinstance(body["images"], list):
            return http.error(400, "Field 'images' must be a list")
        updates["images"] = body["images"]

    # Always refresh updatedAt.
    updates["updatedAt"] = _now_iso()

    merged = {**existing, **updates}
    table.put_item(Item=merged)

    logger.info("Updated product", extra={"id": product_id, "fields": list(updates)})
    return http.ok(_clean(merged))
