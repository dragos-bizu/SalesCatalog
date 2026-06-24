"""Unit tests for the createProduct Lambda handler."""

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
        "src", "lambdas", "createProduct",
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
        yield products, categories


def _invoke(handler, body):
    event = {"body": json.dumps(body) if body is not None else None}
    return handler.lambda_handler(event, FakeLambdaContext())


def test_creates_product(tables):
    handler = _load_handler()
    res = _invoke(handler, {"name": "Apple", "categoryId": "cat-a", "ean": "111"})
    assert res["statusCode"] == 201
    body = json.loads(res["body"])
    assert body["id"]
    assert body["name"] == "Apple"
    assert body["createdAt"] == body["updatedAt"]
    assert "nameLower" not in body


def test_persisted_with_name_lower(tables):
    products, _ = tables
    handler = _load_handler()
    res = _invoke(handler, {"name": "ApPlE", "categoryId": "cat-a"})
    pid = json.loads(res["body"])["id"]
    stored = products.get_item(Key={"id": pid})["Item"]
    assert stored["nameLower"] == "apple"


def test_missing_name_returns_400(tables):
    handler = _load_handler()
    res = _invoke(handler, {"categoryId": "cat-a"})
    assert res["statusCode"] == 400


def test_missing_category_returns_400(tables):
    handler = _load_handler()
    res = _invoke(handler, {"name": "Apple"})
    assert res["statusCode"] == 400


def test_nonexistent_category_returns_400(tables):
    handler = _load_handler()
    res = _invoke(handler, {"name": "Apple", "categoryId": "ghost"})
    assert res["statusCode"] == 400


def test_invalid_images_type_returns_400(tables):
    handler = _load_handler()
    res = _invoke(handler, {"name": "Apple", "categoryId": "cat-a", "images": "nope"})
    assert res["statusCode"] == 400


def test_invalid_json_returns_400(tables):
    handler = _load_handler()
    event = {"body": "{not json"}
    res = handler.lambda_handler(event, FakeLambdaContext())
    assert res["statusCode"] == 400


def test_optional_fields_default(tables):
    handler = _load_handler()
    body = json.loads(_invoke(handler, {"name": "Apple", "categoryId": "cat-a"})["body"])
    assert body["ean"] == ""
    assert body["description"] == ""
    assert body["images"] == []
