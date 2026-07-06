# LendSignal 360 — Roadmap v2

## Roadmap philosophy

Build in vertical slices that preserve the product story:

```txt
Synthetic profile
  ↓
Score + prospect signals
  ↓
Credit cockpit UI
  ↓
Credit Copilot brief
  ↓
Governance + demo polish
```

Do not build a huge unfinished codebase.

## Phase 0 — Research-to-spec conversion

### Goal

Turn research into implementation-grade docs.

### Scope

Create/update:

- PROJECT_BRIEF
- ARCHITECTURE
- API_CONTRACTS
- DATA_MODEL
- SCORING_DESIGN
- AGENTIC_AI_DESIGN
- UI_UX_SPEC
- SECURITY_CHECKLIST
- DEMO_STRATEGY
- ROADMAP

### Acceptance criteria

- No major architecture ambiguity remains.
- Scoring rules are implementable.
- API contracts include examples.
- AI agent has tool boundaries.
- Demo story is clear.

### Do not do

- Do not build full app.
- Do not add fake implementation claims.

## Phase 1 — Backend credit engine

### Goal

Build deterministic backend foundation.

### Scope

- FastAPI app
- config/env handling
- health/readiness endpoints
- DB models
- synthetic data service
- MSME list/detail endpoints
- Financial Health Score service
- Prospect Assist service
- risk/early warning service
- audit service
- tests

### Key files

```txt
apps/api/app/main.py
apps/api/app/core/
apps/api/app/db/
apps/api/app/schemas/
apps/api/app/api/routes/
apps/api/app/services/
apps/api/app/tests/
```

### Acceptance criteria

- backend starts
- seed endpoint works
- MSME profiles returned
- score endpoint returns score, tier, confidence, reason codes
- prospect endpoint returns priority and next action
- tests pass

### Tests

- scoring range
- healthy > stressed
- data confidence penalties
- suspicious spike warning
- suggested limit logic
- prospect ranking
- API smoke tests

### Do not do

- no frontend
- no real AI calls
- no real customer data

## Phase 2 — Frontend credit cockpit

### Goal

Build polished bank-grade dashboard.

### Scope

- Next.js app
- dashboard
- MSME list
- MSME detail
- score visualization
- prospect readiness panel
- risk intelligence panel
- document gaps
- audit/diagnostics placeholder
- typed API client

### Key files

```txt
apps/web/src/app/
apps/web/src/components/
apps/web/src/lib/api/
apps/web/src/lib/schemas/
```

### Acceptance criteria

- dashboard loads backend data
- detail page tells complete lending story
- UI feels serious and not generic
- loading/error/empty states exist
- lint/typecheck/build run

### Do not do

- no frontend score calculation
- no fake Copilot brief as final feature
- no heavy animations

## Phase 3 — Credit Copilot agent

### Goal

Add controlled agentic AI layer.

### Scope

- agent graph/orchestrator
- mock provider
- OpenAI-compatible provider optional
- tool allowlist
- node prompts
- Copilot endpoint
- frontend Copilot panel
- trace accordion
- audit events
- tests

### Key files

```txt
apps/api/app/agents/
apps/api/app/api/routes/copilot.py
apps/web/src/components/copilot/
```

### Acceptance criteria

- mock mode works without API key
- brief is grounded in score/profile/prospect data
- trace visible
- agent cannot modify score
- no final approval language
- tests pass

### Do not do

- no free-roaming agent
- no browsing
- no arbitrary tool execution
- no paid-key dependency

## Phase 4 — Production hardening

### Goal

Make app deployable and reliable.

### Scope

- Docker Compose
- CI workflow
- security headers
- CORS
- safe error shape
- logging
- request IDs
- readiness checks
- DB indexes
- deployment docs
- production checklist

### Acceptance criteria

- local setup documented
- CI checks defined
- frontend handles backend failure
- AI failure is non-destructive
- secrets not committed
- deployment guide exists

### Do not do

- no Kubernetes
- no unnecessary microservices
- no scoring redesign unless bug fix

## Phase 5 — Demo polish

### Goal

Make submission memorable.

### Scope

- at least 8 strong synthetic profiles
- flagship demo profile
- demo script
- pitch notes
- judge Q&A
- README polish
- screenshots placeholders
- final UX copy

### Flagship stories

1. high-potential GeM-like seller
2. healthy manufacturer asking for too much credit
3. missing documents case
4. high buyer concentration case
5. suspicious revenue spike case
6. stressed business case

### Acceptance criteria

- demo under 4 minutes
- value clear in 30 seconds
- score has reason codes
- Copilot brief grounded
- trace visible
- fallback works without API key

## Cross-phase quality gates

Every phase must report:

```txt
Summary
Research Blueprint alignment
Files changed
Commands run
Tests/checks
Known limitations
Next recommended phase
```

## Final definition of done

The project is complete when:

- `docker compose up --build` runs local demo or documented equivalent exists
- backend tests pass
- frontend build passes
- mock AI mode works
- no real PII exists
- README has clear setup
- demo script exists
- security checklist is mostly complete
- the product story is not generic
