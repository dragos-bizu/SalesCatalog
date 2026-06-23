# createProduct

Create a new product. **Admin only** — requires a valid Cognito JWT.

## Route

```
POST /products
```

Authorized by the `CognitoJwtAuthorizer` (HTTP API JWT authorizer).

## Request body

```json
{
  "name": "string",
  "categoryId": "uuid",
  "ean": "string",
  "description": "string",
  "images": ["key1.jpg"]
}
```

| Field        | Required | Default | Notes                                          |
| ------------ | -------- | ------- | ---------------------------------------------- |
| `name`       | yes      | —       | Non-empty after trimming.                      |
| `categoryId` | yes      | —       | Must reference an existing category.           |
| `ean`        | no       | `""`    | Free text.                                     |
| `description`| no       | `""`    | Free text.                                     |
| `images`     | no       | `[]`    | List of S3 object keys.                        |

### Server-generated fields

`id` (UUID v4), `nameLower` (lowercased `name`, internal), `createdAt`,
`updatedAt` (ISO-8601 UTC). Any client-supplied values for these are ignored.

## Response

`201 Created` — the created product (without `nameLower`).

```json
{
  "id": "uuid",
  "ean": "string",
  "categoryId": "uuid",
  "name": "string",
  "description": "string",
  "images": ["key1.jpg"],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Errors

| Status | When                                              |
| ------ | ------------------------------------------------- |
| 400    | Invalid JSON body                                 |
| 400    | `name` missing/empty                              |
| 400    | `categoryId` missing                              |
| 400    | `categoryId` does not reference an existing category |
| 400    | `images` is not a list                            |
| 401    | Missing/invalid JWT (enforced by API Gateway)     |

## Environment

| Variable           | Description                    |
| ------------------ | ------------------------------ |
| `PRODUCTS_TABLE`   | DynamoDB products table name   |
| `CATEGORIES_TABLE` | DynamoDB categories table name |

## IAM

- `DynamoDBWritePolicy` on the products table.
- `DynamoDBReadPolicy` on the categories table (to validate `categoryId`).

## Tests

`tests/lambdas/test_createProduct.py` (pytest + moto).
