# LendSignal 360 API

FastAPI backend for deterministic MSME credit scoring, Prospect Assist signals, synthetic demo seeding, audit events, and the controlled Credit Copilot workflow.

```bash
cd apps/api
python -m venv .venv
pip install -r requirements.txt
pytest
uvicorn app.main:app --reload
```

The current Phase 1 implementation uses deterministic in-memory local persistence for fast demo startup, while SQLAlchemy models remain DB-ready for the PostgreSQL migration phase.

## Credit Copilot

Mock mode is the default and requires no API key:

```bash
AI_PROVIDER=mock
```

Optional Groq mode:

```bash
AI_PROVIDER=groq
GROQ_API_KEY=
GROQ_MODEL_STREAM=llama-3.3-70b-versatile
GROQ_MODEL_STRUCTURED=openai/gpt-oss-20b
```

`AI_PROVIDER=disabled` keeps deterministic scoring usable and returns a safe unavailable Copilot response.

Endpoints:

- `GET /copilot/provider/status` returns configured provider, Groq readiness, streaming flag, and configured model names without exposing secrets.
- `POST /copilot/{msme_id}/brief` returns the final validated JSON brief.
- `GET /copilot/{msme_id}/brief/stream` streams Server-Sent Events: `status`, `node_update`, `token`, `final`, and `error`.

Credit Copilot only receives a sanitized context pack: profile summary, deterministic score output, prospect signals, risk factors, missing documents, and a derived transaction summary. It does not receive raw statement rows, real identifiers, phone/email/address fields, secrets, or logs. The provider layer can later be swapped for a private or fine-tuned open-source model by implementing the same provider interface.

Windows PowerShell JSON request:

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

Streaming from PowerShell:

```powershell
curl.exe -N "http://127.0.0.1:8000/copilot/msme_001/brief/stream?mode=mock"
```

Check `provider` and `model` in the JSON response or final SSE event to confirm which provider generated the brief.

Streaming limitation: Phase 3.6 keeps LangGraph as the fixed orchestrator and emits node-completion events from the graph path, while token chunks come from the selected provider adapter when supported. It does not expose full LangGraph `astream` `updates/custom/messages` modes yet.

## Aggregation Endpoints

- `GET /portfolio/cases`
- `GET /portfolio/cases?limit=&offset=&sort=&risk_tier=&segment=&query=`
- `GET /portfolio/summary`
- `GET /watchlist`
- `GET /alerts`
- `GET /insights/portfolio`
- `GET /model-monitor/snapshot`
- `GET /case-inbox`
- `GET /credit-file/{msme_id}`
- `GET /credit-file/{msme_id}/evidence-map`

These endpoints are current derived snapshots only. They do not create fake policy databases, model history, report history, or alert persistence.

## Phase 6 Live Monitoring

- `POST /demo/seed` supports `profile_count` up to 1000 while preserving the 9 flagship profiles.
- `GET /score-history/{msme_id}` and `/latest-delta` expose stored score deltas.
- `POST /monitoring/start`, `POST /monitoring/stop`, `GET /monitoring/status`, `GET /monitoring/events`, and `POST /monitoring/events/manual` run the in-memory simulator.
- `WS /ws/monitoring` broadcasts monitoring lifecycle, feature events, score recomputes, alerts, and score deltas.
- `GET /scoring/weight-profiles`, `GET /market-overlays`, and `POST /market-overlays/simulate` show policy score and market-adjusted score separately.

## Phase 3.7 Credit File Workbench

The credit-file endpoints aggregate existing profile, deterministic score, Prospect Assist, document status, transaction summary, risk, and audit services. They do not alter scoring rules or create frontend-only records.

`POST /copilot/{msme_id}/chat` provides case-aware Q&A using the existing controlled Copilot graph. Responses include `decision_support_only=true`, cited internal inputs, provider/model, created time, and trace when requested.
