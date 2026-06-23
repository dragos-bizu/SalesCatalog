"""deleteProduct Lambda handler.

DELETE /products/{id} — delete a product. Admin only (Cognito JWT).

Uses a conditional delete so a missing product yields 404 rather than a
silent success.

Response:
    204 -> deleted (no content)
    400 -> missing id
    404 -> product not found
"""

from aws_lambda_powertools import Logger
from botocore.exceptions import ClientError

from salescatalog_shared import db, http

logger = Logger()


@logger.inject_lambda_context(log_event=False)
def lambda_handler(event, context):
    """Entry point for the deleteProduct Lambda."""
    product_id = (event.get("pathParameters") or {}).get("id")
    if not product_id:
        return http.error(400, "Missing product id")

    try:
        db.products_table().delete_item(
            Key={"id": product_id},
            ConditionExpression="attribute_exists(id)",
        )
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
            logger.info("Product not found for delete", extra={"id": product_id})
            return http.error(404, "Product not found")
        raise

    logger.info("Deleted product", extra={"id": product_id})
    return http.no_content()
