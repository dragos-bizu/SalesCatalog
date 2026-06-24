"""getProduct Lambda handler.

GET /products/{id} — get a single product by id (public).

Response:
    200 -> the product object
    404 -> when no product with that id exists
"""

from aws_lambda_powertools import Logger

from salescatalog_shared import db, http

logger = Logger()

# Internal-only fields removed before returning a product to clients.
_INTERNAL_FIELDS = ("nameLower",)


def _clean(item: dict) -> dict:
    """Strip internal-only attributes from a product item."""
    return {k: v for k, v in item.items() if k not in _INTERNAL_FIELDS}


@logger.inject_lambda_context(log_event=False)
def lambda_handler(event, context):
    """Entry point for the getProduct Lambda."""
    product_id = (event.get("pathParameters") or {}).get("id")
    if not product_id:
        return http.error(400, "Missing product id")

    result = db.products_table().get_item(Key={"id": product_id})
    item = result.get("Item")
    if not item:
        logger.info("Product not found", extra={"id": product_id})
        return http.error(404, "Product not found")

    return http.ok(_clean(item))
