# Manual QA Checklist

For the Phase 7 rescue pass, also run [Product Rescue QA](PRODUCT_RESCUE_QA.md).

Phase: 6 Live Credit Monitoring + Scale Simulation

## Command Center

- Open `/command-center`; confirm the table can search, filter, sort, and paginate 1000 synthetic MSME cases.
- Select one row; confirm the right-side preview opens immediately with score, delta, blocker, latest event, and recommended human action.
- Open the evidence drawer from the preview and confirm the document file opens.
- Open Copilot from the preview and ask "Why did this score change?" and "Which evidence blocks this case?"
- Start monitoring once, inject one event, and confirm only one score update is shown for the affected case.

## Core Workflow

- Open `/case-inbox`; confirm lanes are Ready for Review, Missing Evidence, Risk Attention, High Potential Prospect, and Low Confidence.
- Click a case card; confirm `/msmes/{id}` opens the Credit File workbench.
- In Credit File, switch sections: Identity, Financial Records, Evidence Records, Derived Signals, Credit Posture, Copilot, Audit.
- Confirm right inspector shows score, confidence, current blocker, recommended human action, and decision-support disclaimer.

## Data Room

- Open `/data-room`.
- Select multiple credit files.
- Confirm records show status, why it matters, related score component, and enabled/disabled action.
- Confirm unavailable actions are disabled with a reason.

## Evidence Map

- Open `/evidence-map`.
- Select a credit file.
- Confirm rows map Source Data -> Derived Signal -> Score Component -> Lending Question -> Human Action.
- Confirm missing backend data is labelled unavailable.

## Credit Copilot

- Open `/copilot`.
- Select a case.
- Use predefined prompts and free-text chat.
- Confirm responses include provider/model, cited internal inputs, and trace.
- Generate a decision-support brief and stream a brief from the case detail page.
- Confirm score, risk tier, confidence, and suggested range do not change after Copilot activity.

## Live Monitoring

- Seed 1000 profiles with `POST /demo/seed`.
- Open `/monitoring`.
- Start monitoring and confirm the session status changes.
- Inject a manual adverse event and confirm the live stream receives a backend event.
- Confirm score movements, top deteriorating cases, top improving cases, missingness, and drift indicators update from backend responses.
- Confirm `/score-history/{msme_id}` contains the event-linked score delta.
- Stop monitoring and confirm the session status changes.

## Adaptive Overlay

- Open API docs or use a request client for `/market-overlays/simulate`.
- Confirm `policy_score` remains separate from `market_adjusted_score`.
- Confirm overlay output includes version, reason, and trace.

## Provider Modes

- Mock mode returns validated brief/chat responses without keys.
- Groq without `GROQ_API_KEY` shows provider unavailable; deterministic score remains available.
- Disabled mode returns safe disabled response.

## Responsive Checks

- Verify 1366x768, tablet width, and mobile width.
- Tables scroll horizontally.
- Sidebar scrolls internally.
- Credit File inspector remains readable.
- Chat messages do not overlap controls.

## Safety Scans

- Search for final-decision language in `apps/web` and `apps/api`.
- Search for fake frontend data keywords.
- Search for committed non-example Groq secrets.

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
