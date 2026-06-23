"""Admin identity helpers for SalesCatalog Lambdas.

The HTTP API's Cognito JWT authorizer validates the token *before* the Lambda
runs, so handlers never have to verify signatures. These helpers simply read
the already-verified claims that API Gateway places into the event under
``requestContext.authorizer.jwt.claims``.

Because every user in the Cognito pool is an administrator by definition,
"authenticated" is equivalent to "admin".
"""

from __future__ import annotations

from typing import Any


class UnauthorizedError(Exception):
    """Raised when admin claims are missing from the request context."""


def get_claims(event: dict[str, Any]) -> dict[str, Any]:
    """Return the verified JWT claims from an API Gateway (HTTP API) event.

    Raises:
        UnauthorizedError: if no JWT claims are present (e.g. the route was
            reached without the authorizer, which should never happen for
            admin routes).
    """
    claims = (
        event.get("requestContext", {})
        .get("authorizer", {})
        .get("jwt", {})
        .get("claims")
    )
    if not claims:
        raise UnauthorizedError("Missing authentication claims")
    return claims


def get_admin_identity(event: dict[str, Any]) -> dict[str, str]:
    """Extract a small, normalized admin identity from the request.

    Returns a dict with:
        - ``sub``:   Cognito subject (stable unique id)
        - ``email``: admin email (may be empty if not in the token)

    Raises:
        UnauthorizedError: if the request carries no verified claims.
    """
    claims = get_claims(event)
    return {
        "sub": str(claims.get("sub", "")),
        "email": str(claims.get("email", "")),
    }
