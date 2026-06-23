"""Unit tests for the updateCategory Lambda handler."""

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
        "src", "lambdas", "updateCategory",
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
        table.put_item(Item={
            "id": "c1", "name": "Fruit", "nameLower": "fruit",
            "createdAt": "2024-01-01T00:00:00Z", "updatedAt": "2024-01-01T00:00:00Z",
        })
        table.put_item(Item={
            "id": "c2", "name": "Veg", "nameLower": "veg",
            "createdAt": "2024-01-01T00:00:00Z", "updatedAt": "2024-01-01T00:00:00Z",
        })
        yield table


def _invoke(handler, cat_id, body):
    event = {
        "pathParameters": {"id": cat_id} if cat_id else {},
        "body": json.dumps(body) if body is not None else None,
    }
    return handler.lambda_handler(event, FakeLambdaContext())


def test_renames_category(categories_table):
    handler = _load_handler()
    res = _invoke(handler, "c1", {"name": "Fruits"})
    assert res["statusCode"] == 200
    body = json.loads(res["body"])
    assert body["name"] == "Fruits"
    assert body["createdAt"] == "2024-01-01T00:00:00Z"
    assert body["updatedAt"] != "2024-01-01T00:00:00Z"
    assert "nameLower" not in body


def test_same_name_different_case_allowed_on_self(categories_table):
    handler = _load_handler()
    # Renaming c1 from "Fruit" to "FRUIT" should be allowed (same record).
    res = _invoke(handler, "c1", {"name": "FRUIT"})
    assert res["statusCode"] == 200


def test_collision_with_other_409(categories_table):
    handler = _load_handler()
    res = _invoke(handler, "c1", {"name": "veg"})
    assert res["statusCode"] == 409


def test_not_found_404(categories_table):
    handler = _load_handler()
    res = _invoke(handler, "ghost", {"name": "X"})
    assert res["statusCode"] == 404


def test_missing_name_400(categories_table):
    handler = _load_handler()
    assert _invoke(handler, "c1", {})["statusCode"] == 400


def test_missing_id_400(categories_table):
    handler = _load_handler()
    assert _invoke(handler, None, {"name": "X"})["statusCode"] == 400
