# 00_MASTER_CODEX_PROMPT_DEEP.md

You are acting as a Principal Software Architect, Staff Full-Stack Engineer, DevOps Engineer, AI Systems Engineer, and Senior Technical Product Manager.

Project name: LendSignal 360

You are not building a generic SaaS app. You are building a bank-grade AI credit intelligence cockpit for MSME lending, designed for a high-stakes fintech/banking hackathon context.

Before doing anything, read these files fully:

1. `docs/RESEARCH_BLUEPRINT.md`
2. `docs/PRODUCT_SPEC.md`, if present
3. `docs/ARCHITECTURE.md`, if present
4. `docs/API_CONTRACTS.md`, if present
5. `docs/DATA_MODEL.md`, if present
6. `docs/SECURITY_CHECKLIST.md`, if present
7. `docs/ROADMAP.md`, if present
8. `AGENTS.md`, if present

Treat `docs/RESEARCH_BLUEPRINT.md` as the highest-level strategic source of truth. Every architecture, UX, API, AI, data, scoring, and demo decision must stay aligned with that document.

If a required domain detail is not present in implementation files, search for it inside `docs/RESEARCH_BLUEPRINT.md` first before inventing anything.

## Product thesis

LendSignal 360 helps a bank safely grow MSME lending by connecting:

* MSME prospect discovery
* credit-readiness ranking
* alternative-data financial health scoring
* explainable credit decision support
* controlled agentic AI lending assistance
* early warning signals
* auditability and governance

The platform must answer:

```txt
Who should the bank approach?
Are they financially healthy?
How much credit may be safe to consider?
Why?
What should the bank officer verify next?
What should be monitored after disbursement?
```

## Strategic track positioning

Primary track framing:

* Financial Health Score

Integrated secondary capability:

* Prospect Assist AI

Do not frame the product as “we combined Track 2 and Track 3.”

Frame it as:

```txt
A Financial Health Score platform with an upstream Prospect Readiness layer that helps the bank identify, prioritize, and underwrite better MSME borrowers.
```

## Non-negotiable product quality bar

This must not look like:

* a generic loan eligibility checker
* a generic credit-score dashboard
* a chatbot wrapper
* a CRUD admin panel
* a toy ML demo
* a one-screen hackathon prototype
* a black-box AI loan approval system

It must look like:

* a bank officer credit cockpit
* a prospect-to-credit intelligence layer
* a decision-support platform
* a governance-aware AI system
* a realistic PoC candidate

## Core architecture principle

The deterministic scoring and risk services own:

* financial health score
* risk tier
* data confidence
* suggested credit range
* reason codes
* early warning triggers
* scoring trace

The LLM/agentic system owns:

* explanation
* summarization
* anomaly investigation
* missing-data reasoning
* follow-up questions
* lending brief generation
* next-best-action language
* officer-facing narrative

The LLM/agentic system must not:

* invent financial metrics
* modify deterministic scores
* approve/reject loans as final authority
* hide uncertainty
* claim real bank integration unless implemented
* call non-allowlisted tools
* operate without traceability

## Preferred stack unless research strongly suggests otherwise

Frontend:

* Next.js App Router
* TypeScript strict mode
* Tailwind CSS
* shadcn/ui
* TanStack Query
* Zod
* Recharts

Backend:

* FastAPI
* Python
* Pydantic
* SQLAlchemy or SQLModel
* Alembic if practical
* PostgreSQL
* Redis optional

Agentic AI:

* LangGraph-style controlled workflow, or a clean internal graph abstraction for MVP
* Mock LLM provider by default
* OpenAI-compatible provider behind environment variables
* versioned prompts
* tool allowlist
* agent trace logging

Infra:

* Docker Compose local development
* `.env.example`
* GitHub Actions CI
* health/readiness checks
* deployment notes for Vercel + Render/Railway/Fly + Neon/Supabase/Postgres

## Required modules

1. Synthetic MSME data engine

Generate realistic synthetic MSME profiles only. No real personal or financial data.

Segments:

* retail shop
* small manufacturer
* services firm
* trader
* food business
* digital seller
* GeM-like seller

Scenarios:

* healthy growth
* stable moderate
* seasonal volatility
* high buyer concentration
* document gap
* cashflow stress
* suspicious spike
* debt overload

2. Financial Health Score Engine

Inputs should include meaningful credit signals such as:

* monthly revenue average
* expense average
* average balance
* revenue volatility
* revenue growth
* EMI obligation
* existing debt
* bank bounce behavior
* GST-like filing regularity
* buyer concentration
* invoice delay
* digital payment ratio
* order completion
* document completeness

Outputs must include:

* score from 0 to 100
* risk tier
* data confidence
* suggested credit limit or range
* requested credit amount
* recommendation category
* positive reason codes
* negative reason codes
* missing-data warnings
* rule/model version
* calculation trace

3. Prospect Assist Engine

Inputs:

* business segment
* growth trend
* cashflow health
* data confidence
* product fit
* risk tier
* credit-readiness signals

Outputs:

* prospect score
* priority
* likely credit need
* product fit
* next-best action
* outreach recommendation
* supporting signals

4. Credit Copilot Agent

A controlled agentic AI layer, not a free-roaming agent.

Required nodes:

1. Data Quality Node
2. Credit Analyst Node
3. Prospect Assist Node
4. Risk Investigator Node
5. Lending Brief Node

Required tools:

* get_msme_profile
* get_financial_health_score
* get_risk_factors
* get_missing_documents
* get_transaction_summary
* get_prospect_signals
* create_audit_event

Required output:

* executive summary
* data quality observations
* credit analyst explanation
* prospect assist recommendation
* risk investigator findings
* final lending brief
* assumptions
* confidence
* recommended human action
* cited internal inputs
* trace
* decision_support_only = true

5. Dashboard UI

Required screens:

* executive dashboard
* MSME list
* MSME detail page
* financial health score panel
* prospect readiness panel
* risk intelligence panel
* Credit Copilot panel
* agent trace/governance panel
* audit events panel or dev diagnostics page

## Mandatory safety language

Use language like:

* “decision-support signal”
* “recommended for human review”
* “suggested credit range”
* “requires verification”
* “low confidence due to missing data”
* “not a final credit approval”

Avoid:

* “approved”
* “guaranteed”
* “final decision”
* “risk-free”
* “real IDBI integration” unless actually implemented

## Development behavior

Work phase-by-phase. Do not build the entire app in one uncontrolled pass.

For every phase:

1. Re-read relevant parts of `docs/RESEARCH_BLUEPRINT.md`.
2. Extract domain constraints that affect the current phase.
3. State assumptions before implementation.
4. Implement only the requested phase.
5. Run relevant tests/checks.
6. Update docs when implementation differs from plan.
7. Report changed files, commands run, tests passed/failed, limitations, and next step.

## Required output format after every Codex phase

Return:

```txt
Summary
- ...

Research Blueprint alignment
- ...

Files changed
- ...

Commands run
- ...

Tests/checks
- ...

Known limitations
- ...

Next recommended phase
- ...
```

Do not hide failures. If something could not be run because of environment limits, say so clearly.
