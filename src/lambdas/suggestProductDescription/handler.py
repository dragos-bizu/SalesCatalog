"""suggestProductDescription Lambda handler.

POST /admin/products/description-suggest — generate an improved product
description from a short seed text. Admin only (Cognito JWT).

Request body:
    {
      "seed": "short user draft (10-15 words recommended)",
      "productName": "optional",
      "categoryName": "optional",
      "language": "optional BCP-47-ish tag, defaults to 'en'"
    }

Response (200):
    {
      "description": "AI-improved description"
    }
"""

from __future__ import annotations

import json
import os
import re
from functools import lru_cache
from typing import Any

import boto3
from aws_lambda_powertools import Logger

from salescatalog_shared import auth, http

logger = Logger()

_MIN_WORDS = 3
_MAX_WORDS = 80
_DEFAULT_MODEL_ID = "amazon.titan-text-express-v1"


@lru_cache(maxsize=1)
def _bedrock_client():
    return boto3.client("bedrock-runtime")


def _model_id() -> str:
    return os.environ.get("BEDROCK_MODEL_ID", _DEFAULT_MODEL_ID).strip() or _DEFAULT_MODEL_ID


def _count_words(text: str) -> int:
    return len(re.findall(r"\S+", text))


def _build_prompt(seed: str, product_name: str, category_name: str, language: str) -> str:
    context_parts = []
    if product_name:
        context_parts.append(f"Product name: {product_name}")
    if category_name:
        context_parts.append(f"Category: {category_name}")
    context = "\n".join(context_parts) if context_parts else "No extra context."

    return (
        "Rewrite the following short product draft into a polished product description.\n"
        "Requirements:\n"
        "- Keep it factual and easy to understand.\n"
        "- 45 to 90 words.\n"
        "- Return only the final description text (no bullets, no title, no quotes).\n"
        f"- Language: {language}.\n\n"
        f"Context:\n{context}\n\n"
        f"Draft:\n{seed}"
    )


def _invoke_titan(model_id: str, prompt: str) -> str:
    payload = {
        "inputText": prompt,
        "textGenerationConfig": {
            "maxTokenCount": 220,
            "temperature": 0.4,
            "topP": 0.9,
        },
    }

    response = _bedrock_client().invoke_model(
        modelId=model_id,
        accept="application/json",
        contentType="application/json",
        body=json.dumps(payload),
    )

    body = response.get("body")
    parsed: dict[str, Any]
    if hasattr(body, "read"):
        parsed = json.loads(body.read().decode("utf-8"))
    elif isinstance(body, (bytes, bytearray)):
        parsed = json.loads(body.decode("utf-8"))
    else:
        parsed = json.loads(str(body))

    text = ""
    results = parsed.get("results")
    if isinstance(results, list) and results:
        first = results[0]
        if isinstance(first, dict):
            text = str(first.get("outputText", "")).strip()

    if not text:
        raise RuntimeError("Model returned an empty description")

    return text


@logger.inject_lambda_context(log_event=False)
def lambda_handler(event, context):
    try:
        auth.require_admin(event)
        body = http.parse_json_body(event)
    except auth.UnauthorizedError as exc:
        return http.error(401, str(exc))
    except auth.ForbiddenError as exc:
        return http.error(403, str(exc))
    except ValueError as exc:
        return http.error(400, str(exc))

    seed = str(body.get("seed", "")).strip()
    if not seed:
        return http.error(400, "Field 'seed' is required")

    seed_words = _count_words(seed)
    if seed_words < _MIN_WORDS:
        return http.error(400, f"Field 'seed' must contain at least {_MIN_WORDS} words")
    if seed_words > _MAX_WORDS:
        return http.error(400, f"Field 'seed' must contain at most {_MAX_WORDS} words")

    product_name = str(body.get("productName", "")).strip()
    category_name = str(body.get("categoryName", "")).strip()
    language = str(body.get("language", "en")).strip() or "en"

    prompt = _build_prompt(seed, product_name, category_name, language)

    try:
        description = _invoke_titan(_model_id(), prompt)
    except Exception as exc:  # pragma: no cover - tested with monkeypatch
        logger.exception("Failed to generate product description")
        return http.error(502, f"Failed to generate description: {exc}")

    logger.info("Generated product description", extra={"seedWords": seed_words})
    return http.ok({"description": description})
