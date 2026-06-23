"""Unit tests for salescatalog_shared.http."""

import decimal
import json

import pytest

from salescatalog_shared import http


def test_ok_builds_200():
    res = http.ok({"hello": "world"})
    assert res["statusCode"] == 200
    assert json.loads(res["body"]) == {"hello": "world"}
    assert res["headers"]["Content-Type"] == "application/json"


def test_created_builds_201():
    res = http.created({"id": "1"})
    assert res["statusCode"] == 201


def test_no_content_builds_204_empty_body():
    res = http.no_content()
    assert res["statusCode"] == 204
    assert res["body"] == ""


def test_error_shape():
    res = http.error(404, "Not found")
    assert res["statusCode"] == 404
    assert json.loads(res["body"]) == {"message": "Not found"}


def test_decimal_integer_serialized_as_int():
    res = http.ok({"price": decimal.Decimal("10")})
    assert json.loads(res["body"]) == {"price": 10}
    assert "10.0" not in res["body"]


def test_decimal_fraction_serialized_as_float():
    res = http.ok({"price": decimal.Decimal("10.5")})
    assert json.loads(res["body"]) == {"price": 10.5}


def test_parse_json_body_empty_returns_empty_dict():
    assert http.parse_json_body({}) == {}
    assert http.parse_json_body({"body": ""}) == {}
    assert http.parse_json_body({"body": None}) == {}


def test_parse_json_body_parses_object():
    event = {"body": json.dumps({"name": "x"})}
    assert http.parse_json_body(event) == {"name": "x"}


def test_parse_json_body_rejects_invalid_json():
    with pytest.raises(ValueError):
        http.parse_json_body({"body": "{not json"})


def test_parse_json_body_rejects_non_object():
    with pytest.raises(ValueError):
        http.parse_json_body({"body": json.dumps([1, 2, 3])})
