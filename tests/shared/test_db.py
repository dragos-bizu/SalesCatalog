"""Unit tests for salescatalog_shared.db."""

import importlib

import pytest


@pytest.fixture()
def db(monkeypatch):
    """Import the db module fresh with table env vars set."""
    monkeypatch.setenv("PRODUCTS_TABLE", "test-products")
    monkeypatch.setenv("CATEGORIES_TABLE", "test-categories")
    module = importlib.import_module("salescatalog_shared.db")
    return importlib.reload(module)


# --- clamp_page_size -------------------------------------------------------

def test_clamp_page_size_default_when_missing(db):
    assert db.clamp_page_size(None) == db.DEFAULT_PAGE_SIZE


def test_clamp_page_size_default_when_invalid(db):
    assert db.clamp_page_size("not-a-number") == db.DEFAULT_PAGE_SIZE


def test_clamp_page_size_default_when_below_one(db):
    assert db.clamp_page_size(0) == db.DEFAULT_PAGE_SIZE
    assert db.clamp_page_size(-5) == db.DEFAULT_PAGE_SIZE


def test_clamp_page_size_caps_at_max(db):
    assert db.clamp_page_size(10_000) == db.MAX_PAGE_SIZE


def test_clamp_page_size_passes_through_valid(db):
    assert db.clamp_page_size(20) == 20
    assert db.clamp_page_size("35") == 35


# --- cursor encode/decode --------------------------------------------------

def test_encode_cursor_none_for_empty(db):
    assert db.encode_cursor(None) is None
    assert db.encode_cursor({}) is None


def test_cursor_round_trip(db):
    key = {"id": "abc-123"}
    token = db.encode_cursor(key)
    assert isinstance(token, str)
    assert db.decode_cursor(token) == key


def test_decode_cursor_none_for_empty(db):
    assert db.decode_cursor(None) is None
    assert db.decode_cursor("") is None


def test_decode_cursor_rejects_garbage(db):
    with pytest.raises(ValueError):
        db.decode_cursor("!!!not-base64!!!")


def test_decode_cursor_rejects_non_object(db):
    import base64
    import json

    token = base64.urlsafe_b64encode(json.dumps([1, 2, 3]).encode()).decode()
    with pytest.raises(ValueError):
        db.decode_cursor(token)


# --- table name resolution -------------------------------------------------

def test_table_name_raises_when_missing(db, monkeypatch):
    monkeypatch.delenv("PRODUCTS_TABLE", raising=False)
    with pytest.raises(RuntimeError):
        db.products_table()
