# AGENTS.md

## Project

LendSignal 360 is an AI-powered MSME credit intelligence platform for a banking hackathon context. It combines Financial Health Score, Prospect Assist AI, explainable credit decisioning, and controlled agentic AI.

The product must feel like a bank-grade decision-support system, not a generic loan chatbot or basic scorecard.

## Core product thesis

LendSignal 360 helps a bank discover high-potential MSME borrowers, assess their financial health using alternative/synthetic financial signals, recommend safe credit actions, explain the reasoning, and monitor early risk indicators after disbursement.

## Non-negotiable safety principle

The application is decision-support software. It must never claim to provide final automated loan approval.

The deterministic score/risk engine is the source of truth for numerical scoring. The LLM/agentic layer must explain, summarize, investigate, and guide. It must not invent financial metrics, modify score outputs, or independently approve/reject loans.

## Preferred stack

Frontend:
- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zod
- Recharts

Backend:
- FastAPI
- Python
- Pydantic
- SQLAlchemy or SQLModel
- Alembic
- PostgreSQL
- Redis optional for async jobs

Agentic AI:
- LangGraph-style workflow or a clean internal graph abstraction initially
- GROQ LLM provider by default
- OpenAI-compatible provider behind environment variables
- Tool-calling only through an allowlisted backend service layer
- Agent trace logging required

Infra:
- Docker Compose for local development
- GitHub Actions for CI
- `.env.example` required
- Health and readiness endpoints required

## Repository layout

```txt
apps/
  web/
  api/
  worker/
packages/
  shared/
  ui/
  config/
docs/
prompts/
infra/
datasets/
tests/
```

## Required product modules

1. MSME Financial Health Score
   - Profile, revenue, expense, cashflow, liabilities, repayment behavior, invoice/payment behavior, GST-like synthetic signals, bank-statement-like synthetic signals.
   - Output: score, risk tier, confidence, positive factors, negative factors, missing-data warnings, suggested improvements.

2. Prospect Assist AI
   - Prioritize MSME prospects.
   - Identify likely credit need.
   - Recommend product fit and next best action.
   - Flag missing data and suspicious inconsistencies.

3. Credit Copilot Agent
   - Controlled agentic workflow.
   - Explains score factors.
   - Generates bank-officer lending brief.
   - Investigates anomalies.
   - Produces follow-up questions.
   - Shows agent trace.

4. Demo Data Engine
   - Synthetic MSME profiles only.
   - Include segments: retail shop, small manufacturer, service firm, trader, food business, digital/GeM-like seller.
   - Include healthy, moderate, risky, and suspicious examples.
   - No real personal or financial data.

5. Dashboard UI
   - MSME list
   - MSME profile page
   - Financial Health Score card
   - Risk breakdown
   - Prospect readiness panel
   - AI lending brief
   - Agent trace/dev diagnostics page

6. Governance layer
   - Model/rule version
   - Audit events
   - Human override placeholder
   - Data-confidence score
   - Responsible AI disclaimer
   - Prompt/version trace for AI outputs

## Agentic AI requirements

The controlled AI layer is called Credit Copilot.

Required graph nodes:
1. Data Quality Node
2. Credit Analyst Node
3. Prospect Assist Node
4. Risk Investigator Node
5. Lending Brief Node

Required backend tools:
- get_msme_profile
- get_financial_health_score
- get_risk_factors
- get_missing_documents
- get_transaction_summary
- get_prospect_signals
- create_audit_event

All agent outputs must include:
- summary
- confidence
- assumptions
- recommended_human_action
- cited_internal_inputs

The agentic layer may:
- summarize MSME profiles
- explain score factors
- generate lending briefs
- recommend next best actions
- identify missing documents
- ask follow-up questions
- investigate risk anomalies

The agentic layer must not:
- approve or reject loans as final authority
- invent financial metrics
- alter deterministic scores
- call non-allowlisted tools
- use external APIs unless configured
- hide low confidence or missing data

## Engineering rules

- Keep scoring logic independent from API routes.
- Keep AI provider logic behind adapters.
- Keep prompts versioned.
- Keep UI typed end-to-end.
- Use Zod/Pydantic validation at boundaries.
- Avoid premature microservices.
- Avoid Kubernetes for the MVP.
- Avoid untyped JavaScript.
- Avoid TODO-only files.
- Do not hardcode secrets.
- Do not commit real customer data.

## Minimum local commands

Backend:
```bash
cd apps/api
python -m venv .venv
pip install -r requirements.txt
pytest
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

Full stack:
```bash
docker compose up --build
```

## Testing expectations

Add tests for:
- scoring logic
- risk-tier mapping
- missing-data behavior
- synthetic data generation
- main API endpoints
- mock AI provider
- prompt payload formation

Before completing a task, run relevant tests. If any command fails because dependencies are missing or the environment is limited, state that clearly and propose the exact fix.

## Final response expectation for Codex

When done, report:
- files changed
- commands run
- tests passed/failed
- known limitations
- next recommended task
