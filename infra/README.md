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
  - Admin routes (Cognito JWT authorizer): all `POST`, `PUT`, `DELETE`, `POST /admin/images/upload-url`, and `POST /admin/products/description-suggest`.
  - Lambda-level admin authorization: user must belong to Cognito group `admins` (configurable via `AdminGroupName`).
  - Stage-level request throttling (rate + burst), with stricter per-route limits on the AI description endpoint.
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
| `AdminGroupName`     | Cognito group required for admin Lambda authorization.       |
| `AiDescriptionModelId` | Bedrock model id for AI description suggestion endpoint.    |
| `ApiThrottleRateLimit` | Default API stage request rate (req/s).                    |
| `ApiThrottleBurstLimit` | Default API stage burst capacity.                         |
| `AiThrottleRateLimit` | Request rate (req/s) for the AI description endpoint.       |
| `AiThrottleBurstLimit` | Burst capacity for the AI description endpoint.            |

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

## CI/CD bootstrap (one-time manual setup)

Before GitHub Actions can deploy the application, a few account-level
prerequisites must exist. These are **not** part of the application stack
(`template.yaml`) because they must exist *before* CI/CD runs and are managed
separately in `bootstrap.yaml`.

Perform these steps once, manually, with an admin AWS identity.

### 1. Deploy the bootstrap stack (OIDC provider + scoped deploy role)

`bootstrap.yaml` creates:

- a **GitHub Actions OIDC identity provider** for `token.actions.githubusercontent.com`, and
- a **scoped IAM role** that GitHub Actions assumes (via OIDC) to deploy the app.

The role's trust policy is restricted to a specific `owner/repo` and branch, so
no other repository can assume it.

```bash
aws cloudformation deploy \
  --template-file infra/bootstrap.yaml \
  --stack-name salescatalog-bootstrap \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    GitHubOrg=YOUR_GH_USER \
    GitHubRepo=SalesCatalog \
    GitHubBranch=main \
    AppStackName=SalesCatalog
```

> If a GitHub OIDC provider already exists in this AWS account (only one is
> allowed per account), add `CreateOidcProvider=false` to the
> `--parameter-overrides` list.
>
> **Gotcha:** only set `CreateOidcProvider=false` when the provider was
> created by a *different* stack/project. If *this* bootstrap stack created
> the provider, redeploying with `CreateOidcProvider=false` will **delete**
> it, breaking GitHub Actions with "no OpenIDConnect provider found". Since
> SalesCatalog is normally the only project using GitHub OIDC in the account,
> keep `CreateOidcProvider=true` on every bootstrap redeploy and change only
> the other parameters (e.g. `AppStackName`).
>
> To verify the provider exists:
>
> ```bash
> aws iam list-open-id-connect-providers
> ```
>
> The list should contain an ARN ending in
> `oidc-provider/token.actions.githubusercontent.com`.

### 2. Capture the deploy role ARN

```bash
aws cloudformation describe-stacks \
  --stack-name salescatalog-bootstrap \
  --query "Stacks[0].Outputs[?OutputKey=='DeployRoleArn'].OutputValue" \
  --output text
```

Save the output — it is used as the `AWS_DEPLOY_ROLE_ARN` GitHub secret.

### 3. Create the Google OAuth client

In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
create an **OAuth 2.0 Client ID** of type *Web application*. Note the
**Client ID** and **Client Secret**.

After the first application deploy, return here and add to the same client:

- **Authorized JavaScript origin:** the `HostedUiBaseUrl` stack output.
- **Authorized redirect URI:** `<HostedUiBaseUrl>/oauth2/idpresponse`.

### 4. Configure GitHub Secrets and Variables

In the GitHub repository, under **Settings → Secrets and variables → Actions**,
create the following.

**Secrets** (sensitive):

| Secret name                 | Value                                                  |
| --------------------------- | ------------------------------------------------------ |
| `AWS_DEPLOY_ROLE_ARN`       | Deploy role ARN from step 2.                           |
| `GOOGLE_CLIENT_ID`          | Google OAuth Client ID from step 3.                    |
| `GOOGLE_CLIENT_SECRET`      | Google OAuth Client Secret from step 3.                |
| `HOSTED_ZONE_ID`            | Route 53 Hosted Zone ID for the domain.                |
| `DOMAIN_NAME`               | Public UI domain (e.g. `catalog.example.com`).         |
| `BUDGET_NOTIFICATION_EMAIL` | Email address that receives cost budget alerts.        |

**Variables** (non-sensitive):

| Variable name | Value             |
| ------------- | ----------------- |
| `AWS_REGION`  | `us-east-1`       |
| `ENVIRONMENT` | `dev`             |
| `STACK_NAME`  | `SalesCatalog`    |

> Per the chosen configuration, **all** SAM parameters are supplied from
> GitHub Secrets/Variables at deploy time — nothing sensitive is committed to
> the repository (`samconfig.toml` is git-ignored).

### 5. Enable IAM access to Billing (required for Budgets)

The application stack creates an `AWS::Budgets::Budget`. In the AWS account
(root user): **Account → IAM user and role access to Billing information →
Activate**. This is a one-time account setting.

### 6. First deploy and post-deploy wiring

1. Trigger the first deploy (push/merge to `main`, or run `sam deploy` locally).
2. Read the stack outputs (`UserPoolDomain`, `HostedUiBaseUrl`, `ApiBaseUrl`, ...).
3. Complete the Google OAuth redirect URIs from step 3.
4. Confirm the **AWS Budgets** confirmation email so cost alerts are delivered.

## Notes

- The ACM certificate for CloudFront **must** be in `us-east-1`. Since the entire stack is deployed in `us-east-1`, this is handled in the same template.
- The bootstrap stack (`bootstrap.yaml`) is deployed **once** and rarely changes; the application stack (`template.yaml`) is deployed continuously by CI/CD.
- The Cognito Hosted UI handles the Google OAuth dance — the React app only needs to redirect users to it and read the returned tokens.
- All Lambda IAM roles follow the principle of least privilege (only the specific table, bucket, and actions they need).
