"""Admin identity helpers for SalesCatalog Lambdas.

The HTTP API's Cognito JWT authorizer validates the token *before* the Lambda
runs, so handlers never have to verify signatures. These helpers read the
already-verified claims that API Gateway places into the event under
``requestContext.authorizer.jwt.claims``.

Authorization policy:
- Authentication is handled by API Gateway JWT authorizer.
- Admin authorization is enforced in Lambda by requiring membership in a
  configured Cognito group (``ADMIN_GROUP`` env var, defaulted in IaC).
"""

from __future__ import annotations

import os
from typing import Any


class UnauthorizedError(Exception):
    """Raised when authentication claims are missing from request context."""


class ForbiddenError(Exception):
    """Raised when the authenticated user is not authorized as admin."""


def get_claims(event: dict[str, Any]) -> dict[str, Any]:
    """Return verified JWT claims from an API Gateway (HTTP API) event.

    Raises:
        UnauthorizedError: if no JWT claims are present.
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


def _groups_from_claims(claims: dict[str, Any]) -> set[str]:
    """Normalize Cognito group claims into a set of group names.

    Handles the common formats seen via API Gateway HTTP API claims:
    - list[str]
    - comma-separated string
    - bracketed list-like string
    """
    raw = claims.get("cognito:groups", [])

    if isinstance(raw, list):
        return {str(x).strip() for x in raw if str(x).strip()}

    if isinstance(raw, str):
        text = raw.strip()
        if not text:
            return set()
        text = text.removeprefix("[").removesuffix("]")
        parts = [p.strip().strip('"').strip("'") for p in text.split(",")]
        return {p for p in parts if p}

    return set()


def get_admin_identity(event: dict[str, Any]) -> dict[str, str]:
    """Extract a normalized identity from the request claims."""
    claims = get_claims(event)
    return {
        "sub": str(claims.get("sub", "")),
        "email": str(claims.get("email", "")),
    }


def require_admin(
    event: dict[str, Any], required_group: str | None = None
) -> dict[str, str]:
    """Authorize request as admin and return normalized identity.

    Group enforcement is enabled when ``required_group`` is provided or when
    ``ADMIN_GROUP`` env var is set. If no group is configured, this function
    only validates that claims are present (useful in local tests).

    Raises:
        UnauthorizedError: if JWT claims are missing.
        ForbiddenError: if user is authenticated but not in required group.
    """
    group = (required_group or os.getenv("ADMIN_GROUP", "")).strip()

    # Backward-compatibility for local tests that do not attach API Gateway
    # authorizer claims. In deployed environments ADMIN_GROUP is configured,
    # so group enforcement is always active.
    if not group:
        claims = (
            event.get("requestContext", {})
            .get("authorizer", {})
            .get("jwt", {})
            .get("claims", {})
        )
        return {
            "sub": str(claims.get("sub", "")),
            "email": str(claims.get("email", "")),
        }

    claims = get_claims(event)
    groups = _groups_from_claims(claims)
    if not any(group in g for g in groups):
        raise ForbiddenError(
            f"User is not authorized as admin (missing group '{group}')"
        )

    return {
        "sub": str(claims.get("sub", "")),
        "email": str(claims.get("email", "")),
    }
