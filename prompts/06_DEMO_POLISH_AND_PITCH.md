# 06_PHASE_5_DEMO_WINNING_POLISH.md

You are implementing Phase 5: Demo Winning Polish.

This phase is not about adding random features.
It is about making the project look sharp, bank-relevant, memorable, and judge-ready.

## First steps

Read:

1. `docs/RESEARCH_BLUEPRINT.md`
2. `docs/DEMO_STRATEGY.md`
3. `docs/PROJECT_BRIEF.md`
4. `docs/UI_UX_SPEC.md`
5. `docs/AGENTIC_AI_DESIGN.md`
6. `docs/SCORING_DESIGN.md`

Search inside `docs/RESEARCH_BLUEPRINT.md` for:

* judging strategy
* IDBI alignment
* MSME lending
* Financial Health Score
* Prospect Assist
* differentiation
* PoC readiness
* pitch
* demo
* sandbox
* explainability
* governance
* agentic AI

Use those details to polish the project around the strongest story.

## Goal

Make LendSignal 360 feel like a winning hackathon submission.

The demo must show:

```txt
This is not just AI.
This is bank-usable AI.
This is explainable.
This is controlled.
This supports growth and risk discipline.
```

## Required deliverables

Create or update:

```txt
docs/DEMO_SCRIPT.md
docs/PITCH_NOTES.md
docs/JUDGE_QA.md
docs/KNOWN_LIMITATIONS.md
docs/FUTURE_ROADMAP.md
README.md
```

## Demo data polish

Create or improve 5-7 high-quality synthetic demo profiles.

Each should have a clear story.

Required flagship profiles:

### 1. High-potential GeM-like seller

Story:

* strong order completion
* growing revenue
* good digital payment ratio
* moderate requested credit
* recommended for human review with good confidence

Purpose:

* shows Prospect Assist + Financial Health working together

### 2. Healthy manufacturer asking for too much credit

Story:

* good business
* requested amount too high
* system recommends moderated safe limit

Purpose:

* shows practical credit discipline

### 3. Business with missing GST/bank-statement data

Story:

* cannot confidently assess
* system does not fake certainty
* Credit Copilot recommends document verification

Purpose:

* shows responsible AI

### 4. Trader with high buyer concentration

Story:

* revenue looks strong
* risk comes from one large buyer
* suggested review condition

Purpose:

* shows explainability beyond surface metrics

### 5. Suspicious revenue spike case

Story:

* sudden revenue jump
* weak supporting signals
* risk investigator asks follow-up questions

Purpose:

* shows agentic investigation

### 6. Stressed business

Story:

* high EMI burden
* bounce count rising
* declining revenue
* system recommends caution/human review

Purpose:

* shows risk detection

## UI polish

Improve UI copy and visual hierarchy.

The product should clearly show:

* score
* confidence
* risk
* suggested credit range
* reason codes
* next best action
* Copilot brief
* assumptions
* trace

Avoid:

* clutter
* over-animation
* vague cards
* repeated generic AI words

Use precise banking language.

## Credit Copilot polish

Credit Copilot output should feel like a bank analyst brief.

Each brief should include:

* short executive summary
* key strengths
* key concerns
* suggested credit posture
* required verification
* follow-up questions
* recommended human action
* decision-support disclaimer

It must not say:

* “approve this loan”
* “reject this loan”
* “guaranteed”
* “final decision”

Instead use:

* “recommended for human review”
* “consider moderated limit”
* “requires verification”
* “insufficient confidence”
* “monitor after disbursement”

## Demo script

Create a 4-minute demo script:

### Minute 0-1

Problem and product framing.

### Minute 1-2

Dashboard and prospect ranking.

### Minute 2-3

MSME detail page with score, risk, and suggested limit.

### Minute 3-4

Credit Copilot lending brief, trace, and governance.

Include exact lines the presenter can say.

## Pitch notes

Create `docs/PITCH_NOTES.md` with:

* 10-second pitch
* 30-second pitch
* 60-second pitch
* strongest differentiators
* why this is not generic
* why this fits Financial Health Score
* how Prospect Assist is integrated
* why agentic AI is controlled
* business value
* technical value
* safety/governance value

## Judge Q&A

Create `docs/JUDGE_QA.md`.

Include strong answers for:

1. Why not just a credit score?
2. Why does this need AI?
3. Why is the LLM not deciding the loan?
4. How is this explainable?
5. How would this integrate with a bank?
6. What data is required?
7. Is the data real?
8. How do you prevent hallucinations?
9. How do you handle missing data?
10. How does this reduce risk?
11. How does this grow lending?
12. What is the business impact?
13. What would you build next with bank sandbox access?
14. How do you ensure fairness/responsible AI?
15. Why should this win?

## README polish

Update README to include:

* product overview
* architecture
* stack
* local setup
* demo flow
* API endpoints
* AI provider modes
* safety disclaimer
* screenshots placeholders
* project structure
* known limitations
* future roadmap

## Final demo acceptance criteria

The project is demo-ready only if:

* a judge can understand the value in 30 seconds
* the dashboard opens without confusion
* the flagship MSME story is compelling
* the score has reason codes
* the suggested credit limit is explained
* the Copilot brief is grounded and safe
* the agent trace proves governance
* local fallback works without real AI key
* README explains setup clearly

## Do not do

* Do not add irrelevant features.
* Do not add payment/billing.
* Do not add random chatbot pages.
* Do not over-polish visuals while breaking functionality.
* Do not weaken decision-support safety language.
* Do not make fake claims about real bank integration.

Final report format:

```txt
Summary
Research Blueprint alignment
Files changed
Commands run
Tests/checks
Known limitations
Final demo path
```
