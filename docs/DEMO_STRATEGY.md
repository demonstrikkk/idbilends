# LendSignal 360 — Demo Strategy

## 1. Demo goal

In under 4 minutes, show that this is not a generic AI dashboard. It is a bank-grade AI credit intelligence workflow.

## 2. Demo thesis

LendSignal 360 helps banks grow MSME lending safely by combining:

- Prospect Readiness
- Financial Health Score
- Explainable risk
- Suggested credit posture
- Credit Copilot
- Governance trace

## 3. Flagship synthetic profile

### Name

Sharma Tools

### Segment

Small manufacturer / GeM-like seller

### Story

Sharma Tools is growing, has stable inflows and strong order completion, but requested more credit than the system considers safe because of moderate buyer concentration and partial GST-like document coverage.

### Why this works

It shows:

- a good business is not automatically given full requested credit
- the system supports growth with credit discipline
- reason codes matter
- Credit Copilot adds officer-ready narrative
- human verification remains required

## 4. Four-minute script

### Minute 0–1: Problem framing

Say:

> MSME lending is not only about identifying risk. Banks also need to know which businesses are worth approaching, how financially healthy they are, how much credit may be safe, and what needs human verification.

Show:

- landing/demo page
- dashboard summary

### Minute 1–2: Prospect discovery

Say:

> LendSignal ranks MSMEs by credit readiness and growth potential, not just by sales interest.

Show:

- ranked prospect table
- high-priority GeM-like seller
- prospect score
- likely credit need

### Minute 2–3: Financial Health Score

Say:

> The score is deterministic and explainable. The AI agent does not calculate the score. The score engine produces the score, confidence, suggested credit range, and reason codes.

Show:

- score gauge
- risk tier
- data confidence
- suggested credit range vs requested amount
- positive and negative factors
- missing-data warnings

### Minute 3–4: Credit Copilot and governance

Say:

> Credit Copilot explains the score, investigates risk, asks follow-up questions, and generates a lending brief for human review. It does not approve loans.

Show:

- generate brief
- final lending brief
- assumptions
- follow-up questions
- trace
- audit event

## 5. Judge-facing differentiators

1. Full prospect-to-credit workflow
2. Deterministic scoring plus controlled agentic AI
3. Explainable reason codes
4. Suggested credit range, not final approval
5. Missing-data honesty
6. Agent trace and governance
7. Synthetic-data safe demo
8. PoC-friendly architecture

## 6. Demo fallback plan

If AI provider is unavailable:

- use mock provider
- show deterministic score
- show cached/mock Copilot brief
- show provider mode as “mock”
- explain that app is designed to run without paid keys

If backend unavailable:

- show screenshots or seeded JSON fallback only if clearly labelled
- prioritize live backend in final demo

## 7. Questions judges may ask

### Why does this need AI?

Because scoring alone gives a number. Bank officers need explanation, investigation, missing-data reasoning, follow-up questions, and a lending brief. Credit Copilot turns score outputs into an analyst-style review while staying controlled and auditable.

### Why not let AI approve loans?

Because credit decisions require policy, compliance, verified data, and human accountability. LendSignal uses AI for decision support, not final authority.

### How do you prevent hallucination?

The agent uses only allowlisted tools, cites internal inputs, works from deterministic score outputs, logs traces, and defaults to mock/provider-controlled execution.

### Is the data real?

No. The MVP uses synthetic data only. It is designed to be connected to verified data sources later.

### What would you do with bank sandbox access?

Connect real sandbox APIs, replace synthetic signals with verified consented data, add model monitoring, add human override workflows, and evaluate score performance with bank-defined outcomes.

## 8. Final closing line

> LendSignal 360 is not trying to replace credit officers. It gives them faster, explainable, governed intelligence to safely grow MSME lending.
