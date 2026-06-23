"""Unit tests for the updateProduct Lambda handler."""

import importlib
import json
import os
import sys

import boto3
import pytest
from moto import mock_aws

from conftest import FakeLambdaContext

PRODUCTS_TABLE = "test-products"
CATEGORIES_TABLE = "test-categories"


def _load_handler():
    handler_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "src", "lambdas", "updateProduct",
    )
    if handler_dir not in sys.path:
        sys.path.insert(0, handler_dir)
    import salescatalog_shared.db as db
    importlib.reload(db)
    import handler
    return importlib.reload(handler)


@pytest.fixture()
def tables(monkeypatch):
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    monkeypatch.setenv("PRODUCTS_TABLE", PRODUCTS_TABLE)
    monkeypatch.setenv("CATEGORIES_TABLE", CATEGORIES_TABLE)
    with mock_aws():
        resource = boto3.resource("dynamodb", region_name="us-east-1")
        products = resource.create_table(
            TableName=PRODUCTS_TABLE,
            BillingMode="PAY_PER_REQUEST",
            KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
        )
        categories = resource.create_table(
            TableName=CATEGORIES_TABLE,
            BillingMode="PAY_PER_REQUEST",
            KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
        )
        categories.put_item(Item={"id": "cat-a", "name": "Fruit"})
        categories.put_item(Item={"id": "cat-b", "name": "Veg"})
        products.put_item(Item={
            "id": "p1", "ean": "111", "categoryId": "cat-a",
            "name": "Apple", "nameLower": "apple",
            "description": "fruit", "images": ["a.jpg"],
            "createdAt": "2024-01-01T00:00:00Z", "updatedAt": "2024-01-01T00:00:00Z",
        })
        yield products, categories


def _invoke(handler, product_id, body):
    event = {
        "pathParameters": {"id": product_id} if product_id else {},
        "body": json.dumps(body) if body is not None else None,
    }
    return handler.lambda_handler(event, FakeLambdaContext())


def test_partial_update_name(tables):
    products, _ = tables
    handler = _load_handler()
    res = _invoke(handler, "p1", {"name": "Banana"})
    assert res["statusCode"] == 200
    body = json.loads(res["body"])
    assert body["name"] == "Banana"
    # untouched fields preserved
    assert body["ean"] == "111"
    assert body["description"] == "fruit"
    # nameLower regenerated in storage
    stored = products.get_item(Key={"id": "p1"})["Item"]
    assert stored["nameLower"] == "banana"


def test_updated_at_changes_created_at_preserved(tables):
    handler = _load_handler()
    body = json.loads(_invoke(handler, "p1", {"ean": "999"})["body"])
    assert body["createdAt"] == "2024-01-01T00:00:00Z"
    assert body["updatedAt"] != "2024-01-01T00:00:00Z"


def test_change_category_validates(tables):
    handler = _load_handler()
    res = _invoke(handler, "p1", {"categoryId": "cat-b"})
    assert res["statusCode"] == 200
    assert json.loads(res["body"])["categoryId"] == "cat-b"


def test_change_to_nonexistent_category_400(tables):
    handler = _load_handler()
    res = _invoke(handler, "p1", {"categoryId": "ghost"})
    assert res["statusCode"] == 400


def test_empty_name_400(tables):
    handler = _load_handler()
    res = _invoke(handler, "p1", {"name": "   "})
    assert res["statusCode"] == 400


def test_invalid_images_400(tables):
    handler = _load_handler()
    res = _invoke(handler, "p1", {"images": "nope"})
    assert res["statusCode"] == 400


def test_not_found_404(tables):
    handler = _load_handler()
    res = _invoke(handler, "ghost", {"name": "X"})
    assert res["statusCode"] == 404


def test_missing_id_400(tables):
    handler = _load_handler()
    res = _invoke(handler, None, {"name": "X"})
    assert res["statusCode"] == 400


def test_response_has_no_name_lower(tables):
    handler = _load_handler()
    body = json.loads(_invoke(handler, "p1", {"name": "Cherry"})["body"])
    assert "nameLower" not in body
