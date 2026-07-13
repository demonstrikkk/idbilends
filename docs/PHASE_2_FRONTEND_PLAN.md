# Phase 2 Frontend Plan — HISTORICAL (completed)

## Objective

Build the bank-grade credit cockpit that consumes backend outputs without reimplementing credit logic in the browser.

## Phase boundaries

Do:

- Next.js app shell
- dashboard and MSME detail workflow
- typed API client
- Zod validation at the network boundary
- score, prospect, risk, and governance presentation

Do not do:

- score calculation in frontend
- Copilot provider logic
- fake final approval UX
- unsupported standalone pages without API backing

## Screen plan

### 1. Landing / entry

Purpose:

- frame the product quickly
- route user to dashboard
- show decision-support disclaimer

### 2. Dashboard

Backed by:

- `GET /msmes`

Show:

- total MSMEs
- average health score
- high-priority prospects
- review-required accounts
- low-confidence accounts
- risk distribution
- ranked prospects
- early-warning shortlist

### 3. MSME list

Backed by:

- `GET /msmes`

Show:

- business identity
- segment and location
- score and risk tier
- prospect score and priority
- confidence
- requested amount
- recommended human action

### 4. MSME detail

Backed by:

- `GET /msmes/{id}`
- `POST /scores/{id}/generate`
- `GET /prospects/{id}/signals`
- `GET /audit/{id}`
- later `POST /copilot/{id}/brief`

Sections:

- overview
- financial health
- prospect readiness
- risk intelligence
- Credit Copilot placeholder until Phase 3
- audit and governance

## Component plan

Build reusable components for:

- `ScoreGauge`
- `RiskTierBadge`
- `DataConfidenceBar`
- `SuggestedLimitCard`
- `ReasonFactorCard`
- `MissingDataPanel`
- `ProspectPriorityCard`
- `NextBestActionCard`
- `EarlyWarningPanel`
- `RiskDistributionChart`
- `ProspectRankingTable`
- `AuditTimeline`

## Data rules

Frontend may:

- format INR values
- sort/filter already returned list data
- map enums to labels and colors
- trigger refresh/generation actions

Frontend must not:

- calculate score
- infer risk tier from raw financials
- compute suggested credit range
- create AI brief text locally

## Visual direction

Use:

- controlled banking palette
- compact cards
- dense but readable tables
- restrained risk color use
- minimal motion

Avoid:

- celebratory approval states
- consumer lending language
- chatbot-first layout
- generic SaaS gradients

## API client plan

Create:

- central fetch client
- endpoint wrappers
- Zod parsers for critical responses
- typed query keys
- shared empty/error/loading states

Contract assumptions to preserve:

- score trace field is `calculation_trace`
- Copilot output must expose `summary` and `decision_support_only`
- governance page uses `GET /health` and `GET /ready`

## Testing and checks

Run when Phase 2 starts:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

UI verification checklist:

- dashboard readable at 1366px width
- detail page keeps score row above fold
- horizontal overflow handled for tables
- empty/error states use safe language
- every score surface shows disclaimer text

## Exit criteria

Phase 2 is complete when:

- dashboard tells the product story without Copilot
- MSME detail page shows complete deterministic credit narrative
- frontend is fully typed against backend contracts
- no score logic exists in the browser
- UI language remains decision-support only
