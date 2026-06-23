"""SalesCatalog shared helpers package (Lambda Layer).

Sub-modules:
    - db    -> DynamoDB resource/table handles + pagination cursors
    - auth  -> admin identity extraction from verified JWT claims
    - http  -> JSON response builders + request body parsing
"""

__all__ = ["db", "auth", "http"]
