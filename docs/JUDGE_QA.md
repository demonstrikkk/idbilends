# Judge Q&A

## Is this approving loans automatically?

No. LendSignal 360 is decision-support software. It presents deterministic scores, evidence gaps, risk factors, and suggested human review actions. Final lending decisions require bank policy, verified documents, and authorized human approval.

## Why would a bank trust the AI?

The AI layer does not own scoring. It receives sanitized internal context, cites internal inputs, shows assumptions and confidence, and leaves the deterministic score unchanged. The trace and audit trail make generation behavior reviewable.

## What data is used?

Only synthetic MSME profiles, synthetic financial signals, synthetic document statuses, and derived demo records are used in this repository.

## What happens with real IDBI data?

Real data would require consent, authentication, authorization, encryption, audit retention, data minimization, and production integrations. The current architecture is prepared for adapters, but this demo does not include real IDBI data.

## Why not just a dashboard?

Dashboards show metrics. This product organizes a credit file: evidence, missing records, score components, lending questions, next human action, Copilot explanation, and audit context in one workflow.

## Why Groq or an external LLM?

Groq is optional for fast demo inference. The provider is behind a backend adapter, and mock mode is default. The same interface can be replaced by a private model or OpenAI-compatible endpoint.

## Can this run with a private model?

Yes. The Copilot provider layer can be swapped as long as the replacement returns the validated schema and follows the same safety constraints.

## How is hallucination controlled?

Copilot receives a constrained context pack, must cite internal inputs, must disclose assumptions, and cannot invent metrics or mutate scores. The deterministic services remain the source of truth.

## What is deterministic vs AI-generated?

Deterministic: score, risk tier, confidence, suggested range, score factors, missing-data warnings, Prospect Assist outputs, and evidence maps. AI-generated: summaries, lending briefs, explanations, follow-up questions, and case Q&A.

## What is production-ready vs demo?

Demo-ready: local app, deterministic scoring, synthetic data, Credit File workflow, Copilot provider modes, audit events, tests, Docker packaging, CI, and documentation. Production gaps: auth, persistence, rate limiting, real integrations, observability, and formal deployment controls.

## How does this align with MSME lending?

It focuses on borrower readiness, working-capital need, document completeness, cashflow behavior, repayment stress, buyer concentration, and risk anomalies, which are practical signals for MSME credit review.
