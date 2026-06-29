# suggestProductDescription

- **Route:** `POST /admin/products/description-suggest`
- **Auth:** Cognito JWT required (admin-only)
- **Purpose:** Turn a short draft (10–15 words recommended) into a polished product description using an AWS Bedrock model.

## Request body

```json
{
  "seed": "Fresh roasted coffee beans with chocolate aroma",
  "productName": "House Blend",
  "categoryName": "Coffee",
  "language": "en"
}
```

### Validation

- `seed` is required.
- `seed` must have **3 to 80 words**.

## Response

```json
{
  "description": "House Blend is a fresh-roasted coffee with a smooth body and a rich chocolate aroma..."
}
```

## Environment variables

- `BEDROCK_MODEL_ID` (optional)
  - Default: `amazon.titan-text-express-v1`

## IAM

Requires:

- `bedrock:InvokeModel` on the configured foundation model ARN.
