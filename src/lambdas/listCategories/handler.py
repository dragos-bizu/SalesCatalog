"""listCategories Lambda handler.

GET /categories — list all categories. Public.

This is a placeholder implementation that returns HTTP 501 Not Implemented.
The real logic is added in step 5.
"""
import json

from aws_lambda_powertools import Logger

logger = Logger()


@logger.inject_lambda_context(log_event=False)
def lambda_handler(event, context):
    """Entry point for the listCategories Lambda."""
    logger.info("listCategories invoked (stub)")
    return {
        "statusCode": 501,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"message": "Not Implemented", "function": "listCategories"}),
    }
