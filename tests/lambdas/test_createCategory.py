"""Unit tests for the createCategory Lambda handler."""

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
        "src", "lambdas", "createCategory",
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
        yield table


def _invoke(handler, body):
    event = {"body": json.dumps(body) if body is not None else None}
    return handler.lambda_handler(event, FakeLambdaContext())


def test_creates_category(categories_table):
    handler = _load_handler()
    res = _invoke(handler, {"name": "Fruit"})
    assert res["statusCode"] == 201
    body = json.loads(res["body"])
    assert body["id"]
    assert body["name"] == "Fruit"
    assert "nameLower" not in body


def test_missing_name_400(categories_table):
    handler = _load_handler()
    assert _invoke(handler, {})["statusCode"] == 400
    assert _invoke(handler, {"name": "  "})["statusCode"] == 400


def test_duplicate_case_insensitive_409(categories_table):
    handler = _load_handler()
    assert _invoke(handler, {"name": "Fruit"})["statusCode"] == 201
    res = _invoke(handler, {"name": "fruit"})
    assert res["statusCode"] == 409


def test_invalid_json_400(categories_table):
    handler = _load_handler()
    res = handler.lambda_handler({"body": "{bad"}, FakeLambdaContext())
    assert res["statusCode"] == 400
