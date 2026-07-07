# LendSignal 360 Web

Phase 3.7 Next.js MSME Credit File Workbench for the existing FastAPI backend. The primary workflow is Case Inbox -> Credit File -> Data Room / Evidence Map -> Credit Copilot -> human review action.

## Commands

```bash
cd apps/web
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

The frontend expects the Phase 1 backend at:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

The current backend exposes unversioned routes such as `/msmes`, `/scores/{id}/generate`, `/prospects/{id}/signals`, `/audit/{id}`, `/health`, and `/ready`. The product docs describe `/api/v1` as the preferred future base path, so the frontend keeps the base URL configurable.

## Backend-backed pages

- `/case-inbox`: `GET /case-inbox`.
- `/msmes`: credit file register from `GET /portfolio/cases`.
- `/msmes/{id}`: flagship Credit File workbench from `GET /credit-file/{id}`.
- `/data-room`: selected credit file evidence status from `GET /credit-file/{id}`.
- `/evidence-map`: `GET /credit-file/{id}/evidence-map`.
- `/copilot`: case-aware chat through `POST /copilot/{id}/chat` plus existing brief/stream controls.
- `/portfolio`: portfolio-level signals.
- `/governance`: health, readiness, provider status, and audit events.

Phase 3.7 pages prefer credit-file aggregation endpoints so the frontend does not own score, evidence, or underwriting derivation logic.

## Backend-limited pages

- `/policy-center`: docs-backed governance view; no fabricated policy database.
- `/reports`: live JSON/CSV export from API-backed views; no fabricated report history.
- `/data-dictionary`: static field ownership reference.

## Phase 2.5 boundaries

- Scores, risk tiers, suggested credit ranges, reason factors, prospect scores, and next best actions are rendered from backend responses only.
- The frontend does not calculate credit or prospect scores.
- Credit Copilot is backend-backed in Phase 3 through `/copilot/{id}/brief` and `/copilot/{id}/brief/stream`.
- All visible credit language is decision-support oriented and avoids final automated approval claims.
- Empty MSME lists show an explicit "Seed Demo Data" action; the frontend does not silently create fabricated records.

## Credit Copilot UI

The Copilot page adds a chat-style interface with banker prompt suggestions. Responses come from `POST /copilot/{id}/chat` and render provider/model, cited internal inputs, and trace. The MSME detail page still supports validated JSON brief generation and `EventSource` SSE streaming.

The panel also calls `GET /copilot/provider/status` and displays configured provider, active provider state, structured model, and stream model. If Groq is selected but unavailable, it shows a clear deterministic-score fallback message instead of silently presenting mock output as Groq output.
