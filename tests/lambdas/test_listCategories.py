"""Unit tests for the listCategories Lambda handler."""

import importlib
import json
import os
import sys

import boto3
import pytest
from moto import mock_aws

from conftest import FakeLambdaContext

CATEGORIES_TABLE = "test-categories"


def _load_handler():
    handler_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "src", "lambdas", "listCategories",
    )
    if handler_dir not in sys.path:
        sys.path.insert(0, handler_dir)
    import salescatalog_shared.db as db
    importlib.reload(db)
    import handler
    return importlib.reload(handler)


@pytest.fixture()
def categories_table(monkeypatch):
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    monkeypatch.setenv("CATEGORIES_TABLE", CATEGORIES_TABLE)
    with mock_aws():
        resource = boto3.resource("dynamodb", region_name="us-east-1")
        table = resource.create_table(
            TableName=CATEGORIES_TABLE,
            BillingMode="PAY_PER_REQUEST",
            KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
        )
        table.put_item(Item={"id": "c1", "name": "Fruit"})
        table.put_item(Item={"id": "c2", "name": "Beverages"})
        yield table


def _invoke(handler):
    return handler.lambda_handler({}, FakeLambdaContext())


def test_lists_categories(categories_table):
    handler = _load_handler()
    res = _invoke(handler)
    assert res["statusCode"] == 200
    body = json.loads(res["body"])
    assert len(body["items"]) == 2


def test_sorted_by_name(categories_table):
    handler = _load_handler()
    body = json.loads(_invoke(handler)["body"])
    names = [c["name"] for c in body["items"]]
    assert names == ["Beverages", "Fruit"]


def test_empty_table(monkeypatch):
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    monkeypatch.setenv("CATEGORIES_TABLE", CATEGORIES_TABLE)
    with mock_aws():
        resource = boto3.resource("dynamodb", region_name="us-east-1")
        resource.create_table(
            TableName=CATEGORIES_TABLE,
            BillingMode="PAY_PER_REQUEST",
            KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
        )
        handler = _load_handler()
        body = json.loads(_invoke(handler)["body"])
        assert body["items"] == []
