"""Unit tests for the getProducts Lambda handler."""

import importlib
import os
import sys

import boto3
import pytest
from moto import mock_aws

PRODUCTS_TABLE = "test-products"


def _load_handler():
    """Import the getProducts handler module fresh."""
    handler_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "src", "lambdas", "getProducts",
    )
    if handler_dir not in sys.path:
        sys.path.insert(0, handler_dir)
    # Reload shared db so it picks up the patched env / mocked AWS.
    import salescatalog_shared.db as db
    importlib.reload(db)
    import handler
    return importlib.reload(handler)


@pytest.fixture()
def products_table(monkeypatch):
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    monkeypatch.setenv("PRODUCTS_TABLE", PRODUCTS_TABLE)
    with mock_aws():
        client = boto3.resource("dynamodb", region_name="us-east-1")
        table = client.create_table(
            TableName=PRODUCTS_TABLE,
            BillingMode="PAY_PER_REQUEST",
            KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "id", "AttributeType": "S"},
                {"AttributeName": "categoryId", "AttributeType": "S"},
                {"AttributeName": "createdAt", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "byCategory",
                    "KeySchema": [
                        {"AttributeName": "categoryId", "KeyType": "HASH"},
                        {"AttributeName": "createdAt", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                }
            ],
        )
        # Seed data
        table.put_item(Item={
            "id": "p1", "ean": "111", "categoryId": "cat-a",
            "name": "Red Apple", "nameLower": "red apple",
            "description": "fruit", "images": [],
            "createdAt": "2024-01-01T00:00:00Z", "updatedAt": "2024-01-01T00:00:00Z",
        })
        table.put_item(Item={
            "id": "p2", "ean": "222", "categoryId": "cat-a",
            "name": "Green Apple", "nameLower": "green apple",
            "description": "fruit", "images": [],
            "createdAt": "2024-01-02T00:00:00Z", "updatedAt": "2024-01-02T00:00:00Z",
        })
        table.put_item(Item={
            "id": "p3", "ean": "333", "categoryId": "cat-b",
            "name": "Banana", "nameLower": "banana",
            "description": "fruit", "images": [],
            "createdAt": "2024-01-03T00:00:00Z", "updatedAt": "2024-01-03T00:00:00Z",
        })
        yield table


from conftest import FakeLambdaContext


def _invoke(handler, **params):
    event = {"queryStringParameters": params or None}
    return handler.lambda_handler(event, FakeLambdaContext())


def test_lists_all_products(products_table):
    handler = _load_handler()
    res = _invoke(handler)
    assert res["statusCode"] == 200
    import json
    body = json.loads(res["body"])
    assert len(body["items"]) == 3


def test_strips_name_lower(products_table):
    handler = _load_handler()
    import json
    body = json.loads(_invoke(handler)["body"])
    for item in body["items"]:
        assert "nameLower" not in item


def test_filter_by_category(products_table):
    handler = _load_handler()
    import json
    body = json.loads(_invoke(handler, categoryId="cat-a")["body"])
    assert len(body["items"]) == 2
    assert all(it["categoryId"] == "cat-a" for it in body["items"])


def test_search_by_name(products_table):
    handler = _load_handler()
    import json
    body = json.loads(_invoke(handler, q="apple")["body"])
    names = {it["name"] for it in body["items"]}
    assert names == {"Red Apple", "Green Apple"}


def test_search_within_category(products_table):
    handler = _load_handler()
    import json
    body = json.loads(_invoke(handler, categoryId="cat-a", q="green")["body"])
    assert len(body["items"]) == 1
    assert body["items"][0]["name"] == "Green Apple"


def test_invalid_cursor_returns_400(products_table):
    handler = _load_handler()
    res = _invoke(handler, cursor="!!!bad!!!")
    assert res["statusCode"] == 400


def test_pagination_returns_cursor(products_table):
    handler = _load_handler()
    import json
    page1 = json.loads(_invoke(handler, limit="1")["body"])
    assert len(page1["items"]) == 1
    assert page1["nextCursor"] is not None
