# LendSignal 360 — Architecture v2

## 1. Architecture goals

The architecture must support:

- deterministic credit scoring
- separate Prospect Assist intelligence
- controlled agentic AI
- explainability
- synthetic data
- auditability
- budget deployment
- fast hackathon iteration
- clean migration path toward production

The architecture must avoid:

- black-box AI decisioning
- free-roaming agents
- frontend-owned scoring logic
- real personal data
- premature microservices
- paid-only dependencies
- unclear API boundaries

## 2. System context

```txt
Bank Officer / Relationship Manager
        ↓
Next.js Credit Cockpit
        ↓ REST/JSON
FastAPI Backend
        ↓
Domain Services
  ├── MSME Profile Service
  ├── Synthetic Data Service
  ├── Financial Health Score Service
  ├── Prospect Assist Service
  ├── Risk / Early Warning Service
  ├── Credit Copilot Agent Orchestrator
  ├── Audit Service
  └── Provider Adapters
        ↓
PostgreSQL
Redis optional
LLM Provider optional
```

## 3. Source-of-truth boundaries

### 3.1 Backend is the source of truth

The backend owns:

- scoring
- prospect scoring
- risk tiering
- suggested credit range
- reason code generation
- audit events
- AI tool outputs
- provider configuration

### 3.2 Frontend is presentation and orchestration only

The frontend must not:

- calculate score
- modify risk tier
- fabricate AI brief
- infer suggested credit limit
- hardcode product logic beyond display labels

The frontend may:

- fetch data
- render score and risk visually
- trigger score generation
- trigger Copilot brief generation
- show trace and audit records

### 3.3 LLM is not the score authority

The LLM/agent may:

- explain
- summarize
- investigate
- ask questions
- create a lending brief

The LLM/agent must not:

- change numeric score
- approve/reject finally
- invent missing financial values
- hide low confidence
- use unapproved tools

## 4. Recommended stack

| Layer | Choice | Why | Watchouts |
|---|---|---|---|
| Frontend | Next.js App Router + TypeScript | Fast dashboard development, good deployment, typed UI | Avoid mixing server/client boundaries randomly |
| Styling | Tailwind + shadcn/ui | Polished UI quickly, consistent components | Avoid component sprawl |
| Client data | TanStack Query | Robust async state, retries, caching | Keep query keys disciplined |
| Validation | Zod frontend, Pydantic backend | Strong API boundary | Keep schemas aligned |
| Backend | FastAPI | Excellent for Python ML/AI APIs and OpenAPI | Keep route handlers thin |
| DB | PostgreSQL | Reliable relational core, JSONB, future pgvector | Add indexes early |
| Cache/queue | Redis optional | Rate limit, async jobs, Copilot traces | Keep optional for MVP |
| Agent orchestration | LangGraph-style workflow | Controlled auditable agent flow | Avoid agent autonomy |
| AI provider | Mock default + OpenAI-compatible adapter | Demo works free, upgrade path exists | Provider keys backend-only |
| Deployment | Vercel + Render/Railway/Fly + Neon/Supabase Postgres | Budget-friendly | CORS/env config must be correct |

## 5. Backend architecture

```txt
apps/api/app/
  main.py
  core/
    config.py
    logging.py
    errors.py
    security.py
    constants.py
  db/
    session.py
    models.py
    repositories.py
    seed.py
    migrations/
  schemas/
    common.py
    msme.py
    score.py
    prospect.py
    copilot.py
    audit.py
    errors.py
  api/
    routes/
      health.py
      demo.py
      msmes.py
      scores.py
      prospects.py
      copilot.py
      audit.py
      credit_file.py
      evidence.py
      command_center.py
      case_inbox.py
      monitoring.py
      portfolio.py
      watchlist.py
      alerts.py
      insights.py
      model_monitor.py
      market_overlays.py
      scoring_weights.py
  services/
    msme_service.py
    synthetic_data_service.py
    scoring_service.py
    prospect_service.py
    risk_service.py
    audit_service.py
    evidence_service.py
    credit_file_service.py
    monitoring_service.py
    command_center_service.py
    market_overlay_service.py
    score_history_service.py
  agents/
    graph.py
    state.py
    nodes.py
    tools.py
    prompts/
      data_quality_v1.md
      credit_analyst_v1.md
      prospect_assist_v1.md
      risk_investigator_v1.md
      lending_brief_v1.md
    providers/
      base.py
      mock.py
      openai_compatible.py
      groq.py
    schemas.py
  tests/
```

## 6. Service responsibilities

### MSME Profile Service

Owns:

- fetching profiles
- list filters
- profile hydration
- linking financial snapshot, documents, scores, prospects, audit

### Synthetic Data Service

Owns:

- deterministic seed data
- scenario generation
- fake profile names
- segment-specific values
- reproducible test fixtures

### Scoring Service

Owns:

- financial health score
- risk tier
- data confidence
- suggested credit range
- score factors
- missing data warnings
- scoring trace
- rule version

### Prospect Service

Owns:

- prospect score
- priority
- likely credit need
- product fit
- next best action
- prospect signal list

### Risk Service

Owns:

- early warning triggers
- suspicious spike detection
- debt stress detection
- buyer concentration analysis
- cashflow stress analysis

### Audit Service

Owns:

- audit event creation
- event retrieval
- trace references
- provider/rule/prompt versions

### Credit Copilot Agent Orchestrator

Owns:

- tool sequencing
- graph node execution
- prompt assembly
- provider call
- trace creation
- fallback behavior
- streaming brief generation
- chat and explain-delta endpoints
- per-node error recovery

### Evidence Service

Owns:

- evidence record CRUD
- file metadata and preview
- evidence status updates
- source-to-underwriting mapping

### Credit File Service

Owns:

- aggregate MSME credit file bundle
- evidence map generation
- transaction summary derivation

### Monitoring Service

Owns:

- live monitoring session lifecycle
- simulated event injection
- score delta tracking
- WebSocket event broadcast

### Command Center Service

Owns:

- 1000-case triage views
- saved views, filters, facets, pagination
- derived score deltas and blockers

### Market Overlay Service

Owns:

- simulated macro/industry overlays
- overlay impact on scores (deterministic, separate from policy score)
- overlay simulation endpoint

### Score History Service

Owns:

- score snapshot history per MSME
- latest delta computation
- score movement aggregation

## 7. Frontend architecture

```txt
apps/web/src/
  app/
    page.tsx
    command-center/page.tsx
    dashboard/page.tsx
    msmes/page.tsx
    msmes/[id]/page.tsx
    governance/page.tsx
    case-inbox/page.tsx
    data-room/page.tsx
    evidence-map/page.tsx
    copilot/page.tsx
    portfolio/page.tsx
    monitoring/page.tsx
    watchlist/page.tsx
    alerts/page.tsx
    policy-center/page.tsx
    model-monitor/page.tsx
    reports/page.tsx
    data-insights/page.tsx
    data-dictionary/page.tsx
  components/
    layout/
      AppShell.tsx
      Sidebar.tsx
      TopCommandBar.tsx
    command-center/
    dashboard/
      PortfolioSummaryCards.tsx
      RiskDistributionChart.tsx
      ProspectRankingTable.tsx
      EarlyWarningList.tsx
    msme/
      MSMEIdentityCard.tsx
      MSMEFinancialSnapshot.tsx
      MSMEDocumentStatus.tsx
    score/
      ScoreGauge.tsx
      RiskTierBadge.tsx
      DataConfidenceBar.tsx
      SuggestedLimitCard.tsx
      ReasonFactorCard.tsx
      MissingDataPanel.tsx
    prospect/
      ProspectPriorityCard.tsx
      ProductFitCard.tsx
      NextBestActionCard.tsx
    risk/
      EarlyWarningPanel.tsx
      RiskSignalMatrix.tsx
    copilot/
      CreditCopilotPanel.tsx
      CopilotBrief.tsx
      AgentTraceAccordion.tsx
      AgentStatusBadge.tsx
      ApprovalGate.tsx
      ToolCallCard.tsx
      TraceTimeline.tsx
    governance/
      AuditTimeline.tsx
      ProviderModeCard.tsx
      RuleVersionCard.tsx
    ui/
      button.tsx
      badge.tsx
      card.tsx
      skeleton.tsx
      dialog.tsx
      tooltip.tsx
      scroll-area.tsx
    ErrorBoundary.tsx
    theme-provider.tsx
  lib/
    api/
      client.ts
      msmes.ts
      scores.ts
      prospects.ts
      copilot.ts
      audit.ts
    schemas/
      msme.ts
      score.ts
      prospect.ts
      copilot.ts
      audit.ts
    formatters.ts
    constants.ts
  hooks/
    useCopilotStream.ts
```

## 8. API design

Use REST for MVP.

Reasons:

- easier to implement with FastAPI
- auto-generated OpenAPI docs
- simpler for Codex and frontend
- enough for dashboard workflow
- lower complexity than GraphQL

API versioning should start as:

```txt
/api/v1
```

MVP may expose unversioned endpoints for speed, but `api/v1` is preferred.

## 9. Agentic AI architecture

```txt
POST /copilot/{msme_id}/brief
        ↓
CreditCopilotOrchestrator
        ↓
Tool: get_msme_profile
Tool: get_financial_health_score
Tool: get_prospect_signals
Tool: get_risk_factors
Tool: get_missing_documents
        ↓
Data Quality Node
        ↓
Credit Analyst Node
        ↓
Prospect Assist Node
        ↓
Risk Investigator Node
        ↓
Lending Brief Node
        ↓
Tool: create_audit_event
        ↓
CopilotBrief response
```

## 10. Agent tool allowlist

Allowed tools only:

- get_msme_profile
- get_financial_health_score
- get_risk_factors
- get_missing_documents
- get_transaction_summary
- get_prospect_signals
- create_audit_event

Unknown tools must fail closed.

## 11. Data flow

### Score generation flow

```txt
MSME id
  ↓
Load profile + financial snapshot + documents
  ↓
Calculate component scores
  ↓
Apply data-confidence penalties
  ↓
Generate reason codes
  ↓
Calculate suggested credit range
  ↓
Generate early warnings
  ↓
Persist ScoreOutput
  ↓
Create audit event
  ↓
Return score response
```

### Copilot brief flow

```txt
MSME id
  ↓
Load profile, score, prospects, risk, documents
  ↓
Assemble grounded context
  ↓
Execute graph nodes
  ↓
Generate brief
  ↓
Persist trace + audit event
  ↓
Return decision-support brief
```

## 12. Deployment architecture

### Budget cloud option

```txt
Vercel
  └── Next.js frontend

Render / Railway / Fly.io
  └── FastAPI backend

Neon / Supabase
  └── PostgreSQL

Upstash Redis optional
  └── cache / rate limits / background job queue
```

### Local demo option

```txt
docker compose up --build
  ├── web
  ├── api
  ├── postgres
  └── redis optional
```

## 13. Observability

Minimum:

- structured logs
- request ID
- audit events
- health endpoint
- readiness endpoint
- provider mode visible
- Copilot trace visible

Later:

- Sentry
- OpenTelemetry
- background job dashboard
- model drift metrics

## 14. Known technical debt risks

| Risk | Mitigation |
|---|---|
| Rule-based score too simplistic | Document rule version and upgrade path to ML |
| Synthetic data looks fake | Create segment-specific scenarios and realistic ranges |
| Agent output feels generic | Ground it with score factors and profile data |
| UI becomes generic dashboard | Use credit cockpit wording and high-density panels |
| API grows inconsistent | Keep Pydantic schemas and API contracts updated |
| Missing auth in MVP | Demo auth now, pluggable auth later |
| Audit not persisted early | Use DB-backed audit before final demo |
| Provider lock-in | Use provider adapter pattern |
