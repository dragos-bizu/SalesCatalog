# SalesCatalog

A lightweight, mobile-first product catalog web application.

Public visitors can browse, search and paginate through products and categories without logging in. A small set of administrators (authenticated via AWS Cognito + Google federation) can create, update and delete products and categories, including uploading product images.

The project is built as a fully serverless application on AWS, kept within the Free Tier whenever possible, and is designed for very low traffic (~1 admin and 10–20 daily users).

---

## Table of contents

- [Architecture overview](#architecture-overview)
- [Repository structure](#repository-structure)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Local development](#local-development)
- [Documentation](#documentation)

---

## Architecture overview

**Backend (AWS, serverless):**

- **API Gateway (HTTP API)** — single public entry point for the REST API.
- **AWS Lambda (Python 3.12)** — one function per use case, following Clean Architecture and the Single Responsibility Principle.
- **Amazon DynamoDB** — two tables: `Products` and `Categories`.
- **Amazon Cognito** — User Pool restricted to admins, with Google as a federated identity provider. Public sign-up is disabled.
- **Amazon S3** — two buckets: one for the static React UI, one for product images.
- **Amazon CloudFront** — CDN in front of both S3 buckets (HTTPS, custom domain, low-latency reads).
- **Amazon Route 53** — DNS for the custom domain.
- **AWS SAM** — Infrastructure as Code (`infra/template.yaml`).
- **GitHub Actions** — CI/CD pipeline (`.github/workflows/deploy.yml`).

**Frontend:**

- **React + Vite** — single-page app, mobile-first, usable as a PWA-style native-like experience.
- Clean Architecture with a Manager pattern for service-layer logic.
- Written in **TypeScript**.

**Testing:**

- Backend: **`pytest`** + **`moto`** (AWS service mocks).
- Frontend: **`jest`** + **React Testing Library**.

**Auth model:**

- Public endpoints (`GET /products`, `GET /products/{id}`, `GET /categories`) are **unauthenticated**.
- Admin endpoints (`POST`, `PUT`, `DELETE`, and presigned upload URLs) require a valid Cognito JWT.
- All users in the Cognito User Pool are admins by definition — there is no public sign-up.

---

## Repository structure

```
SalesCatalog/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline
├── infra/
│   └── template.yaml           # AWS SAM template (all infrastructure)
├── src/
│   ├── shared/                 # Code reused by multiple Lambdas
│   │   ├── db.py               # DynamoDB client configuration
│   │   └── auth.py             # Admin authorization helpers
│   └── lambdas/                # One folder per Lambda function
│       ├── getProducts/
│       ├── getProduct/
│       ├── createProduct/
│       ├── updateProduct/
│       ├── deleteProduct/
│       ├── createImageUploadUrl/
│       ├── listCategories/
│       ├── createCategory/
│       ├── updateCategory/
│       └── deleteCategory/
├── ui/                         # React + Vite web app
├── docs/                       # Project-level documentation
└── README.md
```

Each top-level folder (`infra/`, `src/shared/`, `src/lambdas/`, `ui/`, `.github/`) contains its own `README.md` describing that area in more detail.

---

## Tech stack

| Layer            | Technology                                       |
| ---------------- | ------------------------------------------------ |
| Compute          | AWS Lambda (Python 3.12)                         |
| API              | Amazon API Gateway (HTTP API)                    |
| Database         | Amazon DynamoDB                                  |
| Auth             | Amazon Cognito (User Pool + Google IdP)          |
| Storage          | Amazon S3 (UI bucket + images bucket)            |
| CDN              | Amazon CloudFront                                |
| DNS              | Amazon Route 53                                  |
| IaC              | AWS SAM                                          |
| CI/CD            | GitHub Actions                                   |
| Lambda libraries | `boto3`, `aws-lambda-powertools`                 |
| Frontend         | React, Vite, npm                                 |

---

## Prerequisites

To deploy or work on this project locally you will need:

- An AWS account with permission to deploy the resources used by the SAM template.
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configured with credentials (`aws configure`).
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).
- [Python 3.12](https://www.python.org/downloads/) for Lambda development.
- [Node.js LTS](https://nodejs.org/) and `npm` for the React UI.
- A registered domain managed in Route 53 (a hosted zone must already exist).
- A Google Cloud OAuth 2.0 Client (Client ID + Client Secret) for Google federated sign-in.

> Apple Sign-In is **not** configured at this time.

---

## Configuration

The SAM template exposes the following parameters. Set them via `samconfig.toml`, `sam deploy --parameter-overrides`, or GitHub Actions secrets.

| Parameter           | Description                                                                   |
| ------------------- | ----------------------------------------------------------------------------- |
| `DomainName`        | Public domain for the UI (e.g. `catalog.example.com`).                        |
| `HostedZoneId`      | Route 53 Hosted Zone ID where DNS records will be created.                    |
| `GoogleClientId`    | Google OAuth 2.0 Client ID for Cognito federation.                            |
| `GoogleClientSecret`| Google OAuth 2.0 Client Secret (passed as `NoEcho`).                          |
| `Environment`       | Environment tag (e.g. `dev`, `prod`).                                         |

The React UI reads its runtime configuration (API base URL, Cognito Hosted UI URL, etc.) from environment variables defined in `ui/.env` (see `ui/README.md`).

All resources are deployed to **`us-east-1`** — the cheapest region for this stack and the required region for CloudFront ACM certificates.

---

## Deployment

Deployment is automated through GitHub Actions on **merges to `main`** (using GitHub OIDC to assume an AWS role — no long-lived keys). It can also be run manually:

```bash
# 1. Build and deploy the backend + infrastructure
cd infra
sam build
sam deploy --guided   # first time only; subsequent runs can use `sam deploy`

# 2. Build and publish the React UI
cd ../ui
npm install
npm run build
aws s3 sync dist/ s3://<ui-bucket-name>/ --delete
aws cloudfront create-invalidation --distribution-id <distribution-id> --paths "/*"
```

See `.github/workflows/README.md` for details on the automated pipeline.

---

## Local development

**Backend (Lambdas):**

```bash
cd infra
sam build
sam local start-api
```

This starts a local API on `http://localhost:3000` that mirrors the deployed API Gateway routes.

**Frontend (React UI):**

```bash
cd ui
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` by default.

---

## Documentation

Each folder has its own `README.md` with details specific to that part of the system:

- `infra/README.md` — SAM template, parameters, resources.
- `src/shared/README.md` — shared Lambda helpers.
- `src/lambdas/README.md` — list of Lambda functions and their contracts.
- `src/lambdas/<name>/README.md` — per-function documentation (input, output, IAM, env).
- `ui/README.md` — React app architecture, scripts, env vars.
- `.github/workflows/README.md` — CI/CD pipeline.

Project-level design documents live in `docs/`.
