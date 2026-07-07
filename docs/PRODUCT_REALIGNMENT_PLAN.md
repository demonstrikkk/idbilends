# Product Realignment Plan

Phase 3.7 reframes LendSignal 360 as an MSME Credit File Workbench instead of a generic dashboard.

## Workflow

1. Case Inbox groups backend MSME cases by readiness, evidence gaps, risk attention, high potential, and low confidence.
2. Credit File opens a three-zone workbench for one MSME: evidence navigation, underwriting details, and a right-side decision-support inspector.
3. Data Room organizes borrower records and verification status from backend credit-file evidence fields.
4. Evidence Map shows Source Data -> Derived Signal -> Score Component -> Lending Question -> Human Action.
5. Credit Copilot answers case-aware questions and generates briefs from sanitized backend context only.
6. Portfolio Signals and Governance remain secondary operating views.

## Product Boundaries

- Deterministic score output remains the source of truth for score, risk tier, data confidence, suggested range, and recommendation.
- Credit Copilot explains, summarizes, investigates, and recommends human actions.
- Credit Copilot does not alter score outputs or make final credit decisions.
- Frontend static content is limited to labels, navigation, prompt suggestions, and empty-state copy.

## Implementation Decisions

- Added backend aggregation endpoints for `/case-inbox`, `/credit-file/{msme_id}`, and `/credit-file/{msme_id}/evidence-map`.
- Added `/copilot/{msme_id}/chat` as a controlled Q&A wrapper around the existing Copilot graph.
- Reused existing deterministic scoring, Prospect Assist, transaction summary, audit, and provider services.
- Rebuilt primary frontend navigation around Case Inbox, Credit File, Data Room, Evidence Map, Credit Copilot, Portfolio Signals, and Governance.
- 21st.dev tooling was discovered, but the component inspiration call failed at the MCP response layer, so equivalent React/Tailwind components were implemented manually.

## Not In Scope

- Phase 4 production hardening.
- Real AA, GST, Udyam, GeM, ULI, or bank integrations.
- New fake frontend data.
- Changes to deterministic scoring rules.
