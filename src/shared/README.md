# src/shared/

Reusable Python helpers imported by multiple Lambda functions.

This folder is **not** a Lambda itself — it is packaged as a **Lambda Layer** (defined in `infra/template.yaml`) and attached to the handlers in `src/lambdas/` that need it.

## Contents

- `db.py` — DynamoDB client/resource configuration and small helpers (table handles, serialization, pagination cursor encoding/decoding).
- `auth.py` — helpers for reading verified JWT claims and enforcing admin authorization (Cognito group membership) from API Gateway request context.

Additional helpers will be added here as needed (e.g. response builders, validation utilities). Anything used by **two or more** Lambdas belongs here; anything used by exactly one belongs inside that Lambda's folder.

## Conventions

- Pure functions whenever possible — easier to unit test.
- No global state beyond cached AWS SDK clients.
- All AWS resource names (table names, bucket names) are read from environment variables, never hard-coded.
- Every public function has a docstring describing inputs, outputs and side effects.

## Tests

Unit tests for shared helpers live next to the source files (`*_test.py`) and use **`pytest`** + **`moto`** to mock AWS services.

Run the full backend test suite from the repository root:

```bash
pytest
```
