"""listCategories Lambda handler.

GET /categories — list all categories (public).

The categories table is small and low-traffic, so a full Scan is acceptable
and there is no pagination. Results are sorted by name for a stable order.

Response:
    { "items": [ <category>, ... ] }
"""

from aws_lambda_powertools import Logger

from salescatalog_shared import db, http

logger = Logger()


@logger.inject_lambda_context(log_event=False)
def lambda_handler(event, context):
    """Entry point for the listCategories Lambda."""
    table = db.categories_table()

    items: list[dict] = []
    start_key = None
    # Drain all pages: the table is intentionally small.
    while True:
        kwargs = {"ExclusiveStartKey": start_key} if start_key else {}
        result = table.scan(**kwargs)
        items.extend(result.get("Items", []))
        start_key = result.get("LastEvaluatedKey")
        if not start_key:
            break

    items.sort(key=lambda c: str(c.get("name", "")).lower())

    logger.info("Listed categories", extra={"count": len(items)})
    return http.ok({"items": items})
