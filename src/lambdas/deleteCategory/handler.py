"""deleteCategory Lambda handler.

DELETE /categories/{id} — delete a category. Admin only (Cognito JWT).

Deletion is blocked when any product still references the category, to avoid
leaving products with a dangling categoryId. The check queries the products
'byCategory' GSI.

Response:
    204 -> deleted (no content)
    400 -> missing id
    404 -> category not found
    409 -> category still has products
"""

from aws_lambda_powertools import Logger
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

from salescatalog_shared import db, http

logger = Logger()


def _has_products(category_id: str) -> bool:
    """Return True if at least one product references this category."""
    result = db.products_table().query(
        IndexName="byCategory",
        KeyConditionExpression=Key("categoryId").eq(category_id),
        Limit=1,
    )
    return bool(result.get("Items"))


@logger.inject_lambda_context(log_event=False)
def lambda_handler(event, context):
    """Entry point for the deleteCategory Lambda."""
    category_id = (event.get("pathParameters") or {}).get("id")
    if not category_id:
        return http.error(400, "Missing category id")

    if _has_products(category_id):
        logger.info("Blocked delete; category not empty", extra={"id": category_id})
        return http.error(409, "Category still has products")

    try:
        db.categories_table().delete_item(
            Key={"id": category_id},
            ConditionExpression="attribute_exists(id)",
        )
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return http.error(404, "Category not found")
        raise

    logger.info("Deleted category", extra={"id": category_id})
    return http.no_content()
