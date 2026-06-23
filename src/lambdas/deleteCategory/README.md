# deleteCategory

Delete a category. **Admin only** — requires a valid Cognito JWT.

## Route

```
DELETE /categories/{id}
```

Authorized by the `CognitoJwtAuthorizer`.

## Path parameters

| Name | Required | Description  |
| ---- | -------- | ------------ |
| `id` | yes      | Category id. |

## Behaviour

Deletion is **blocked** when any product still references the category, to
prevent leaving products with a dangling `categoryId`. The check queries the
products `byCategory` GSI; if any product is found, the request fails with
`409 Conflict`.

When the category is empty, a conditional delete (`attribute_exists(id)`) is
performed so a missing category returns `404`.

## Response

| Status | Body | When                              |
| ------ | ---- | --------------------------------- |
| 204    | —    | Category deleted                  |
| 400    | JSON | `id` path parameter missing       |
| 404    | JSON | No category with that id          |
| 409    | JSON | Category still has products        |
| 401    | —    | Missing/invalid JWT (API Gateway) |

## Environment

| Variable           | Description                    |
| ------------------ | ------------------------------ |
| `CATEGORIES_TABLE` | DynamoDB categories table name |
| `PRODUCTS_TABLE`   | DynamoDB products table name   |

## IAM

- `DynamoDBCrudPolicy` on the categories table.
- `DynamoDBReadPolicy` on the products table (to check for referencing products via the `byCategory` GSI).

## Tests

`tests/lambdas/test_deleteCategory.py` (pytest + moto).
