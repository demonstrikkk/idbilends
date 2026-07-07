# Production Checklist

This checklist defines what remains before LendSignal 360 can be treated as production software. The current repository is demo-ready, not production-ready.

## Access Control

- Add authentication for bank users.
- Add roles for officer, relationship manager, risk reviewer, and admin.
- Restrict governance, traces, audit views, and write actions by role.
- Add session expiration and environment-specific signing secrets.

## Persistence

- Move from in-memory `DemoStore` to PostgreSQL.
- Add SQLAlchemy-backed repositories for core entities.
- Add Alembic migrations and migration checks in CI.
- Add indexes for case filters, score lookups, prospect priority, audit events, and timestamps.

## Rate Limiting And Redis

- Add API rate limiting before real production use.
- Use Redis or an equivalent managed service for throttling, idempotency, and future async job coordination.
- Apply stricter limits to Copilot generation, login, document upload, and any future webhook endpoints.

## Observability

- Add structured application logs without secrets.
- Add request tracing and error reporting for frontend and backend.
- Monitor latency, error rates, provider failures, and Copilot fallback frequency.
- Alert on failed health/readiness checks.

## Audit And Governance

- Persist audit events append-only.
- Define audit retention policy.
- Record rule version, prompt version, provider, model, actor, request id, and trace length.
- Keep human overrides separate from deterministic score outputs.

## Security

- Enforce HTTPS in deployed environments.
- Keep CORS explicit and environment-specific.
- Keep Groq/OpenAI-compatible keys backend-only.
- Store secrets in a managed secret store, not repository files.
- Review security headers after deployment target is known.
- Do not log raw sensitive data or provider keys.

## AI Safety

- Keep deterministic scoring as the source of truth.
- Keep Copilot outputs decision-support only.
- Minimize LLM context to sanitized internal inputs.
- Do not send raw bank statements, real identifiers, secrets, or logs to external providers.
- Review prompt and provider changes through governance.
- Maintain provider/model traceability for every AI output.

## Data And Backups

- Use synthetic data only until real consented data ingestion is designed.
- Define backup and restore procedures for PostgreSQL.
- Define data retention and deletion policy.
- Add environment separation for local, staging, and production.

## CI/CD

- Keep backend tests, frontend lint, typecheck, and build as required checks.
- Add container build checks before deployment.
- Add migration checks once Alembic is active.
- Add deployment approvals for production.

## Human Decision Boundary

- Keep UI and API language clear that the system supports human review.
- Do not present Copilot or scores as final loan approval or final rejection.
- Require verified documents and bank policy before real lending action.
