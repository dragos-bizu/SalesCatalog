"""Unit tests for the deleteCategory Lambda handler."""

import importlib
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
        "src", "lambdas", "deleteCategory",
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
        categories = resource.create_table(
            TableName=CATEGORIES_TABLE,
            BillingMode="PAY_PER_REQUEST",
            KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
        )
        categories.put_item(Item={"id": "c1", "name": "Fruit", "nameLower": "fruit"})
        categories.put_item(Item={"id": "c2", "name": "Veg", "nameLower": "veg"})
        # c1 has a product; c2 is empty.
        products.put_item(Item={
            "id": "p1", "categoryId": "c1", "name": "Apple", "nameLower": "apple",
            "createdAt": "2024-01-01T00:00:00Z",
        })
        yield products, categories


def _invoke(handler, cat_id):
    event = {"pathParameters": {"id": cat_id} if cat_id else {}}
    return handler.lambda_handler(event, FakeLambdaContext())


def test_deletes_empty_category(tables):
    _, categories = tables
    handler = _load_handler()
    res = _invoke(handler, "c2")
    assert res["statusCode"] == 204
    assert "Item" not in categories.get_item(Key={"id": "c2"})


def test_blocks_delete_when_products_exist(tables):
    _, categories = tables
    handler = _load_handler()
    res = _invoke(handler, "c1")
    assert res["statusCode"] == 409
    # still present
    assert "Item" in categories.get_item(Key={"id": "c1"})


def test_not_found_404(tables):
    handler = _load_handler()
    res = _invoke(handler, "ghost")
    assert res["statusCode"] == 404


def test_missing_id_400(tables):
    handler = _load_handler()
    res = _invoke(handler, None)
    assert res["statusCode"] == 400
