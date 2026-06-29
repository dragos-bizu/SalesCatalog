"""Unit tests for salescatalog_shared.auth."""

import pytest

from salescatalog_shared import auth


def _event_with_claims(claims):
    return {
        "requestContext": {"authorizer": {"jwt": {"claims": claims}}}
    }


def test_get_claims_returns_claims():
    event = _event_with_claims({"sub": "u1", "email": "a@b.com"})
    assert auth.get_claims(event) == {"sub": "u1", "email": "a@b.com"}


def test_get_claims_raises_when_missing():
    with pytest.raises(auth.UnauthorizedError):
        auth.get_claims({})


def test_get_claims_raises_when_empty():
    with pytest.raises(auth.UnauthorizedError):
        auth.get_claims(_event_with_claims({}))


def test_get_admin_identity_extracts_sub_and_email():
    event = _event_with_claims({"sub": "u1", "email": "admin@example.com"})
    assert auth.get_admin_identity(event) == {
        "sub": "u1",
        "email": "admin@example.com",
    }


def test_get_admin_identity_defaults_missing_email():
    event = _event_with_claims({"sub": "u1"})
    identity = auth.get_admin_identity(event)
    assert identity["sub"] == "u1"
    assert identity["email"] == ""


def test_get_admin_identity_raises_without_claims():
    with pytest.raises(auth.UnauthorizedError):
        auth.get_admin_identity({})


def test_require_admin_allows_when_group_matches_csv(monkeypatch):
    monkeypatch.setenv("ADMIN_GROUP", "admins")
    event = _event_with_claims({
        "sub": "u1",
        "email": "admin@example.com",
        "cognito:groups": "admins,other",
    })
    identity = auth.require_admin(event)
    assert identity["sub"] == "u1"


def test_require_admin_allows_when_group_matches_list(monkeypatch):
    monkeypatch.setenv("ADMIN_GROUP", "admins")
    event = _event_with_claims({
        "sub": "u1",
        "cognito:groups": ["users", "admins"],
    })
    assert auth.require_admin(event)["sub"] == "u1"


def test_require_admin_raises_forbidden_when_group_missing(monkeypatch):
    monkeypatch.setenv("ADMIN_GROUP", "admins")
    event = _event_with_claims({"sub": "u1", "cognito:groups": "users"})
    with pytest.raises(auth.ForbiddenError):
        auth.require_admin(event)


def test_require_admin_without_group_only_checks_auth(monkeypatch):
    monkeypatch.delenv("ADMIN_GROUP", raising=False)
    event = _event_with_claims({"sub": "u1"})
    assert auth.require_admin(event)["sub"] == "u1"
