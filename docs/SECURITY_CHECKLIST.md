# LendSignal 360 — Security Checklist v2

## 1. Security posture

This is a synthetic-data hackathon MVP, but it must be built like a future bank PoC.

Priority:

1. no secrets leakage
2. no real PII
3. no unsafe AI decisions
4. clear audit trail
5. safe API boundaries
6. production-ready deployment defaults

## 2. Secrets

- `.env` must not be committed.
- `.env.example` must be committed.
- AI provider keys must be backend-only.
- No keys in frontend source.
- No keys in logs.
- No secrets in screenshots or demo data.
- Use separate dev/prod environment variables.

Required env vars:

```txt
APP_ENV
DATABASE_URL
CORS_ORIGINS
AI_PROVIDER
OPENAI_API_KEY
OPENAI_BASE_URL
OPENAI_MODEL
LOG_LEVEL
SENTRY_DSN
NEXT_PUBLIC_API_BASE_URL
```

## 3. Data protection

MVP must use synthetic data only.

Do not store:

- Aadhaar
- PAN
- real GSTIN
- real bank account numbers
- real credit bureau data
- real phone numbers
- real emails
- real addresses
- real names of borrowers

Allowed:

- fake business names
- fake city/state
- synthetic financial values
- synthetic document statuses
- synthetic order/payment signals

## 4. API security

- Validate all inputs with Pydantic.
- Use safe error responses.
- Do not expose stack traces.
- Add request ID where practical.
- Configure CORS through env.
- No wildcard CORS in production.
- Add rate-limit-ready middleware or documented Redis plan.
- Use pagination for list endpoints.
- Clamp numeric query params.
- Validate enum filters.

## 5. Error response standard

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request.",
    "details": {},
    "request_id": "req_123"
  }
}
```

## 6. Auth and authorization

MVP may use demo auth.

Future-ready roles:

```txt
bank_officer
relationship_manager
risk_reviewer
admin
demo_applicant
```

Rules:

- governance/dev trace should require admin role once real auth exists
- audit events should not be publicly exposed in production
- Copilot generation should require authenticated user in production
- write actions should be role-protected

Recommended future providers:

- Clerk
- Supabase Auth
- Auth.js if full custom control is desired

## 7. AI safety

Credit Copilot must not:

- approve loans as final authority
- reject loans as final authority
- invent financial metrics
- modify score
- hide missing data
- claim real verification
- browse web
- call unknown tools
- expose internal prompts to normal users
- render untrusted HTML

Credit Copilot must:

- cite internal inputs
- show assumptions
- show confidence
- include `decision_support_only: true`
- log trace
- use mock mode by default
- fail safely
- create audit events

## 8. Prompt safety

Prompts must include:

- allowed inputs
- forbidden behavior
- output schema
- no invention instruction
- decision-support disclaimer
- citation requirement
- missing-data honesty requirement

Prompt files must be versioned.

## 9. Tool safety

Only allowlisted tools:

- get_msme_profile
- get_financial_health_score
- get_risk_factors
- get_missing_documents
- get_transaction_summary
- get_prospect_signals
- create_audit_event

Unknown tool calls must be denied and logged.

## 10. Frontend security

- Do not use `dangerouslySetInnerHTML` for AI output.
- Render Copilot text as plain text or safe controlled markdown.
- Validate important API responses with Zod.
- Add error boundaries.
- Add loading/error/empty states.
- Add security headers.

Recommended headers:

```txt
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

CSP can be added after deployment target is known.

## 11. Database security

- Use migrations.
- Add indexes.
- Avoid storing raw files.
- Avoid storing secrets in DB.
- Use least-privilege DB credentials in production.
- Backups for production.
- Do not log sensitive query values.

Required indexes:

- MSMEProfile.segment
- MSMEProfile.scenario_label
- ScoreOutput.msme_id
- ScoreOutput.risk_tier
- ScoreOutput.created_at
- ProspectSignalOutput.msme_id
- ProspectSignalOutput.priority
- CopilotBrief.msme_id
- AuditEvent.msme_id
- AuditEvent.event_type
- AuditEvent.created_at

## 12. Audit requirements

Create audit events for:

- demo seed generated
- score generated
- prospect signals generated
- Copilot brief generated
- Copilot brief failed
- human override recorded
- provider mode changed

Audit metadata should include:

- actor
- request ID
- provider
- rule version
- prompt version
- trace length
- success/failure status

## 13. Deployment checklist

Before deployment:

- HTTPS enabled
- production CORS set
- debug disabled
- env vars set
- database migrated
- seed mode understood
- mock AI mode works
- real provider optional
- logs configured
- health/readiness endpoints pass
- frontend build passes
- backend tests pass
- no `.env` committed
- README setup verified

## 14. AI failure handling

If provider fails:

- do not break score page
- show fallback message
- create failed audit event
- advise human review
- keep deterministic score visible

## 15. Responsible AI disclaimer

Display near score and Copilot output:

> This system provides decision-support signals for human review. It does not issue final credit approval. Scores and briefs should be verified against official documents and bank policy before any real lending action.

## 16. Final security definition of done

Security is acceptable for demo when:

- no real PII exists
- no secrets are committed
- mock AI works
- AI cannot mutate score
- agent trace is visible
- safe errors exist
- CORS is configured
- audit events are created
- frontend does not render unsafe AI HTML
