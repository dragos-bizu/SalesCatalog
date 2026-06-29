"""createImageUploadUrl Lambda handler.

POST /admin/images/upload-url — issue presigned S3 PUT URLs for image uploads.
Admin only (Cognito JWT).

The Lambda does not handle file bytes: it only mints short-lived presigned
URLs. The browser then uploads each file directly to S3 with a matching
Content-Type header. Public reads are served via the images CloudFront
distribution at IMAGES_BASE_URL/<key>.

Request body:
    {
      "files": [
        { "contentType": "image/jpeg" },
        { "contentType": "image/png" }
      ]
    }

Response (200):
    {
      "uploads": [
        {
          "uploadUrl": "https://...",
          "key": "products/<uuid>.jpg",
          "publicUrl": "https://images.<domain>/products/<uuid>.jpg",
          "contentType": "image/jpeg"
        }
      ]
    }
"""

import os
import uuid
from functools import lru_cache

import boto3
from aws_lambda_powertools import Logger
from botocore.config import Config

from salescatalog_shared import auth, http

logger = Logger()

# Presigned PUT URL lifetime, in seconds.
URL_EXPIRY_SECONDS = 300
# Maximum number of upload URLs that may be requested in one call.
MAX_FILES = 5
# Key prefix for product images in the bucket.
KEY_PREFIX = "products"

# Allowed content types -> file extension.
_CONTENT_TYPE_EXT = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}


@lru_cache(maxsize=1)
def _s3_client():
    """Return a cached S3 client configured for SigV4 presigned URLs."""
    return boto3.client("s3", config=Config(signature_version="s3v4"))


def _bucket() -> str:
    name = os.environ.get("IMAGES_BUCKET")
    if not name:
        raise RuntimeError("Environment variable IMAGES_BUCKET is not set")
    return name


def _images_base_url() -> str:
    url = os.environ.get("IMAGES_BASE_URL")
    if not url:
        raise RuntimeError("Environment variable IMAGES_BASE_URL is not set")
    return url.rstrip("/")


@logger.inject_lambda_context(log_event=False)
def lambda_handler(event, context):
    """Entry point for the createImageUploadUrl Lambda."""
    try:
        auth.require_admin(event)
        body = http.parse_json_body(event)
    except auth.UnauthorizedError as exc:
        return http.error(401, str(exc))
    except auth.ForbiddenError as exc:
        return http.error(403, str(exc))
    except ValueError as exc:
        return http.error(400, str(exc))

    files = body.get("files")
    if not isinstance(files, list) or not files:
        return http.error(400, "Field 'files' must be a non-empty list")
    if len(files) > MAX_FILES:
        return http.error(400, f"At most {MAX_FILES} files may be requested at once")

    # Validate every file up front so we don't issue a partial batch.
    content_types: list[str] = []
    for entry in files:
        if not isinstance(entry, dict):
            return http.error(400, "Each file entry must be an object")
        content_type = str(entry.get("contentType", "")).strip().lower()
        if content_type not in _CONTENT_TYPE_EXT:
            return http.error(
                400,
                "Unsupported contentType; allowed: "
                + ", ".join(sorted(_CONTENT_TYPE_EXT)),
            )
        content_types.append(content_type)

    client = _s3_client()
    bucket = _bucket()
    base_url = _images_base_url()

    uploads = []
    for content_type in content_types:
        ext = _CONTENT_TYPE_EXT[content_type]
        key = f"{KEY_PREFIX}/{uuid.uuid4()}.{ext}"
        upload_url = client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": bucket,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=URL_EXPIRY_SECONDS,
        )
        uploads.append(
            {
                "uploadUrl": upload_url,
                "key": key,
                "publicUrl": f"{base_url}/{key}",
                "contentType": content_type,
            }
        )

    logger.info("Issued image upload URLs", extra={"count": len(uploads)})
    return http.ok({"uploads": uploads})
