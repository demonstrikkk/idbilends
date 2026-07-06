# LendSignal 360 - Spec Audit

## Scope

Phase 0 audit covered:

- `AGENTS.md`
- `README.md`
- `docs/CONTEXT_MAP.md`
- `docs/PROJECT_BRIEF.md`
- `docs/ARCHITECTURE.md`
- `docs/API_CONTRACTS.md`
- `docs/DATA_MODEL.md`
- `docs/SCORING_DESIGN.md`
- `docs/AGENTIC_AI_DESIGN.md`
- `docs/SECURITY_CHECKLIST.md`
- `docs/ROADMAP.md`
- `docs/UI_UX_SPEC.md`
- `docs/DEMO_STRATEGY.md`
- `prompts/00_MASTER_CODEX_PROMPT.md`
- `prompts/01_PHASE_0_PLANNING.md`

## Audit outcome

Overall status: mostly aligned after targeted Phase 0 corrections.

The repository already had the right product thesis:

- bank-grade MSME credit intelligence cockpit
- deterministic Financial Health Score as numerical source of truth
- Prospect Assist as upstream prioritization
- Credit Copilot as controlled explanation and investigation layer
- decision-support only, never final approval

## Alignment checks

### PROJECT_BRIEF vs ROADMAP

Status: aligned after fixes.

Confirmed:

- product framing stays "Financial Health Score + Prospect Readiness"
- backend, frontend, Copilot, hardening, and demo phases remain sequenced correctly
- roadmap preserves controlled AI and no autonomous approval

Fixed:

- `ROADMAP.md` used `PRODUCT_BRIEF`; repo uses `PROJECT_BRIEF`
- Phase 5 said `5-7` profiles while product/data docs require at least `8`

### API_CONTRACTS vs DATA_MODEL

Status: aligned after fixes.

Confirmed:

- core entities match: MSME profile, score output, prospect output, Copilot brief, audit
- API remains REST-first and frontend-safe

Fixed:

- `ScoreOutput` model was missing `recommended_human_action`
- `ScoreOutput` model was missing `decision_support_only`
- `ProspectSignalOutput` model was missing `outreach_timing`
- `CopilotBrief` model was missing required `summary`
- `AgentTraceStep.step_type` used `node` while contracts/design use `agent_node`

### SCORING_DESIGN vs API_CONTRACTS

Status: aligned after minor contract clarification.

Confirmed:

- score is deterministic and explainable
- backend returns score, tier, confidence, warnings, factors, early warnings, credit range, and trace
- recommendation language remains non-final

Fixed:

- frontend contract note incorrectly called score trace `trace`; canonical field is `calculation_trace`

### AGENTIC_AI_DESIGN vs SECURITY_CHECKLIST

Status: aligned after schema clarification.

Confirmed:

- allowlisted tools only
- no web browsing
- no score mutation
- no final approval/rejection authority
- audit, confidence, assumptions, and citations required

Fixed:

- added required `summary` field to Copilot schema and output expectations so docs match `AGENTS.md`

### UI_UX_SPEC vs available API endpoints

Status: aligned after MVP navigation correction.

Confirmed:

- dashboard and detail page can be powered by existing endpoints
- governance page can use health/readiness plus MSME-scoped audit data

Fixed:

- removed implication that Risk Intelligence and Credit Copilot require standalone top-level MVP pages
- added explicit API-to-screen mapping for detail and governance views

## Safety checks

### Credit Copilot never calculates or overrides score

Pass.

Evidence:

- `AGENTS.md`
- `docs/PROJECT_BRIEF.md`
- `docs/ARCHITECTURE.md`
- `docs/SCORING_DESIGN.md`
- `docs/AGENTIC_AI_DESIGN.md`
- `docs/SECURITY_CHECKLIST.md`

### Frontend never calculates score

Pass.

Evidence:

- `docs/ARCHITECTURE.md`
- `docs/API_CONTRACTS.md`
- `docs/UI_UX_SPEC.md`
- `prompts/03_PHASE_2_FRONTEND.md`

### No final loan approval language as product behavior

Pass with one note.

Operational docs consistently use:

- decision-support only
- suggested credit range
- recommended human action
- review required
- requires verification

Some prompt files still mention forbidden phrases only as negative examples to avoid. That is acceptable because they are guardrails, not product copy.

## Direct fixes applied in Phase 0

- standardized `PROJECT_BRIEF` references where docs/prompts pointed to non-existent `PRODUCT_SPEC` or `PRODUCT_BRIEF`
- standardized prompt file self-references to actual filenames
- aligned roadmap profile counts with seed-data expectations
- aligned score, prospect, trace, and Copilot fields across contracts and data model
- aligned UI navigation with currently defined API surface
- aligned Copilot schema with `AGENTS.md` requirement for `summary`

## Remaining risks

### Score and prospect generation lifecycle

The docs define `GET /msmes` and `GET /msmes/{id}` responses that already expose latest score/prospect ids and list metrics, but they do not fully specify whether seed data precomputes those outputs or whether first-load generation is lazy. Phase 1 should choose one policy and document it in route behavior.

### Transaction summary contract

`get_transaction_summary` is allowlisted for Copilot, but no public REST contract exists yet for a reusable transaction-summary payload shape. Phase 1 can keep it internal, but the internal schema should be defined when the service layer is built.

### Audit retrieval scope

Current API defines `GET /audit/{msme_id}` only. That supports MSME-scoped audit trails, but not a portfolio-wide governance timeline. If a global governance page is desired later, add a separate list endpoint rather than overloading the current route.

### Prompt file drift

Phase prompts outside the mandatory Phase 0 set may still contain legacy references. They should be normalized before implementation work starts to reduce prompt confusion during later phases.

## Phase 0 exit recommendation

Proceed to Phase 1 only after treating these docs as the implementation source of truth:

- `docs/PROJECT_BRIEF.md`
- `docs/ARCHITECTURE.md`
- `docs/API_CONTRACTS.md`
- `docs/DATA_MODEL.md`
- `docs/SCORING_DESIGN.md`
- `docs/AGENTIC_AI_DESIGN.md`
- `docs/SECURITY_CHECKLIST.md`
