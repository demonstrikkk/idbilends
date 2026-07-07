# Four-Minute Demo Script

## Setup

- Backend: `cd apps/api && uvicorn app.main:app --reload`
- Frontend: `cd apps/web && npm run dev`
- Seed data if needed: open `POST /demo/seed` from API docs or use the app empty-state seed action.
- Primary case: `msme_005` Pragati Design Services for a missing-ITR/bureau evidence gap.
- Optional contrast cases: `msme_001` Aarav Precision Tools, `msme_006` Kaveri Trading Co, `msme_008` Metro Fabrication Works, `msme_009` Nova Wholesale Links.

## Exact Click Path

1. `/case-inbox`
2. Open Pragati Design Services or another Missing Evidence case.
3. In the Credit File, show Business Identity, Evidence Records, Credit Posture, Credit Copilot, and Audit Trail.
4. `/data-room`
5. `/evidence-map`
6. `/copilot`
7. `/governance` only if time remains.

## 0:00 - Problem

MSME credit appraisal data is scattered across statements, GST-like filings, bureau-like checks, document gaps, transaction behavior, and RM notes. LendSignal 360 turns those fragments into a banker-facing credit file for human review.

## 0:30 - Case Inbox

Open `/case-inbox`. Show the underwriting queue grouped by ready review, missing evidence, risk attention, high potential, and low confidence. Select Pragati Design Services to demonstrate a case blocked by missing evidence rather than a final credit outcome.

## 1:00 - Credit File

Open the selected Credit File. Show score, risk tier, data confidence, current blocker, suggested range, and recommended human action. Say: "The deterministic score engine owns these numbers; Copilot can explain them but cannot change them."

## 1:35 - Data Room

Open `/data-room`. Show organized evidence records, status, why each record matters, and disabled actions for unsupported MVP workflows. Emphasize that missing evidence is surfaced honestly instead of being filled in by the UI.

## 2:05 - Evidence Map

Open `/evidence-map`. Show Source Data -> Derived Signal -> Score Component -> Lending Question -> Human Action. Say: "This is the traceability layer a banker needs before relying on any score."

## 2:40 - Credit Copilot

Open `/copilot`, keep Pragati Design Services selected, and ask: `Why is this case blocked?`

Then ask one optional follow-up: `What evidence should I request next?`

Point out cited internal inputs, assumptions, provider/model, and agent trace. Say: "Copilot explains the backend credit file. It does not invent missing facts or issue a final credit decision."

## 3:20 - Human Review And Audit

Return to the Credit File or show `/governance`. Point to recommended human action and audit events for score, Copilot brief, or chat generation. Say: "The output moves the case toward the next officer-controlled review step."

## 3:50 - Close

Closing line: "LendSignal 360 is not a loan chatbot; it is an evidence-first MSME credit file workbench that helps IDBI officers review more cases with better traceability and stronger AI governance."

## Fallbacks

- If Groq is unavailable, use mock mode. The demo still shows deterministic scoring, evidence mapping, audit events, and validated Copilot output.
- If Docker is unavailable, run the backend and frontend with the local commands above.
- If Copilot streaming fails, use the non-streaming "Generate decision-support brief" or chat prompt.
- If the browser starts on `/`, click "Open Case Inbox" and continue the same path.
