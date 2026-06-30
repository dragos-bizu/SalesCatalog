# .github/workflows/

GitHub Actions CI/CD pipelines for SalesCatalog.

## Pipelines

- `ci.yml` — runs on **pull requests** to `main`. Lint, build and test only; **no AWS access**. Has two jobs: `backend` (pytest + `sam validate --lint` + `sam build`) and `frontend` (npm lint/test/build, skipped until `ui/` exists).
- `deploy.yml` — runs on **merges (push) to `main`**. Builds and deploys the backend (SAM) then the frontend (Vite → S3 sync → CloudFront invalidation). `workflow_dispatch` is intentionally **not** enabled — deployments are driven by merging into `main`.

AWS credentials are obtained via **GitHub OIDC** (no long-lived access keys are stored in the repository). All sensitive values are referenced as `${{ secrets.* }}` and non-sensitive ones as `${{ vars.* }}`; the repository slug is read from the built-in `${{ github.repository }}` context, so no real values are committed to the workflow files.

The frontend job in both workflows is **guarded**: it checks for `ui/package.json` and skips gracefully until the React app is created in a later step.

## High-level steps (deploy.yml)

**Job `deploy-backend`:**
1. Checkout, set up Python 3.12 and the SAM CLI.
2. Configure AWS credentials via GitHub OIDC (assume `AWS_DEPLOY_ROLE_ARN`).
3. `sam build --use-container` in `infra/`.
4. `sam deploy` with parameter overrides from secrets/variables.
5. Read stack outputs and expose them as job outputs.

**Job `deploy-frontend`** (needs `deploy-backend`, guarded by `ui/package.json`):
1. Checkout, set up Node.js LTS.
2. Configure AWS credentials via OIDC.
3. `npm ci` in `ui/`.
4. `npm run build` with `VITE_*` env vars injected from the backend job outputs.
5. `aws s3 sync ui/dist/ s3://<ui-bucket>/ --delete`.
6. `aws cloudfront create-invalidation --paths "/*"`.

## Required secrets / variables

Configure under **Settings → Secrets and variables → Actions**.

**Secrets:**

| Name                        | Purpose                                          |
| --------------------------- | ------------------------------------------------ |
| `AWS_DEPLOY_ROLE_ARN`       | IAM role ARN assumed via OIDC by the workflow.   |
| `DOMAIN_NAME`               | UI domain name.                                  |
| `HOSTED_ZONE_ID`            | Route 53 hosted zone id.                         |
| `GOOGLE_CLIENT_ID`          | Google OAuth client id.                          |
| `GOOGLE_CLIENT_SECRET`      | Google OAuth client secret.                      |
| `BUDGET_NOTIFICATION_EMAIL` | Email for cost budget alerts.                    |

**Variables:**

| Name          | Purpose                            |
| ------------- | ---------------------------------- |
| `AWS_REGION`  | Deployment region (`us-east-1`).   |
| `ENVIRONMENT` | Environment tag (`dev`, `prod`).   |
| `STACK_NAME`  | App stack name (`SalesCatalog`).   |

**Optional variables (API Gateway throttling):**

Leave any of these unset to use the template defaults.

| Name                       | Purpose                                         | Template default |
| -------------------------- | ----------------------------------------------- | ---------------- |
| `API_THROTTLE_RATE_LIMIT`  | Default API stage request rate (req/s).         | `20`             |
| `API_THROTTLE_BURST_LIMIT` | Default API stage burst capacity.               | `40`             |
