# 01_PHASE_0_PLANNING.md

You are implementing Phase 0: Research-to-Spec Conversion.

Do not build the application yet.

Your job is to convert the research and strategy into precise engineering documents that prevent generic implementation later.

## First steps

Read:

1. `docs/RESEARCH_BLUEPRINT.md`
2. `prompts/00_MASTER_CODEX_PROMPT.md`
3. `AGENTS.md`, if present
4. Existing docs, if present

Search inside `docs/RESEARCH_BLUEPRINT.md` for anything related to:

* IDBI Innovate
* MSME lending
* Financial Health Score
* Prospect Assist AI
* alternative data
* Account Aggregator
* GST-like signals
* GeM-like seller signals
* credit decisioning
* default risk
* explainability
* agentic AI
* governance
* audit
* compliance
* demo strategy
* free/open-source stack
* deployment constraints

Extract only what is useful for building this project. Do not copy huge research passages. Convert research into implementation decisions.

## Deliverables

Create or rewrite these files:

```txt
docs/PROJECT_BRIEF.md
docs/ARCHITECTURE.md
docs/API_CONTRACTS.md
docs/DATA_MODEL.md
docs/SCORING_DESIGN.md
docs/AGENTIC_AI_DESIGN.md
docs/UI_UX_SPEC.md
docs/SECURITY_CHECKLIST.md
docs/ROADMAP.md
docs/DEMO_STRATEGY.md
```

## Required depth for each file

### `docs/PROJECT_BRIEF.md`

Must include:

* product name
* one-line pitch
* primary track framing
* secondary Prospect Assist integration framing
* anti-generic positioning
* user personas
* core workflows
* MVP scope
* non-MVP scope
* demo success criteria
* exact wording to use in the pitch
* exact wording to avoid

It must make clear:

```txt
This is a Financial Health Score product with a Prospect Readiness layer, not a confused multi-track product.
```

### `docs/ARCHITECTURE.md`

Must include:

* high-level architecture diagram in text
* frontend stack
* backend stack
* database choice
* caching/queue choice
* AI provider abstraction
* agentic workflow architecture
* security boundaries
* source-of-truth rules
* why REST is preferred for MVP
* when pgvector/search could be added
* known technical debt risks

Must include folder structure for:

```txt
apps/web
apps/api
apps/worker
packages/shared
infra
datasets
```

### `docs/API_CONTRACTS.md`

Must define REST endpoints with request/response examples for:

```txt
GET /health
GET /msmes
GET /msmes/{id}
POST /scores/{id}/generate
GET /prospects/{id}/signals
POST /copilot/{id}/brief
GET /audit/{id}
POST /demo/seed
```

Every response must be realistic and typed.

### `docs/DATA_MODEL.md`

Must define:

* MSMEProfile
* FinancialSnapshot
* DocumentStatus
* ScoreOutput
* ScoreFactor
* ProspectSignalOutput
* CopilotBrief
* AgentTraceStep
* AuditEvent

For each field include:

* name
* type
* purpose
* example

### `docs/SCORING_DESIGN.md`

This must be highly detailed.

Define:

* score range
* risk tier mapping
* data-confidence logic
* suggested credit limit logic
* positive factor generation
* negative factor generation
* missing-data penalty logic
* early warning triggers
* suspicious pattern detection
* scoring trace format
* tests needed

The scoring design must be deterministic and explainable.

Do not use vague lines like “use ML model here.”
For MVP, define a rule-based or hybrid rule-weighted scoring engine that can later be replaced by ML.

### `docs/AGENTIC_AI_DESIGN.md`

Must define:

* Credit Copilot purpose
* why AI does not decide the score
* graph nodes
* tool allowlist
* prompt versions
* provider abstraction
* mock provider behavior
* OpenAI-compatible provider behavior
* trace format
* safety guardrails
* output schema
* failure modes
* tests required

Make it explicit:

```txt
Credit Copilot explains and investigates; it does not approve loans.
```

### `docs/UI_UX_SPEC.md`

Must define:

* visual identity
* dashboard layout
* MSME list layout
* MSME detail layout
* score card design
* risk panel design
* prospect panel design
* copilot panel design
* trace panel design
* empty/loading/error states
* responsive behavior
* copy tone

The UI must feel like a serious bank-grade credit cockpit, not a colorful startup template.

### `docs/SECURITY_CHECKLIST.md`

Must include:

* secrets
* CORS
* auth strategy
* input validation
* output sanitization
* AI safety
* audit logs
* synthetic data only
* security headers
* DB indexes
* deployment flags
* environment variables

### `docs/ROADMAP.md`

Must split the work into:

1. Phase 1: backend credit engine
2. Phase 2: frontend credit cockpit
3. Phase 3: Credit Copilot agent
4. Phase 4: production hardening
5. Phase 5: demo polish

Each phase must include:

* scope
* files likely to change
* acceptance criteria
* tests to run
* what not to do

### `docs/DEMO_STRATEGY.md`

Must include:

* 4-minute demo narrative
* flagship synthetic MSME story
* judge-facing talking points
* strongest differentiators
* failure-proof demo path
* fallback if AI provider is unavailable
* exact product line to say

## Constraints

Do not write generic docs.

Every document must reflect:

* MSME lending
* Financial Health Score
* Prospect Assist intelligence
* controlled agentic AI
* explainability
* auditability
* hackathon-winning differentiation

## Acceptance criteria

Phase 0 is complete only when:

* all listed docs exist
* scoring design is implementable without guessing
* agent design is implementable without guessing
* API contracts are specific enough for frontend/backend parallel work
* UI spec is specific enough to avoid generic dashboard design
* roadmap gives exact next implementation tasks

After finishing, report:

```txt
Summary
Research Blueprint alignment
Files changed
Commands run
Tests/checks
Known limitations
Next recommended phase
```

