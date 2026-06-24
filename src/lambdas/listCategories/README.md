# listCategories

List all categories. **Public** — no authentication required.

## Route

```
GET /categories
```

## Behaviour

The categories table is small and low-traffic, so the handler performs a full
`Scan` (draining all pages) and returns every category. Results are sorted by
name (case-insensitive) for a stable order. There is no pagination.

## Response

`200 OK`

```json
{
  "items": [
    { "id": "uuid", "name": "Beverages" },
    { "id": "uuid", "name": "Fruit" }
  ]
}
```

## Environment

| Variable           | Description                    |
| ------------------ | ------------------------------ |
| `CATEGORIES_TABLE` | DynamoDB categories table name |

## IAM

`DynamoDBReadPolicy` on the categories table (read-only).

## Tests

`tests/lambdas/test_listCategories.py` (pytest + moto).
