# LendSignal 360

AI-powered MSME credit intelligence platform for prospect discovery, alternative-data financial health scoring, explainable credit decisioning, and controlled agentic lending assistance.

## What this is

LendSignal 360 is a bank-grade decision-support system for MSME lending. It helps lending teams answer:

- Which MSMEs are promising prospects?
- What is their financial health?
- How much credit may be safe to consider?
- Why did the system produce this score?
- What documents or signals are missing?
- What should a bank officer review next?

## What this is not

This is not an automated final loan approval engine. It is decision-support software. Final credit decisions require human review, bank policy, compliance checks, and verified data.

## Repo structure

```txt
apps/
  web/       Next.js frontend
  api/       FastAPI backend
  worker/    optional async/AI worker
packages/
  shared/    shared schemas/types
  ui/        shared UI package if needed
  config/    shared config
docs/        architecture, API, product, roadmap
prompts/     Codex task prompts
infra/       docker, CI, deployment notes
datasets/    synthetic/demo datasets only
tests/       cross-service tests
```

## Start with Codex

1. Paste the exported deep-research document into `docs/RESEARCH_BLUEPRINT.md`.
2. Give Codex `prompts/00_MASTER_CODEX_PROMPT.md`.
3. Then run the phase prompts in order:
   - `prompts/01_PHASE_0_PLANNING.md`
   - `prompts/02_PHASE_1_BACKEND.md`
   - `prompts/03_PHASE_2_FRONTEND.md`
   - `prompts/04_PHASE_3_AGENTIC_AI.md`
   - `prompts/05_PHASE_4_PRODUCTION_HARDENING.md`

## MVP target

A working local MVP where:

```bash
docker compose up --build
```

runs:
- frontend dashboard
- backend API docs
- seeded synthetic MSME profiles
- financial health scoring endpoint
- one complete MSME profile detail page
- Credit Copilot AI lending brief in mock mode

## Frontend

```bash
cd apps/web
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

By default the Phase 2 frontend reads the FastAPI backend from `http://localhost:8000`. Override with `NEXT_PUBLIC_API_BASE_URL` if the API runs elsewhere.

Phase 2.5 expands the frontend into a backend-backed credit operating cockpit:

- Overview, Credit Review, Watchlist, Alerts, Portfolio, Data Insights, Model Monitor, Reports, Policy Center, Data Dictionary, and Audit Trail routes.
- All visible credit records, score values, risk tiers, confidence values, suggested ranges, warnings, prospect actions, and audit rows come from implemented backend routes or are derived from their responses.
- Backend-limited areas are labelled honestly: report history needs a report service, policy tables need a policy database, and historical model monitoring needs persistent score history.
- Phase 3 adds a controlled Credit Copilot workflow with mock-by-default provider mode, optional Groq integration, sanitized context packs, audited trace, and SSE streaming.

## Credit Copilot Provider Modes

Mock mode works locally without keys:

```bash
AI_PROVIDER=mock
```

Groq mode is optional and backend-only:

```bash
AI_PROVIDER=groq
GROQ_API_KEY=
```

Streaming uses Server-Sent Events from `GET /copilot/{msme_id}/brief/stream`. The final SSE event contains the validated Copilot brief object. Raw statement rows, real personal identifiers, secrets, and logs are not sent to model providers. The provider adapter can be replaced later with a private or fine-tuned open-source model.

Provider status is visible at:

```bash
GET /copilot/provider/status
```

On Windows PowerShell, use `Invoke-RestMethod` for JSON requests:

```powershell
$body = @{
  mode = "groq"
  include_trace = $true
  regenerate = $true
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/copilot/msme_001/brief" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

Use `curl.exe`, not the PowerShell `curl` alias, for streaming:

```powershell
curl.exe -N "http://127.0.0.1:8000/copilot/msme_001/brief/stream?mode=mock"
```

Verify `provider` and `model` in the brief response or final SSE event. If Groq is selected without `GROQ_API_KEY`, the UI and API report provider unavailability while deterministic scoring remains available.

## Frontend Aggregation Endpoints

Phase 3.6 adds backend-derived read endpoints to reduce frontend fan-out:

- `GET /portfolio/cases`
- `GET /portfolio/summary`
- `GET /watchlist`
- `GET /alerts`
- `GET /insights/portfolio`
- `GET /model-monitor/snapshot`

These endpoints derive current snapshots from seeded synthetic profiles, deterministic scores, Prospect Assist, risk triggers, document warnings, and documented metadata. They do not fabricate historical model, policy, report, or alert records.

See `docs/UI_BACKEND_INTEGRITY_AUDIT.md` for page-by-page data provenance.
