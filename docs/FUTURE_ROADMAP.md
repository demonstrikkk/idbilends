# Future Roadmap

## Production Foundation

- PostgreSQL-backed repositories.
- Alembic migrations.
- Durable audit log, score history, monitoring events, and overlay versions.
- Environment-specific secrets.
- CI/CD deployment gates, backups, and restore drills.

## Access Control And Governance

- Authentication.
- Role-based access for relationship managers, credit reviewers, and admins.
- Human override workflow with reason capture.
- Restricted governance and trace views.
- Rate limits and abuse controls around Copilot and exports.

## Ecosystem Adapters

- Account Aggregator consent and fetch adapter.
- GST-style filing connector.
- Udyam verification adapter.
- GeM seller/order adapter.
- Bureau and core-banking adapters.
- Future ULI journey adapter.

## Document Intelligence

- Upload pipeline.
- Bank statement and document parsing.
- Evidence extraction with review states.
- File storage with retention controls.
- Document-level audit trail.

## Scoring And Explainability

- Production persistence for Phase 6 score history and score deltas.
- Model monitoring with real production history.
- Trained tabular model only after verified, consented data exists.
- SHAP-style explainability for model-backed scores.
- Calibration and policy overlays.

## Live Monitoring

- Replace the in-memory simulator with durable event ingestion.
- Add role-based alert assignment and officer action workflow.
- Add production observability for WebSocket sessions and event processing.

## Search And Operations

- Search-backed case and borrower lookup.
- Async jobs for parsing, enrichment, and exports.
- Observability with traces, metrics, logs, and error reporting.
- Production CORS, HTTPS, and security header review.
