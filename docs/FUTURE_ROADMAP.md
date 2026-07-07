# Future Roadmap

## Persistence And Workflow

- PostgreSQL-backed repositories.
- Alembic migrations.
- Durable audit log.
- Human override workflow.
- Case assignment and officer notes.

## Access Control

- Authentication.
- Role-based access for relationship managers, risk reviewers, and admins.
- Restricted governance and trace views.

## Ecosystem Adapters

- Account Aggregator consent and fetch adapter.
- GST-style filing connector.
- Udyam verification adapter.
- GeM seller/order adapter.
- Future ULI journey adapter.

## Document Intelligence

- Upload pipeline.
- Bank statement and document parsing.
- Evidence extraction with review states.
- File storage with retention controls.

## Scoring And Explainability

- Persisted score history.
- Model monitoring with real history.
- XGBoost or similar tabular model after verified data exists.
- SHAP-style explainability for model-backed scores.
- Calibration and policy overlays.

## Search And Operations

- Typesense-backed case and borrower search.
- Redis rate limiting.
- Async jobs for parsing, enrichment, and exports.
- Observability with tracing, metrics, and error reporting.

## Deployment

- Environment-specific secrets.
- CI/CD deployment gates.
- Container build checks.
- Backups and restore drills.
- Production CORS, HTTPS, and security header review.
