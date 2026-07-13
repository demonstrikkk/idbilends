# Four-Minute Demo Script

## Setup

- Backend: `cd apps/api && uvicorn app.main:app --reload`
- Frontend: `cd apps/web && npm run dev`
- Seed data if needed: open `POST /demo/seed` from API docs or use the app empty-state seed action.
- Primary case: `msme_005` Pragati Design Services for a missing-ITR/bureau evidence gap.
- Primary screen: `/command-center` for 1000-case search, filters, instant preview, evidence drawer, Copilot, and monitoring injection.
- Optional contrast cases: `msme_001` Aarav Precision Tools, `msme_006` Kaveri Trading Co, `msme_008` Metro Fabrication Works, `msme_009` Nova Wholesale Links.

## Exact Click Path

1. `/command-center`
2. Search/filter to Missing Evidence and select Pragati Design Services or another blocked case.
3. Use the right-side preview to show score, delta, blocker, latest event, and recommended human action.
4. Open Evidence Drawer and show actual document content, extracted fields, and source mapping.
5. Open Credit File and show Evidence Records, Credit Posture, Credit Copilot, and Audit Trail.
6. Ask Copilot: `Why did this score change?` and `Which evidence blocks this case?`
7. Start monitoring once, inject one event, and show one clean score update.
8. `/governance` only if time remains.

## 0:00 - Problem

MSME credit appraisal data is scattered across statements, GST-like filings, bureau-like checks, document gaps, transaction behavior, and RM notes. LendSignal 360 turns those fragments into a banker-facing credit file for human review.

## 0:30 - Command Center

Open `/command-center`. Show 1000 synthetic files with saved views, search, backend filters, sorting, and pagination. Select Pragati Design Services to demonstrate a case blocked by missing evidence rather than a final credit outcome.

## 1:00 - Credit File

Use the right preview, then open the selected Credit File. Show score, risk tier, data confidence, current blocker, suggested range, score delta, and recommended human action. Say: "The deterministic score engine owns these numbers; Copilot can explain them but cannot change them."

## 1:35 - Data Room

Open the evidence drawer or `/data-room`. Show organized evidence records, document preview, extracted metadata fields, source mapping, and status controls. Emphasize that missing evidence is surfaced honestly instead of being filled in by the UI.

## 2:05 - Evidence Map

Open `/evidence-map`. Show Source Data -> Derived Signal -> Score Component -> Lending Question -> Human Action. Say: "This is the traceability layer a banker needs before relying on any score."

## 2:40 - Credit Copilot

Open Copilot from the preview or `/copilot`, keep Pragati Design Services selected, and ask: `Why is this case blocked?`

Then ask: `Which evidence blocks this case?` and, after monitoring, `Why did this score change?`

Point out cited internal inputs, assumptions, provider/model, and agent trace. Say: "Copilot explains the backend credit file. It does not invent missing facts or issue a final credit decision."

## 3:20 - Human Review And Audit

Return to the Credit File or show `/governance`. Point to recommended human action and audit events for score, Copilot brief, or chat generation. Say: "The output moves the case toward the next officer-controlled review step."

## 3:50 - Close

Closing line: "LendSignal 360 is not a loan chatbot; it is an evidence-first MSME credit file workbench that helps IDBI officers review more cases with better traceability and stronger AI governance."

## Phase 6 Live Monitoring Insert

Open `/monitoring`, start the simulated session, and inject `bounce_event_recorded` or `bank_balance_drop`. Show the live event feed, score delta, largest deterioration list, and drift indicators. Say: "The policy score is recomputed by deterministic rules; Copilot and overlays explain changes for human review."

## Fallbacks

- If Groq is unavailable, show that explicit Groq mode returns a clear provider error and then switch to mock mode. The demo still shows deterministic scoring, evidence mapping, audit events, and validated Copilot output.
- If Docker is unavailable, run the backend and frontend with the local commands above.
- If Copilot streaming fails, use the non-streaming "Generate decision-support brief" or chat prompt.
- If the browser starts on `/`, click "Open Command Center" and continue the same path.

## Phase 8 — Bank-Grade Strengthening

### Evidence Workflow
- Evidence records now carry evidence_type, title, source, extraction_status, confidence_impact, risk_impact, lending_question, reviewed_at, and audit_event_id.
- Each MSME profile gets 5 seeded evidence records (bank_statement, gst_returns, udyam, itr, bureau_report) with viewable preview files.
- Evidence extraction is labeled as "demo metadata extraction" — not real OCR.
- The evidence drawer supports type/status filtering, upload, and status updates.
- Evidence-to-score-component mapping is shown in both the command center drawer and the credit file DocumentsSection.

### Backend Text Quality
- recommended_human_action now includes score, risk tier, and data confidence values.
- Evidence why_it_matters descriptions include specific score component impact and verification consequences.
- Top blocker in command center cases includes score, tier, and confidence values.
- Score delta reasons include before/after component point values.

### UI/Layout
- Global scrollbar hiding removed; thin styled scrollbars used instead.
- Right drawer overflow-hidden changed to overflow-y-auto.
- Credit file DocumentsSection shows status dots, evidence record counts, extraction status, and links to view files.
- Evidence status disabled_reason now prompts officer to obtain and upload the document.

### AI Boundaries
- No user-facing mock AI. Groq is the live AI provider.
- If Groq is unavailable, AI features return 503. Deterministic score and evidence remain available.
- Synthetic data only. No real customer data.
- Evidence extraction is demo metadata, not OCR.
- Final credit decisions remain outside the system.

### Governance
- GET /scoring/scorecard/{msme_id} endpoint returns full score breakdown.
- Manual event creation requires msme_id context in command center flow.
- Monitoring controls (start/stop/status) available globally in command center header.
