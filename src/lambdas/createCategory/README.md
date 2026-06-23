# createCategory

Create a new category. **Admin only** — requires a valid Cognito JWT.

## Route

```
POST /categories
```

Authorized by the `CognitoJwtAuthorizer`.

## Request body

```json
{ "name": "string" }
```

| Field  | Required | Notes                      |
| ------ | -------- | -------------------------- |
| `name` | yes      | Non-empty after trimming.  |

Category names are unique **case-insensitively** (a `nameLower` attribute is
stored and checked). "Fruit" and "fruit" are considered the same.

### Server-generated fields

`id` (UUID v4), `nameLower` (internal), `createdAt`, `updatedAt`.

## Response

`201 Created` — the created category (without `nameLower`).

```json
{
  "id": "uuid",
  "name": "Fruit",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Errors

| Status | When                                              |
| ------ | ------------------------------------------------- |
| 400    | Invalid JSON, or `name` missing/empty             |
| 409    | A category with this name already exists (case-insensitive) |
| 401    | Missing/invalid JWT (enforced by API Gateway)     |

## Environment

| Variable           | Description                    |
| ------------------ | ------------------------------ |
| `CATEGORIES_TABLE` | DynamoDB categories table name |

## IAM

`DynamoDBCrudPolicy` on the categories table (write + scan for the uniqueness check).

## Tests

`tests/lambdas/test_createCategory.py` (pytest + moto).
