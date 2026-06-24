# deleteProduct

Delete a product. **Admin only** — requires a valid Cognito JWT.

## Route

```
DELETE /products/{id}
```

Authorized by the `CognitoJwtAuthorizer`.

## Path parameters

| Name | Required | Description |
| ---- | -------- | ----------- |
| `id` | yes      | Product id. |

## Behaviour

Performs a conditional delete (`attribute_exists(id)`) so deleting a
non-existent product returns `404` rather than a silent success.

> Note: this removes the product record only. Associated images in the images
> S3 bucket are not deleted here (orphan-image cleanup, if desired, can be
> handled separately).

## Response

| Status | Body | When                          |
| ------ | ---- | ----------------------------- |
| 204    | —    | Product deleted               |
| 400    | JSON | `id` path parameter missing   |
| 404    | JSON | No product with that id       |
| 401    | —    | Missing/invalid JWT (API Gateway) |

## Environment

| Variable         | Description                  |
| ---------------- | ---------------------------- |
| `PRODUCTS_TABLE` | DynamoDB products table name |

## IAM

`DynamoDBCrudPolicy` on the products table.

## Tests

`tests/lambdas/test_deleteProduct.py` (pytest + moto).
