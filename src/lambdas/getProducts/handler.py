"""getProducts Lambda handler.

GET /products — list products (public).

Query parameters (all optional):
    - limit      : page size (default 20, max 100)
    - cursor     : opaque pagination token from a previous response
    - categoryId : restrict to a category (uses the "byCategory" GSI)
    - q          : case-insensitive substring match on the product name

Access path:
    - categoryId present -> Query the byCategory GSI (sorted by createdAt)
    - categoryId absent  -> Scan the table
    - q present          -> adds a contains(nameLower, q) filter on top

Response:
    { "items": [ <product>, ... ], "nextCursor": <token|null> }
"""

from aws_lambda_powertools import Logger
from boto3.dynamodb.conditions import Attr, Key
from botocore.exceptions import ClientError

from salescatalog_shared import db, http

logger = Logger()

# Internal-only fields removed before returning a product to clients.
_INTERNAL_FIELDS = ("nameLower",)


def _clean(item: dict) -> dict:
    """Strip internal-only attributes from a product item."""
    return {k: v for k, v in item.items() if k not in _INTERNAL_FIELDS}


@logger.inject_lambda_context(log_event=False)
def lambda_handler(event, context):
    """Entry point for the getProducts Lambda."""
    params = event.get("queryStringParameters") or {}

    limit = db.clamp_page_size(params.get("limit"))
    category_id = params.get("categoryId")
    q = (params.get("q") or "").strip().lower()

    try:
        start_key = db.decode_cursor(params.get("cursor"))
    except ValueError:
        return http.error(400, "Invalid pagination cursor")

    table = db.products_table()

    # Build common kwargs.
    kwargs: dict = {"Limit": limit}
    if start_key:
        kwargs["ExclusiveStartKey"] = start_key

    name_filter = Attr("nameLower").contains(q) if q else None

    try:
        if category_id:
            # Efficient path: query the GSI partition for this category.
            kwargs["IndexName"] = "byCategory"
            kwargs["KeyConditionExpression"] = Key("categoryId").eq(category_id)
            kwargs["ScanIndexForward"] = False  # newest first
            if name_filter is not None:
                kwargs["FilterExpression"] = name_filter
            result = table.query(**kwargs)
        else:
            # No category: full scan (acceptable at the expected traffic).
            if name_filter is not None:
                kwargs["FilterExpression"] = name_filter
            result = table.scan(**kwargs)
    except ClientError as exc:
        # A cursor that passed shape validation can still be rejected by
        # DynamoDB (e.g. a scan cursor replayed against the GSI query). That
        # is a client input problem, not a server error.
        if exc.response["Error"]["Code"] == "ValidationException":
            logger.info("Rejected invalid pagination cursor")
            return http.error(400, "Invalid pagination cursor")
        raise

    items = [_clean(it) for it in result.get("Items", [])]
    next_cursor = db.encode_cursor(result.get("LastEvaluatedKey"))

    logger.info(
        "Listed products",
        extra={"count": len(items), "categoryId": category_id, "hasQuery": bool(q)},
    )
    return http.ok({"items": items, "nextCursor": next_cursor})
