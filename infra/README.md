# infra/

Infrastructure as Code for the SalesCatalog project, defined with **AWS SAM**.

All AWS resources for both backend and frontend hosting are described in a single template: `template.yaml`.

## What lives here

- `template.yaml` — the SAM template (created in a later step).
- `samconfig.toml` — SAM CLI configuration for deployments (created on first `sam deploy --guided`).

## Resources defined

The template provisions, in `us-east-1`:

- **Cognito**
  - User Pool (admin-only, public sign-up disabled).
  - User Pool Domain (for the Hosted UI).
  - Google Identity Provider (parameters: `GoogleClientId`, `GoogleClientSecret`).
  - User Pool Client for the React app.
- **DynamoDB**
  - `Products` table (PK: `id`, GSI on `categoryId`).
  - `Categories` table (PK: `id`).
- **S3**
  - UI bucket (private, served via CloudFront with OAC).
  - Product images bucket (private, served via CloudFront with OAC, CORS enabled for browser uploads).
- **CloudFront**
  - UI distribution (custom domain via ACM cert).
  - Images distribution (subdomain, e.g. `images.<domain>`).
- **Route 53**
  - `A` (alias) records for the UI domain and the images subdomain in the provided hosted zone.
- **API Gateway (HTTP API)**
  - Public routes: `GET /products`, `GET /products/{id}`, `GET /categories`.
  - Admin routes (Cognito JWT authorizer): all `POST`, `PUT`, `DELETE`, and `POST /admin/images/upload-url`.
- **Lambda functions** — one per use case under `src/lambdas/`, each with its own minimal IAM role.
- **Lambda Layer** — packages `src/shared/` and is attached to the Lambdas that need it.

## Parameters

| Parameter            | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `DomainName`         | Public domain for the UI (e.g. `catalog.example.com`).       |
| `HostedZoneId`       | Existing Route 53 Hosted Zone ID.                            |
| `GoogleClientId`     | Google OAuth 2.0 Client ID.                                  |
| `GoogleClientSecret` | Google OAuth 2.0 Client Secret (`NoEcho`).                   |
| `Environment`        | Environment tag (e.g. `dev`, `prod`).                        |

## Common commands

```bash
# Build all Lambdas + template
sam build

# First-time interactive deploy (creates samconfig.toml)
sam deploy --guided

# Subsequent deploys
sam deploy

# Local API for development
sam local start-api

# Validate the template
sam validate --lint
```

## Notes

- The ACM certificate for CloudFront **must** be in `us-east-1`. Since the entire stack is deployed in `us-east-1`, this is handled in the same template.
- The Cognito Hosted UI handles the Google OAuth dance — the React app only needs to redirect users to it and read the returned tokens.
- All Lambda IAM roles follow the principle of least privilege (only the specific table, bucket, and actions they need).
