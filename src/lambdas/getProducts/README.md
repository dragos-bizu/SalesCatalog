# getProducts

List products. **Public** — no authentication required.

## Route

```
GET /products
```

## Query parameters

| Name         | Required | Default | Description                                                        |
| ------------ | -------- | ------- | ------------------------------------------------------------------ |
| `limit`      | no       | 20      | Page size. Clamped to the range 1–100.                             |
| `cursor`     | no       | —       | Opaque pagination token returned as `nextCursor` by a prior call.  |
| `categoryId` | no       | —       | Restrict results to a single category.                             |
| `q`          | no       | —       | Case-insensitive substring match on the product name.              |

`categoryId` and `q` may be combined (search by name **within** a category).

## Behaviour

- **`categoryId` present** → `Query` on the `byCategory` GSI, newest first (`createdAt` descending).
- **`categoryId` absent** → `Scan` the table.
- **`q` present** → adds a `contains(nameLower, q)` filter on top of either path.

`nameLower` is an internal search field and is **stripped** from every returned item.

## Response

`200 OK`

```json
{
  "items": [
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
  ],
  "nextCursor": "opaque-token-or-null"
}
```

`nextCursor` is `null` when there are no more pages; otherwise pass it back as `cursor` to fetch the next page.

### Errors

| Status | When                              |
| ------ | --------------------------------- |
| 400    | `cursor` is present but malformed |

## Environment

| Variable         | Description                  |
| ---------------- | ---------------------------- |
| `PRODUCTS_TABLE` | DynamoDB products table name |

## IAM

`DynamoDBReadPolicy` on the products table (read-only).

## Tests

`tests/lambdas/test_getProducts.py` (pytest + moto).
