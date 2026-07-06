# 05_PHASE_4_PRODUCTION_HARDENING.md

You are implementing Phase 4: Production Hardening.

Do not add random new features.
Do not redesign the product.
Make the existing system more production-ready, secure, observable, and deployable on a budget.

## First steps

Read:

1. `docs/RESEARCH_BLUEPRINT.md`
2. `docs/SECURITY_CHECKLIST.md`
3. `docs/ARCHITECTURE.md`
4. `docs/AGENTIC_AI_DESIGN.md`
5. `docs/API_CONTRACTS.md`
6. `docs/ROADMAP.md`

Search inside `docs/RESEARCH_BLUEPRINT.md` and `docs/SECURITY_CHECKLIST.md` for:

* deployment
* security
* observability
* environment variables
* free-tier hosting
* CORS
* audit
* AI safety
* compliance
* error logging
* monitoring
* production checklist

## Goals

Harden the app for:

* hackathon demo reliability
* budget deployment
* future production migration
* safe AI behavior
* clean engineering review

## Backend hardening

Implement or improve:

### 1. Config management

* centralized settings
* environment-based config
* `.env.example`
* no hardcoded secrets
* safe default values

### 2. CORS

* strict `CORS_ORIGINS`
* no wildcard in production
* documented local/prod config

### 3. Error handling

* consistent error response shape
* no stack traces in production responses
* safe 404/400/500 responses
* request ID if practical

### 4. Logging

* structured logs
* log level from env
* log request path/status/duration if practical
* log agent failures safely
* do not log secrets

### 5. Health/readiness

Implement:

```txt
GET /health
GET /ready
```

Readiness should check DB connection if DB exists.

### 6. Database indexes

Add indexes for:

* MSME id
* risk tier
* prospect priority
* created_at
* audit event msme_id
* score output msme_id

### 7. Rate-limit readiness

Add lightweight middleware or document how Redis-backed rate limiting would be added.

If implementing middleware, keep it simple and safe.

### 8. Audit hardening

Ensure audit events are created for:

* score generation
* prospect signal generation
* copilot brief generation
* demo seed generation
* agent failure

## Frontend hardening

Implement or improve:

### 1. Security headers

For Next.js, configure practical headers if possible:

* X-Frame-Options
* X-Content-Type-Options
* Referrer-Policy
* Permissions-Policy
* Content-Security-Policy if practical without breaking dev

### 2. API error handling

* backend unavailable state
* retry where sensible
* user-friendly errors
* no blank screens

### 3. AI output safety

* render AI output as plain text/controlled markdown only
* do not dangerously inject HTML
* show decision-support disclaimer near Copilot output

### 4. Performance

* avoid unnecessary client rendering
* use loading states
* optimize charts/tables
* avoid huge client bundles where practical

## CI/CD

Add GitHub Actions workflow if project structure supports it.

Required checks, depending on what exists:

Backend:

```bash
pytest
```

Frontend:

```bash
npm run lint
npm run typecheck
npm run build
```

If monorepo package manager is not finalized, document exact commands.

## Docker Compose

Improve local dev.

Target:

```bash
docker compose up --build
```

Should run:

* frontend
* backend
* postgres
* redis optional

If full Compose is too heavy for current state, provide working partial Compose and document remaining steps.

## Deployment docs

Create or update:

```txt
docs/DEPLOYMENT.md
```

Include budget deployment paths:

### Option A

* Vercel frontend
* Render/Railway/Fly backend
* Neon/Supabase PostgreSQL

### Option B

* Full Docker deployment on one VPS

### Option C

* Local-only hackathon demo

Include:

* env vars
* build commands
* start commands
* CORS config
* database setup
* AI mock/real provider setup

## Production checklist

Update:

```txt
docs/PRODUCTION_CHECKLIST.md
```

Include:

* secrets
* CORS
* headers
* DB indexes
* migrations
* logging
* monitoring
* backups
* auth
* rate limits
* AI safety
* audit logs
* demo fallback
* data disclaimer

## Do not do

* Do not add Kubernetes.
* Do not add microservices.
* Do not add paid-only dependencies.
* Do not change scoring behavior unless fixing a bug.
* Do not remove mock AI mode.
* Do not break local demo for production purity.

## Acceptance criteria

Phase 4 is complete only when:

* env/config are clean
* security checklist is updated
* health/readiness exist
* local run is documented
* CI exists or exact checks are documented
* frontend handles failures gracefully
* AI outputs remain safe
* deployment guide exists
* app remains runnable

Final report format:

```txt
Summary
Research Blueprint alignment
Files changed
Commands run
Tests/checks
Known limitations
Next recommended phase
```

