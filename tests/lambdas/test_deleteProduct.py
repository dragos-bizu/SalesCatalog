"""Unit tests for the deleteProduct Lambda handler."""

import importlib
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
        "src", "lambdas", "deleteProduct",
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
        table.put_item(Item={"id": "p1", "name": "Apple", "nameLower": "apple"})
        yield table


def _invoke(handler, product_id):
    event = {"pathParameters": {"id": product_id} if product_id else {}}
    return handler.lambda_handler(event, FakeLambdaContext())


def test_deletes_product(products_table):
    handler = _load_handler()
    res = _invoke(handler, "p1")
    assert res["statusCode"] == 204
    assert res["body"] == ""
    assert "Item" not in products_table.get_item(Key={"id": "p1"})


def test_delete_missing_returns_404(products_table):
    handler = _load_handler()
    res = _invoke(handler, "ghost")
    assert res["statusCode"] == 404


def test_missing_id_returns_400(products_table):
    handler = _load_handler()
    res = _invoke(handler, None)
    assert res["statusCode"] == 400
