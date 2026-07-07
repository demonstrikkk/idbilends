# LendSignal 360

LendSignal 360 is a banker-facing MSME credit intelligence workbench for synthetic-demo credit appraisal, explainable scoring, Prospect Assist, and controlled Credit Copilot support.

One-line pitch: turn scattered MSME financial and document signals into an evidence-backed credit file for human lending review.

## Safety Boundary

This project is decision-support software. It does not provide final automated loan approval or final rejection. The deterministic score engine is the source of truth for score, risk tier, confidence, suggested range, factors, and missing-data warnings. Credit Copilot explains, summarizes, investigates, and recommends human review actions from sanitized internal inputs.

## Architecture

```txt
Next.js Web App
  -> typed API client and Zod validation
  -> Case Inbox, Credit File, Data Room, Evidence Map, Copilot, Governance

FastAPI Backend
  -> synthetic DemoStore
  -> deterministic scoring service
  -> Prospect Assist and risk services
  -> controlled Credit Copilot graph and provider adapters
  -> audit events, health, readiness

Future production layer
  -> PostgreSQL, Redis, auth/RBAC, observability, real consented adapters
```

## Demo Flow

1. Open `/case-inbox` to identify files needing action.
2. Open `msme_005` Pragati Design Services from a Missing Evidence lane.
3. Use the Credit File at `/msmes/{id}` to inspect readiness, blocker, score, confidence, and recommended human action.
4. Use `/data-room` to review organized evidence records and missing evidence.
5. Use `/evidence-map` to trace source data to score signals and human actions.
6. Ask Credit Copilot: "Why is this case blocked?"
7. Show audit trail and close with the decision-support boundary.

See [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for the 4-minute script.

## Features

- Synthetic MSME demo data only.
- Deterministic Financial Health Score.
- Risk tier, data confidence, suggested range, positive and negative factors.
- Prospect Assist priority, likely credit need, product fit, and recommended human action.
- Case Inbox and Credit File workbench.
- Data Room and Evidence Map.
- Credit Copilot with mock, Groq, and disabled provider modes.
- Provider status, trace metadata, and audit events.
- Docker Compose packaging and GitHub Actions CI.

## Current Status

Demo-ready for local review. Not production-ready. Known gaps include authentication, persistent storage, rate limiting, real financial integrations, durable audit retention, and production observability.

## Quickstart Without Docker

Backend:

```bash
cd apps/api
python -m venv .venv
pip install -r requirements.txt
python -m pytest
uvicorn app.main:app --reload
```

Frontend:

```bash
cd apps/web
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

Open:

- Frontend: `http://localhost:3000`
- Backend docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

## Quickstart With Docker

From the repository root:

```bash
docker compose up --build
```

Default ports:

- API: `http://localhost:8000`
- Web: `http://localhost:3000`

The default demo uses in-memory storage. PostgreSQL and Redis are not required.

## Environment Setup

Copy `.env.example` to `.env` for local development. Do not commit `.env`.

Important variables:

- `APP_ENV=development`
- `CORS_ORIGINS=http://localhost:3000`
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
- `AI_PROVIDER=mock`
- `GROQ_API_KEY=` only when using Groq mode
- `COPILOT_STREAMING_ENABLED=true`

## AI Provider Modes

Mock mode works without keys:

```bash
AI_PROVIDER=mock
```

Groq mode is optional and backend-only:

```bash
AI_PROVIDER=groq
GROQ_API_KEY=
```

Disabled mode leaves deterministic scoring available and returns safe Copilot unavailable responses:

```bash
AI_PROVIDER=disabled
```

Verify active provider state:

```bash
GET /copilot/provider/status
```

## API Routes

- `GET /health`
- `GET /ready`
- `POST /demo/seed`
- `GET /msmes`
- `GET /msmes/{msme_id}`
- `POST /scores/{msme_id}/generate`
- `GET /prospects/{msme_id}/signals`
- `GET /portfolio/cases`
- `GET /portfolio/summary`
- `GET /case-inbox`
- `GET /credit-file/{msme_id}`
- `GET /credit-file/{msme_id}/evidence-map`
- `POST /copilot/{msme_id}/brief`
- `GET /copilot/{msme_id}/brief/stream`
- `POST /copilot/{msme_id}/chat`
- `GET /audit/{msme_id}`

## Frontend Routes

- `/case-inbox`
- `/msmes`
- `/msmes/{id}`
- `/data-room`
- `/evidence-map`
- `/copilot`
- `/portfolio`
- `/governance`
- `/watchlist`
- `/alerts`
- `/reports`
- `/policy-center`
- `/data-dictionary`

## Test Commands

Backend:

```bash
cd apps/api
python -m pytest
```

Frontend:

```bash
cd apps/web
npm run lint
npm run typecheck
npm run build
```

## Known Limitations

- Synthetic data only.
- No real IDBI or private customer data.
- In-memory storage by default.
- No production auth/RBAC yet.
- No live AA, GST, Udyam, GeM, ULI, bureau, or core-banking integrations.
- No final lending approval or final rejection.
- Rate limiting and durable audit retention are future production work.

See [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md).

## Docs Index

- [Deployment](docs/DEPLOYMENT.md)
- [Production Checklist](docs/PRODUCTION_CHECKLIST.md)
- [Known Limitations](docs/KNOWN_LIMITATIONS.md)
- [Demo Script](docs/DEMO_SCRIPT.md)
- [Pitch Notes](docs/PITCH_NOTES.md)
- [Judge Q&A](docs/JUDGE_QA.md)
- [Future Roadmap](docs/FUTURE_ROADMAP.md)
- [API Contracts](docs/API_CONTRACTS.md)
- [Security Checklist](docs/SECURITY_CHECKLIST.md)
- [Credit File Workflow](docs/CREDIT_FILE_WORKFLOW.md)
- [UI Backend Integrity Audit](docs/UI_BACKEND_INTEGRITY_AUDIT.md)
