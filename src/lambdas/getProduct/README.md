# getProduct

Get a single product by id. **Public** — no authentication required.

## Route

```
GET /products/{id}
```

## Path parameters

| Name | Required | Description    |
| ---- | -------- | -------------- |
| `id` | yes      | Product id.    |

## Response

`200 OK`

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

`nameLower` is internal and is **stripped** from the response.

### Errors

| Status | When                          |
| ------ | ----------------------------- |
| 400    | `id` path parameter missing   |
| 404    | No product with that id       |

## Environment

| Variable         | Description                  |
| ---------------- | ---------------------------- |
| `PRODUCTS_TABLE` | DynamoDB products table name |

## IAM

`DynamoDBReadPolicy` on the products table (read-only).

## Tests

`tests/lambdas/test_getProduct.py` (pytest + moto).
