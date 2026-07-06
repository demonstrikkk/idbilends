# LendSignal 360 — UI/UX Spec

## 1. Design goal

The UI must feel like a serious credit intelligence cockpit for bank officers.

It should not feel like:

- generic startup SaaS
- loan calculator
- colorful student dashboard
- chatbot-first app
- animated fintech landing page

It should feel like:

- controlled
- precise
- explainable
- data-rich
- bank-grade
- calm under risk

## 2. Visual language

Recommended tone:

- deep navy / graphite / warm white
- subtle borders
- high readability
- risk colors used sparingly
- compact cards
- strong table hierarchy
- minimal animation
- professional typography

Avoid:

- neon gradients
- childish icons
- emoji-heavy UI
- random glassmorphism
- excessive motion
- vague “AI magic” copy

## 3. Navigation

Primary nav:

- Dashboard
- MSMEs
- Risk Intelligence
- Credit Copilot
- Governance

## 4. Dashboard

Purpose:

Give a portfolio/prospect overview.

Sections:

1. Summary cards
   - Total MSMEs
   - Avg health score
   - High-priority prospects
   - Review-required accounts
   - Low-confidence accounts

2. Risk distribution
   - bar chart or donut chart
   - grouped by risk tier

3. Ranked prospects table
   - business
   - segment
   - city
   - health score
   - prospect score
   - risk tier
   - confidence
   - suggested action

4. Early warning list
   - top 5 accounts needing review

## 5. MSME detail page

This is the main demo screen.

Layout:

```txt
Header: Business name, segment, city, requested credit
  ↓
Score row:
  - Health score
  - Risk tier
  - Data confidence
  - Suggested credit range
  ↓
Tabs/sections:
  - Overview
  - Financial Health
  - Prospect Readiness
  - Risk Intelligence
  - Credit Copilot
  - Audit/Governance
```

## 6. Score panel

Must show:

- score gauge
- risk tier badge
- confidence bar
- suggested credit min/max
- requested amount
- recommendation category
- decision-support disclaimer

Copy examples:

- “Suggested credit range”
- “Recommended for human review”
- “Requires document verification”
- “Moderate-low risk”

## 7. Reason factor cards

Each factor should show:

- label
- positive/negative direction
- impact points
- evidence
- source fields
- severity

## 8. Prospect panel

Must show:

- prospect score
- priority
- likely credit need
- product fit
- next best action
- supporting signals

The panel must make Track 2 visible without confusing the product framing.

## 9. Risk intelligence panel

Must show:

- early warning triggers
- suspicious patterns
- missing data
- buyer concentration
- bounce behavior
- revenue volatility
- debt stress

## 10. Credit Copilot panel

Must show:

- Generate brief button
- executive summary
- final lending brief
- follow-up questions
- assumptions
- recommended human action
- confidence badge
- decision-support disclaimer
- trace accordion

## 11. Governance page

Must show:

- score rule version
- prompt version
- AI provider mode
- latest audit events
- agent traces
- health/readiness status

## 12. Empty/loading/error states

### Loading

Use skeleton cards and table rows.

### Empty

Use action-oriented text:

> No MSME profiles found. Seed demo data to start the credit intelligence walkthrough.

### Error

Use safe language:

> Unable to load scoring output. The deterministic score service may be unavailable. Retry or check backend health.

## 13. Responsive behavior

Priority:

- great at 1366×768 laptop
- usable on mobile
- tables scroll horizontally
- cards stack cleanly
- score remains visible above fold

## 14. Demo copy

Strong line:

> From prospect discovery to explainable lending brief — one controlled workflow for safer MSME credit growth.

Disclaimer:

> Decision-support only. Not a final credit approval.
