"""Unit tests for suggestProductDescription Lambda handler."""

import importlib
import io
import json
import os
import sys

from conftest import FakeLambdaContext


def _load_handler():
    handler_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "src", "lambdas", "suggestProductDescription",
    )
    if handler_dir not in sys.path:
        sys.path.insert(0, handler_dir)
    import handler
    return importlib.reload(handler)


def _invoke(handler, body):
    event = {"body": json.dumps(body) if body is not None else None}
    return handler.lambda_handler(event, FakeLambdaContext())


class _FakeBedrock:
    def __init__(self, text: str = "Improved description"):
        self.text = text
        self.calls = []

    def invoke_model(self, **kwargs):
        self.calls.append(kwargs)
        payload = {"results": [{"outputText": self.text}]}
        return {"body": io.BytesIO(json.dumps(payload).encode("utf-8"))}


def test_generates_description(monkeypatch):
    handler = _load_handler()
    fake = _FakeBedrock("A polished and friendly description.")
    monkeypatch.setattr(handler, "_bedrock_client", lambda: fake)

    res = _invoke(
        handler,
        {
            "seed": "fresh coffee beans with rich aroma and smooth body",
            "productName": "House Blend",
            "categoryName": "Coffee",
            "language": "en",
        },
    )

    assert res["statusCode"] == 200
    body = json.loads(res["body"])
    assert body["description"] == "A polished and friendly description."
    assert len(fake.calls) == 1


def test_rejects_missing_seed():
    handler = _load_handler()
    res = _invoke(handler, {})
    assert res["statusCode"] == 400


def test_rejects_too_few_words():
    handler = _load_handler()
    res = _invoke(handler, {"seed": "too short"})
    assert res["statusCode"] == 400


def test_rejects_too_many_words():
    handler = _load_handler()
    seed = " ".join(["word"] * 81)
    res = _invoke(handler, {"seed": seed})
    assert res["statusCode"] == 400


def test_invalid_json_400():
    handler = _load_handler()
    res = handler.lambda_handler({"body": "{bad"}, FakeLambdaContext())
    assert res["statusCode"] == 400


def test_returns_502_when_model_fails(monkeypatch):
    handler = _load_handler()

    class _Boom:
        def invoke_model(self, **kwargs):
            raise RuntimeError("Access denied")

    monkeypatch.setattr(handler, "_bedrock_client", lambda: _Boom())
    res = _invoke(handler, {"seed": "fresh coffee beans with rich aroma and smooth body"})
    assert res["statusCode"] == 502
