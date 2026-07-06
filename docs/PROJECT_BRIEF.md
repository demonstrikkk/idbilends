# LendSignal 360 — Product Brief v2

## 1. Product identity

**Product name:** LendSignal 360  
**Category:** AI-powered MSME credit intelligence cockpit  
**Primary hackathon framing:** Financial Health Score  
**Integrated secondary capability:** Prospect Assist AI  
**Core promise:** Help a bank grow MSME lending safely by connecting prospect discovery, explainable financial health scoring, suggested credit posture, early warning, and controlled AI lending assistance.

## 2. One-line pitch

LendSignal 360 helps a bank identify promising MSME borrowers, evaluate their financial health using alternative and synthetic financial signals, recommend a safe credit posture, and generate explainable AI-assisted lending briefs for human review.

## 3. Stronger judge-facing pitch

Most lending tools answer only one question: “Is this borrower risky?”  
LendSignal 360 answers the full bank workflow:

```txt
Which MSMEs should the bank approach?
Are they financially healthy?
How much credit may be safe to consider?
Why did the system reach that view?
What should the officer verify next?
What should be monitored after disbursement?
```

## 4. Strategic positioning

This is **not** a confused combination of tracks. It is a **Financial Health Score platform** with an upstream **Prospect Readiness layer**.

Use this framing:

> LendSignal 360 is a Financial Health Score solution that adds Prospect Readiness intelligence so banks can identify, prioritize, and underwrite better MSME borrowers in one workflow.

Avoid this framing:

> We combined Track 2 and Track 3.

## 5. Why this should win

Most teams are likely to build one of these:

- basic credit score dashboard
- generic default prediction model
- chatbot for bank queries
- simple loan eligibility calculator
- financial health card with charts only

LendSignal 360 should stand apart because it is:

- workflow-first, not screen-first
- explainable, not black-box
- bank-officer oriented, not consumer-gimmick oriented
- governed and auditable
- agentic-AI enabled without unsafe loan automation
- built for a PoC-style conversation, not only presentation slides

## 6. Target users

### 6.1 Bank credit officer

Needs:

- fast view of borrower health
- reason codes behind score
- suggested credit range
- missing document warnings
- risk triggers
- AI-generated lending brief
- human-review action

Primary screen:

- MSME detail page
- score panel
- risk intelligence panel
- Credit Copilot brief

### 6.2 Relationship manager

Needs:

- prioritized MSME prospects
- likely credit need
- best product fit
- next best outreach action
- quick explanation of why a prospect matters

Primary screen:

- executive dashboard
- MSME prospect table
- prospect readiness tab

### 6.3 Risk / portfolio reviewer

Needs:

- accounts with early warning
- risk tier distribution
- accounts requiring document verification
- suspicious trend explanations
- audit trace

Primary screen:

- dashboard
- governance page
- audit page

### 6.4 Admin / model governance user

Needs:

- score rule version
- prompt version
- agent trace
- audit events
- provider mode
- data confidence logic
- human override history placeholder

Primary screen:

- governance / diagnostics page

## 7. Core product modules

### 7.1 Synthetic MSME data engine

Purpose:

Create realistic demo data without using real customer information.

Segments:

- retail shop
- small manufacturer
- services firm
- trader
- food business
- digital seller
- GeM-like seller

Required scenarios:

- healthy growth
- stable moderate
- seasonal volatility
- high buyer concentration
- missing documents
- cashflow stress
- suspicious revenue spike
- debt overload

### 7.2 Financial Health Score engine

Purpose:

Produce a deterministic, explainable 0–100 score.

Outputs:

- score
- risk tier
- data confidence
- suggested credit range
- requested amount
- recommendation category
- positive factors
- negative factors
- missing-data warnings
- early-warning triggers
- scoring trace
- rule version

### 7.3 Prospect Assist engine

Purpose:

Rank MSMEs by credit readiness and growth opportunity.

Outputs:

- prospect score
- priority
- likely credit need
- product fit
- next best action
- supporting signals

This should not be a shallow “lead score.” It must be credit-readiness prioritization.

### 7.4 Credit decision support

Purpose:

Translate financial health into a human-review credit posture.

Outputs:

- suggested credit range
- requested vs suggested amount comparison
- recommended human action
- reason for moderation
- review conditions

Use terms like:

- recommended for human review
- consider moderated limit
- requires verification
- insufficient confidence
- monitor after disbursement

Avoid final approval language.

### 7.5 Credit Copilot agent

Purpose:

Controlled agentic AI that explains, investigates, summarizes, and creates lending briefs.

It must not calculate or modify the score.

Nodes:

1. Data Quality Node
2. Credit Analyst Node
3. Prospect Assist Node
4. Risk Investigator Node
5. Lending Brief Node

Outputs:

- executive summary
- data quality observations
- credit analyst explanation
- prospect assist recommendation
- risk investigator findings
- follow-up questions
- final lending brief
- assumptions
- confidence
- recommended human action
- cited internal inputs
- trace

### 7.6 Early warning engine

Purpose:

Detect signals that may require monitoring after credit is extended.

Signals:

- revenue decline
- bounce count increase
- delayed GST-like filing
- buyer concentration rise
- EMI burden increase
- invoice delay increase
- suspicious cashflow spike
- order cancellation trend

### 7.7 Governance and audit layer

Purpose:

Make the system bank-reviewable.

Must track:

- score generation
- prospect signal generation
- Copilot brief generation
- provider mode
- prompt version
- rule version
- tool trace
- human override placeholder
- audit event metadata

## 8. MVP scope

The MVP must include:

- seeded synthetic MSME data
- dashboard with ranked MSME prospects
- MSME detail page
- deterministic Financial Health Score
- Prospect Assist output
- suggested credit range
- reason codes
- missing-data warnings
- Credit Copilot mock mode
- audit trace
- governance view
- README and demo script

## 9. Non-MVP scope

Do not build in the first pass:

- real bank API integration
- real Account Aggregator integration
- real GST, PAN, Aadhaar, bureau, or bank-statement ingestion
- payments/billing
- Kubernetes
- complex microservices
- autonomous agent browsing
- final loan approval automation

## 10. Product safety statements

Every relevant UI should include decision-support framing.

Recommended copy:

> LendSignal 360 provides decision-support signals for human review. It does not issue final credit approval.

> Scores are based on available synthetic/demo signals and should be verified against official documents before any real lending decision.

## 11. Demo narrative

### Flagship demo story

A GeM-like seller is growing, has strong order completion, and likely needs working capital. The system ranks it as a high-priority prospect, gives a moderate-low risk score, suggests a moderated credit range, and Credit Copilot generates a grounded lending brief with verification steps.

### Demo sequence

1. Open dashboard.
2. Show ranked MSME prospects.
3. Click flagship MSME.
4. Show score, risk tier, confidence, suggested credit range.
5. Show positive and negative reason codes.
6. Show Prospect Assist next best action.
7. Generate Credit Copilot brief.
8. Open trace/governance panel.

## 12. Success metrics

### Product demo metrics

- Judge understands value within 30 seconds.
- Demo can be completed in under 4 minutes.
- One flagship profile tells a complete story.
- AI output is grounded in internal data.
- Score is explainable.
- Missing data is surfaced honestly.
- Agent trace is visible.

### Engineering metrics

- Backend tests pass.
- Frontend builds.
- Mock AI mode works without API key.
- API contracts are stable.
- No hardcoded secrets.
- No real personal data.

## 13. Exact pitch lines

### 10-second pitch

LendSignal 360 is an AI-powered MSME credit intelligence cockpit that helps banks identify promising borrowers, score financial health, explain risk, and generate human-review lending briefs.

### 30-second pitch

LendSignal 360 connects Prospect Assist and Financial Health Score into one bank workflow. It ranks promising MSME prospects, scores their financial health using alternative signals, recommends a safe credit posture, explains every driver, and uses a controlled Credit Copilot agent to generate lending briefs for human officers.

### Strong final line

> The goal is not to replace credit officers. The goal is to give them faster, explainable, governed intelligence for safer MSME credit growth.
