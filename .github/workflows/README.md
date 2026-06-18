# .github/workflows/

GitHub Actions CI/CD pipelines for SalesCatalog.

## Pipelines

- `deploy.yml` — single pipeline that builds the backend (SAM) and the frontend (Vite), deploys both, and invalidates the CloudFront cache. Triggered on **merges (push) to `main`** and manually via `workflow_dispatch` is **not** enabled — day-to-day work happens on feature branches that are merged into `main` to trigger deployment.

AWS credentials are obtained via **GitHub OIDC** (no long-lived access keys are stored in the repository).

## High-level steps (deploy.yml)

1. **Checkout** the repository.
2. **Set up Python 3.12** and **Node.js LTS**.
3. **Configure AWS credentials** via GitHub OIDC, assuming the role in `AWS_ROLE_TO_ASSUME`.
4. **Backend**
   - `sam build` in `infra/`.
   - `sam deploy --no-confirm-changeset --no-fail-on-empty-changeset` with parameter overrides from secrets.
   - Capture stack outputs (UI bucket name, CloudFront distribution id, API URL, Cognito values).
5. **Frontend**
   - `npm ci` in `ui/`.
   - Inject env vars from stack outputs into `.env.production`.
   - `npm run build`.
   - `aws s3 sync ui/dist/ s3://<ui-bucket>/ --delete`.
   - `aws cloudfront create-invalidation --paths "/*"`.

## Required secrets / variables

| Name                      | Type     | Purpose                                                   |
| ------------------------- | -------- | --------------------------------------------------------- |
| `AWS_ROLE_TO_ASSUME`      | secret   | IAM role ARN assumed via OIDC by the workflow.            |
| `AWS_REGION`              | variable | Deployment region (`us-east-1`).                          |
| `DOMAIN_NAME`             | variable | UI domain name.                                           |
| `HOSTED_ZONE_ID`          | secret   | Route 53 hosted zone id.                                  |
| `GOOGLE_CLIENT_ID`        | secret   | Google OAuth client id.                                   |
| `GOOGLE_CLIENT_SECRET`    | secret   | Google OAuth client secret.                               |
| `ENVIRONMENT`             | variable | Environment tag (`prod`, `dev`, ...).                     |

The actual `deploy.yml` file is created in a later step.
