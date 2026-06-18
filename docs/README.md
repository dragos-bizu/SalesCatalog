# docs/

Project-level documentation that does not belong to any single folder.

## Source-of-truth specs (provided by the product owner)

These three files describe the original requirements and decisions. They are the canonical reference for behaviour and architecture:

- [`../model_instructions.md`](../model_instructions.md) — agent tips, coding standards, package standards.
- [`../business_logic.md`](../business_logic.md) — functional requirements of the catalog.
- [`../architecture.md`](../architecture.md) — high-level technical architecture and repository structure.

## Additional documents

Design notes, ADRs (Architecture Decision Records), and diagrams will be added here as the project grows. Examples of what belongs in `docs/`:

- API contract reference (consolidated view of every endpoint).
- Data model diagrams (DynamoDB tables, access patterns).
- Sequence diagrams for non-trivial flows (e.g. image upload, admin login).
- ADRs for significant decisions (e.g. "Why DynamoDB Scan for search").

Anything specific to a single folder (infra, a Lambda, the UI) lives in that folder's own `README.md` instead.
