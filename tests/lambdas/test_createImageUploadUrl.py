"""Unit tests for the createImageUploadUrl Lambda handler."""

import importlib
import json
import os
import sys

import boto3
import pytest
from moto import mock_aws

from conftest import FakeLambdaContext

IMAGES_BUCKET = "test-images"
IMAGES_BASE_URL = "https://images.example.com"


def _load_handler():
    handler_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "src", "lambdas", "createImageUploadUrl",
    )
    if handler_dir not in sys.path:
        sys.path.insert(0, handler_dir)
    import handler
    return importlib.reload(handler)


@pytest.fixture()
def s3_bucket(monkeypatch):
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    monkeypatch.setenv("IMAGES_BUCKET", IMAGES_BUCKET)
    monkeypatch.setenv("IMAGES_BASE_URL", IMAGES_BASE_URL)
    with mock_aws():
        client = boto3.client("s3", region_name="us-east-1")
        client.create_bucket(Bucket=IMAGES_BUCKET)
        yield client


def _invoke(handler, body):
    event = {"body": json.dumps(body) if body is not None else None}
    return handler.lambda_handler(event, FakeLambdaContext())


def test_single_upload_url(s3_bucket):
    handler = _load_handler()
    res = _invoke(handler, {"files": [{"contentType": "image/jpeg"}]})
    assert res["statusCode"] == 200
    body = json.loads(res["body"])
    assert len(body["uploads"]) == 1
    up = body["uploads"][0]
    assert up["key"].startswith("products/")
    assert up["key"].endswith(".jpg")
    assert up["publicUrl"] == f"{IMAGES_BASE_URL}/{up['key']}"
    assert up["uploadUrl"].startswith("https://")
    assert up["contentType"] == "image/jpeg"


def test_multiple_upload_urls_unique_keys(s3_bucket):
    handler = _load_handler()
    res = _invoke(handler, {"files": [
        {"contentType": "image/jpeg"},
        {"contentType": "image/png"},
        {"contentType": "image/webp"},
    ]})
    body = json.loads(res["body"])
    uploads = body["uploads"]
    assert len(uploads) == 3
    keys = {u["key"] for u in uploads}
    assert len(keys) == 3  # all unique
    assert uploads[1]["key"].endswith(".png")
    assert uploads[2]["key"].endswith(".webp")


def test_rejects_unsupported_content_type(s3_bucket):
    handler = _load_handler()
    res = _invoke(handler, {"files": [{"contentType": "application/pdf"}]})
    assert res["statusCode"] == 400


def test_rejects_empty_files(s3_bucket):
    handler = _load_handler()
    assert _invoke(handler, {"files": []})["statusCode"] == 400
    assert _invoke(handler, {})["statusCode"] == 400


def test_rejects_too_many_files(s3_bucket):
    handler = _load_handler()
    files = [{"contentType": "image/jpeg"} for _ in range(6)]
    res = _invoke(handler, {"files": files})
    assert res["statusCode"] == 400


def test_rejects_non_object_entry(s3_bucket):
    handler = _load_handler()
    res = _invoke(handler, {"files": ["not-an-object"]})
    assert res["statusCode"] == 400


def test_invalid_json_400(s3_bucket):
    handler = _load_handler()
    res = handler.lambda_handler({"body": "{bad"}, FakeLambdaContext())
    assert res["statusCode"] == 400


def test_partial_batch_not_issued_on_invalid(s3_bucket):
    handler = _load_handler()
    # One valid, one invalid -> whole request rejected.
    res = _invoke(handler, {"files": [
        {"contentType": "image/jpeg"},
        {"contentType": "text/plain"},
    ]})
    assert res["statusCode"] == 400
