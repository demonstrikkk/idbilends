# 03_PHASE_2_FRONTEND.md

You are implementing Phase 2: Frontend Credit Cockpit.

Do not rebuild backend architecture.
Do not implement the full AI agent yet.
Build a polished, bank-grade frontend that consumes the backend from Phase 1.

## First steps

Read:

1. `docs/RESEARCH_BLUEPRINT.md`
2. `docs/PROJECT_BRIEF.md`
3. `docs/UI_UX_SPEC.md`
4. `docs/API_CONTRACTS.md`
5. `docs/SCORING_DESIGN.md`
6. `docs/DEMO_STRATEGY.md`

Search inside `docs/RESEARCH_BLUEPRINT.md` and `docs/UI_UX_SPEC.md` for:

* bank-grade UI
* credit cockpit
* MSME financial health score
* prospect readiness
* risk intelligence
* explainability
* reason codes
* lending brief
* auditability
* demo flow

Use this to avoid a generic admin dashboard.

## Stack

Use:

* Next.js App Router
* TypeScript strict mode
* Tailwind CSS
* shadcn/ui or equivalent local component pattern
* TanStack Query
* Zod for validating important API responses
* Recharts for visualizations

## Required frontend structure

Create:

```txt
apps/web/
  src/
    app/
      page.tsx
      dashboard/
        page.tsx
      msmes/
        page.tsx
        [id]/
          page.tsx
      governance/
        page.tsx
    components/
      layout/
      dashboard/
      msme/
      score/
      prospect/
      risk/
      copilot/
      governance/
      ui/
    lib/
      api/
        client.ts
        msmes.ts
        scores.ts
        prospects.ts
      schemas/
        msme.ts
        score.ts
        prospect.ts
      utils.ts
    hooks/
```

## Visual direction

The interface must feel like:

```txt
enterprise banking cockpit + modern AI intelligence layer
```

Not:

```txt
generic gradient SaaS landing page
```

Design language:

* dark or light professional theme
* calm contrast
* precise spacing
* strong card hierarchy
* risk badges
* score rings/bars
* tables with high information density
* minimal motion
* no childish icons
* no noisy gradients
* no fake celebratory UI

## Required pages

### 1. Landing / demo entry page

Purpose:

* explain the product in one screen
* route to dashboard
* communicate decision-support framing

Must include:

* product sentence
* “Financial Health Score + Prospect Readiness + Credit Copilot”
* “decision-support only” disclaimer
* CTA to dashboard

### 2. Executive dashboard

Must show:

* total MSMEs
* average health score
* high-priority prospects
* review-required accounts
* risk distribution chart
* ranked MSME prospect table
* top early-warning accounts
* quick filters by risk/prospect priority

### 3. MSME list

Must show:

* business name
* segment
* city
* health score
* risk tier
* prospect score
* data confidence
* requested amount
* suggested action
* link to detail

### 4. MSME detail

This is the most important demo page.

Must show:

* business identity card
* requested credit amount
* suggested credit limit/range
* financial health score
* risk tier
* data confidence
* recommendation category
* positive factors
* negative factors
* missing-data warnings
* early-warning triggers
* prospect readiness panel
* product fit
* next best action

### 5. Risk intelligence section

Must show:

* cashflow stress
* buyer concentration
* bounce behavior
* GST-like regularity
* document gaps
* suspicious patterns
* early-warning triggers

### 6. Governance / diagnostics page

Must show:

* rule version
* mock/provider mode placeholder
* latest audit events if available
* API health status
* decision-support disclaimer
* future agent trace placeholder

## Components to build

Create clean reusable components:

```txt
ScoreGauge
RiskTierBadge
DataConfidenceBar
ReasonFactorCard
SuggestedLimitCard
ProspectPriorityCard
NextBestActionCard
MissingDataPanel
EarlyWarningPanel
MSMETable
PortfolioSummaryCards
RiskDistributionChart
```

## API integration

Use the backend endpoints from Phase 1.

Frontend must not calculate score itself.

Frontend should call:

```txt
GET /msmes
GET /msmes/{id}
POST /scores/{id}/generate
GET /prospects/{id}/signals
GET /audit/{id}
```

Use typed API client functions.

Handle:

* loading states
* empty states
* API errors
* backend unavailable fallback only if clearly labelled as demo fallback

## Copy quality

Use serious banking language.

Good:

* “Suggested credit range”
* “Requires document verification”
* “Moderate-low risk”
* “Top negative drivers”
* “Recommended human action”
* “Decision-support signal”

Bad:

* “Congrats, loan approved!”
* “AI says yes”
* “Guaranteed safe”
* “Magic score”

## Responsive behavior

Must work on laptop screens.

Priority:

* dashboard readable at 1366px width
* detail page not cramped
* table scroll handled cleanly
* cards stack on mobile

## Do not do

* Do not add fake AI brief yet unless only placeholder.
* Do not put business scoring logic in frontend.
* Do not hardcode one static MSME as the whole app.
* Do not over-design with heavy animations.
* Do not use generic lorem ipsum.

## Tests/checks

Add or run:

```bash
npm run lint
npm run typecheck
npm run build
```

If the project does not yet have scripts, add them.

## Acceptance criteria

Phase 2 is complete only when:

* frontend runs
* dashboard loads real backend data
* MSME detail page tells a complete credit story
* score/risk/prospect panels are visually strong
* UI is not generic
* loading/error states exist
* build/typecheck/lint are run or clearly reported

Final report format:

```txt
Summary
Research Blueprint alignment
Files changed
Commands run
Tests/checks
Known limitations
Next recommended phase
```
