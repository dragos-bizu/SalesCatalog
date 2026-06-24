# updateProduct

Update an existing product. **Admin only** — requires a valid Cognito JWT.

## Route

```
PUT /products/{id}
```

Authorized by the `CognitoJwtAuthorizer`.

## Path parameters

| Name | Required | Description |
| ---- | -------- | ----------- |
| `id` | yes      | Product id. |

## Request body (partial update)

Only the fields present in the body are changed; omitted fields are left
untouched.

```json
{
  "name": "string",
  "categoryId": "uuid",
  "ean": "string",
  "description": "string",
  "images": ["key1.jpg"]
}
```

| Field        | Validation                                              |
| ------------ | ------------------------------------------------------- |
| `name`       | If present, must be non-empty; `nameLower` regenerated. |
| `categoryId` | If present, must reference an existing category.        |
| `ean`        | If present, stored as a string.                         |
| `description`| If present, stored as a string.                         |
| `images`     | If present, must be a list.                             |

Server-managed fields (`id`, `createdAt`, `nameLower`) cannot be set by the
client. `updatedAt` is always refreshed; `createdAt` is preserved.

## Response

`200 OK` — the updated product (without `nameLower`).

### Errors

| Status | When                                              |
| ------ | ------------------------------------------------- |
| 400    | Missing `id`, invalid JSON, empty `name`, empty/invalid `categoryId`, or `images` not a list |
| 404    | No product with that id                           |
| 401    | Missing/invalid JWT (enforced by API Gateway)     |

## Environment

| Variable           | Description                    |
| ------------------ | ------------------------------ |
| `PRODUCTS_TABLE`   | DynamoDB products table name   |
| `CATEGORIES_TABLE` | DynamoDB categories table name |

## IAM

- `DynamoDBCrudPolicy` on the products table.
- `DynamoDBReadPolicy` on the categories table (to validate a changed `categoryId`).

## Tests

`tests/lambdas/test_updateProduct.py` (pytest + moto).
