# updateCategory

Rename a category. **Admin only** — requires a valid Cognito JWT.

## Route

```
PUT /categories/{id}
```

Authorized by the `CognitoJwtAuthorizer`.

## Path parameters

| Name | Required | Description  |
| ---- | -------- | ------------ |
| `id` | yes      | Category id. |

## Request body

```json
{ "name": "string" }
```

| Field  | Required | Notes                     |
| ------ | -------- | ------------------------- |
| `name` | yes      | Non-empty after trimming. |

Enforces case-insensitive name uniqueness across **other** categories
(renaming a category to a different casing of its own name is allowed).
`nameLower` is regenerated, `updatedAt` refreshed, `createdAt` preserved.

## Response

`200 OK` — the updated category (without `nameLower`).

### Errors

| Status | When                                              |
| ------ | ------------------------------------------------- |
| 400    | Missing `id`, invalid JSON, or `name` missing/empty |
| 404    | No category with that id                          |
| 409    | Another category already uses this name (case-insensitive) |
| 401    | Missing/invalid JWT (enforced by API Gateway)     |

## Environment

| Variable           | Description                    |
| ------------------ | ------------------------------ |
| `CATEGORIES_TABLE` | DynamoDB categories table name |

## IAM

`DynamoDBCrudPolicy` on the categories table.

## Tests

`tests/lambdas/test_updateCategory.py` (pytest + moto).
