"""Unit tests for the getProduct Lambda handler."""

import importlib
import json
import os
import sys

import boto3
import pytest
from moto import mock_aws

from conftest import FakeLambdaContext

PRODUCTS_TABLE = "test-products"


def _load_handler():
    handler_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "src", "lambdas", "getProduct",
    )
    if handler_dir not in sys.path:
        sys.path.insert(0, handler_dir)
    import salescatalog_shared.db as db
    importlib.reload(db)
    import handler
    return importlib.reload(handler)


@pytest.fixture()
def products_table(monkeypatch):
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    monkeypatch.setenv("PRODUCTS_TABLE", PRODUCTS_TABLE)
    with mock_aws():
        resource = boto3.resource("dynamodb", region_name="us-east-1")
        table = resource.create_table(
            TableName=PRODUCTS_TABLE,
            BillingMode="PAY_PER_REQUEST",
            KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
        )
        table.put_item(Item={
            "id": "p1", "ean": "111", "categoryId": "cat-a",
            "name": "Red Apple", "nameLower": "red apple",
            "description": "fruit", "images": [],
            "createdAt": "2024-01-01T00:00:00Z", "updatedAt": "2024-01-01T00:00:00Z",
        })
        yield table


def _invoke(handler, product_id):
    event = {"pathParameters": {"id": product_id} if product_id is not None else {}}
    return handler.lambda_handler(event, FakeLambdaContext())


def test_returns_product(products_table):
    handler = _load_handler()
    res = _invoke(handler, "p1")
    assert res["statusCode"] == 200
    body = json.loads(res["body"])
    assert body["id"] == "p1"
    assert body["name"] == "Red Apple"


def test_strips_name_lower(products_table):
    handler = _load_handler()
    body = json.loads(_invoke(handler, "p1")["body"])
    assert "nameLower" not in body


def test_not_found_returns_404(products_table):
    handler = _load_handler()
    res = _invoke(handler, "does-not-exist")
    assert res["statusCode"] == 404


def test_missing_id_returns_400(products_table):
    handler = _load_handler()
    res = _invoke(handler, None)
    assert res["statusCode"] == 400
