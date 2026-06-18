# src/lambdas/

One folder per Lambda function. Each folder contains:

- `handler.py` — the Lambda entry point (`lambda_handler` function).
- `requirements.txt` — Python dependencies for that specific Lambda.
- `README.md` — function-specific documentation (route, input, output, IAM, env vars).

Each Lambda follows the **Single Responsibility Principle**: one function = one use case, with its own minimal IAM role.

Shared helpers from `src/shared/` are consumed through a **Lambda Layer** (attached to each function in `infra/template.yaml`).

## Function map

### Public (no auth)

| Folder            | Method & route          | Description                                  |
| ----------------- | ----------------------- | -------------------------------------------- |
| `getProducts/`    | `GET /products`         | List products, paginated, optional `q` and `categoryId` filters. |
| `getProduct/`     | `GET /products/{id}`    | Get a single product by id.                  |
| `listCategories/` | `GET /categories`       | List all categories.                         |

### Admin (Cognito JWT required)

| Folder                  | Method & route                       | Description                                                  |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------ |
| `createProduct/`        | `POST /products`                     | Create a new product.                                        |
| `updateProduct/`        | `PUT /products/{id}`                 | Update an existing product.                                  |
| `deleteProduct/`        | `DELETE /products/{id}`              | Delete a product.                                            |
| `createImageUploadUrl/` | `POST /admin/images/upload-url`      | Issue a short-lived presigned S3 PUT URL for image upload.   |
| `createCategory/`       | `POST /categories`                   | Create a new category.                                       |
| `updateCategory/`       | `PUT /categories/{id}`               | Update a category.                                           |
| `deleteCategory/`       | `DELETE /categories/{id}`            | Delete a category.                                           |

## Conventions

- **Runtime:** Python 3.12.
- **Libraries:** `boto3` (provided by the Lambda runtime), `aws-lambda-powertools` for logging, tracing and event parsing.
- **Layering:** business logic is kept thin in handlers. Cross-cutting helpers (DB clients, auth helpers) live in `src/shared/`.
- **Errors:** handlers return appropriate HTTP status codes (`400` for bad input, `404` for missing items, `409` for conflicts, `500` for unexpected). The response body is always JSON.
- **Logging:** structured logs via `aws_lambda_powertools.Logger`. No `print()`.
- **IAM:** declared per-function in `infra/template.yaml` — never use wildcard `*` resources.

## Tests

Each Lambda has a `handler_test.py` next to its `handler.py`, using **`pytest`** + **`moto`** to mock AWS services. Tests are discovered automatically from the repository root:

```bash
pytest
```

## Pagination

Listing endpoints return:

```json
{
  "items": [ ... ],
  "nextCursor": "opaque-base64-string-or-null"
}
```

Default page size is **20**. The cursor is an opaque base64-encoded representation of DynamoDB's `LastEvaluatedKey`.

## Search

`GET /products?q=...` performs a DynamoDB `Scan` with `contains(nameLower, q.lower())`. This is acceptable at the project's expected traffic (~10–20 users/day) and avoids the cost of OpenSearch.
