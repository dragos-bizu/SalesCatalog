# createImageUploadUrl

Issue short-lived presigned S3 PUT URLs so the admin UI can upload product
images **directly to S3** (bytes never pass through Lambda or API Gateway).
**Admin only** — requires a valid Cognito JWT.

## Route

```
POST /admin/images/upload-url
```

Authorized by the `CognitoJwtAuthorizer`.

## Request body

```json
{
  "files": [
    { "contentType": "image/jpeg" },
    { "contentType": "image/png" }
  ]
}
```

| Field            | Required | Notes                                              |
| ---------------- | -------- | -------------------------------------------------- |
| `files`          | yes      | Non-empty list, **max 5** entries.                 |
| `files[].contentType` | yes | One of: `image/jpeg`, `image/png`, `image/webp`, `image/gif`. |

The batch is validated up front: if **any** entry is invalid, the whole
request is rejected and no URLs are issued.

## Response

`200 OK`

```json
{
  "uploads": [
    {
      "uploadUrl": "https://<bucket>.s3.amazonaws.com/products/<uuid>.jpg?...signature...",
      "key": "products/<uuid>.jpg",
      "publicUrl": "https://images.<domain>/products/<uuid>.jpg",
      "contentType": "image/jpeg"
    }
  ]
}
```

- `uploadUrl` — presigned `PUT` URL, valid for **300 seconds**. The browser must
  send a matching `Content-Type` header when uploading.
- `key` — the S3 object key; store this in the product's `images` array.
- `publicUrl` — the CDN URL where the image will be readable after upload.

### Upload flow (client)

1. `POST /admin/images/upload-url` with the list of content types.
2. For each returned `uploadUrl`: `PUT` the file bytes directly to S3 with
   `Content-Type` set to the same value.
3. Save the returned `key`(s) in the product via `POST`/`PUT /products`.

### Errors

| Status | When                                                       |
| ------ | ---------------------------------------------------------- |
| 400    | Invalid JSON, empty/missing `files`, more than 5 files, a non-object entry, or an unsupported `contentType` |
| 401    | Missing/invalid JWT (enforced by API Gateway)              |

## Environment

| Variable          | Description                                   |
| ----------------- | --------------------------------------------- |
| `IMAGES_BUCKET`   | S3 bucket that stores product images.         |
| `IMAGES_BASE_URL` | Public base URL of the images CDN (CloudFront). |

## IAM

`s3:PutObject` on the images bucket only (scoped to `<bucket>/*`). The
presigned URL inherits the Lambda role's permission to put the object.

## Tests

`tests/lambdas/test_createImageUploadUrl.py` (pytest + moto).
