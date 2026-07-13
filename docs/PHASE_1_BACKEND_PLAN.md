# Phase 1 Backend Plan — HISTORICAL (completed)

## Objective

Implement the deterministic backend credit engine without building the frontend or the Credit Copilot provider layer.

## Phase boundaries

Do:

- FastAPI foundation
- typed schemas
- persistence-ready data model
- deterministic synthetic seed service
- deterministic score engine
- Prospect Assist service
- risk and audit services
- Phase 1 endpoints and tests

Do not do:

- frontend pages
- Copilot orchestration
- paid AI providers
- real integrations

## Implementation order

### 1. App foundation

Create:

- config and env loading
- app factory and route registration
- safe error handlers
- health and readiness endpoints
- request ID plumbing

Definition of done:

- `/health` returns static service metadata
- `/ready` checks database and provider mode safely

### 2. Domain model and schemas

Implement entities from `docs/DATA_MODEL.md`:

- `MSMEProfile`
- `FinancialSnapshot`
- `DocumentStatus`
- `ScoreOutput`
- `ProspectSignalOutput`
- `AuditEvent`

Use separate Pydantic response/request schemas for:

- MSME list/detail
- score generation
- prospect signals
- audit events
- seed requests/responses

Rule:

- route handlers map service outputs to schemas
- no scoring logic in routes

### 3. Synthetic data engine

Build a deterministic seed generator with:

- fixed random seed support
- segment-specific baseline ranges
- scenario overlays for healthy, moderate, risky, and suspicious cases
- seeded latest financial snapshot and document status
- at least 8 profiles, preferably 9 including suspicious spike

Required scenarios:

- healthy_growth
- stable_moderate
- seasonal_volatility
- cashflow_stress
- high_buyer_concentration
- document_gap
- suspicious_spike
- debt_overload

### 4. Scoring service

Implement rule-based scoring exactly from `docs/SCORING_DESIGN.md`:

- component scores
- risk-tier mapping
- data-confidence penalties
- early-warning triggers
- suspicious-pattern checks
- reason-factor generation
- suggested credit range formula
- recommendation mapping

Hard rule:

- score, risk tier, confidence, and credit range are backend-owned outputs only

### 5. Prospect Assist service

Implement separately from health score:

- prospect score
- priority
- likely credit need
- best product fit
- next best action
- outreach timing
- supporting signals

Rule:

- Prospect Assist can consume deterministic outputs but cannot rewrite score outputs

### 6. Audit service

Create DB-backed audit events for:

- demo seed generated
- score generated
- prospect signals generated

Capture:

- actor
- request ID
- event type
- safe metadata

### 7. API routes

Implement:

- `GET /health`
- `GET /ready`
- `POST /demo/seed`
- `GET /msmes`
- `GET /msmes/{id}`
- `POST /scores/{id}/generate`
- `GET /prospects/{id}/signals`
- `GET /audit/{id}`

Route behavior decision to lock early:

- `POST /demo/seed` should create seeded profiles and precompute score/prospect outputs for stable demo UX

## File plan

Primary files:

- `apps/api/app/main.py`
- `apps/api/app/core/config.py`
- `apps/api/app/core/errors.py`
- `apps/api/app/core/security.py`
- `apps/api/app/db/models.py`
- `apps/api/app/db/session.py`
- `apps/api/app/db/seed.py`
- `apps/api/app/schemas/common.py`
- `apps/api/app/schemas/msme.py`
- `apps/api/app/schemas/score.py`
- `apps/api/app/schemas/prospect.py`
- `apps/api/app/schemas/audit.py`
- `apps/api/app/api/routes/health.py`
- `apps/api/app/api/routes/demo.py`
- `apps/api/app/api/routes/msmes.py`
- `apps/api/app/api/routes/scores.py`
- `apps/api/app/api/routes/prospects.py`
- `apps/api/app/api/routes/audit.py`
- `apps/api/app/services/synthetic_data_service.py`
- `apps/api/app/services/scoring_service.py`
- `apps/api/app/services/prospect_service.py`
- `apps/api/app/services/risk_service.py`
- `apps/api/app/services/audit_service.py`

## Testing plan

Required tests:

- score remains within `0-100`
- risk tier mapping matches thresholds
- healthy profile scores above stressed profile
- missing documents reduce confidence
- suspicious spike produces warnings/triggers
- suggested max never exceeds requested amount
- high-risk profile gets lower suggested range
- prospect ranking prefers stronger profiles
- health endpoint works
- seed endpoint creates deterministic dataset

## Non-negotiable rules

- no frontend-owned score logic
- no real PII
- no hardcoded secrets
- no AI dependency for Phase 1 completion
- no final approval language in response fields or enums

## Exit criteria

Phase 1 is complete when:

- backend starts
- seed flow is deterministic
- score endpoint returns full deterministic output
- prospect endpoint returns actionable prioritization
- audit records exist for generation actions
- tests pass or failures are explicitly documented
