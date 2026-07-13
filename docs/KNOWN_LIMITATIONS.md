# Known Limitations

LendSignal 360 is a demo-grade MSME credit intelligence workbench.

- Uses synthetic data only.
- Contains no real IDBI, private bank, customer, bureau, GST, Udyam, GeM, ULI, or Account Aggregator data.
- Uses in-memory storage by default, so data resets when the backend restarts.
- Has no production authentication or role-based authorization yet.
- Does not issue final lending approval or final rejection.
- Has no live AA, GST, Udyam, GeM, ULI, bureau, or core-banking integrations.
- Uses deterministic scoring rules, not a trained production credit model.
- Groq is optional and replaceable through the backend provider adapter.
- Credit Copilot is decision-support only and depends on sanitized internal context.
- Score history and monitoring events are now captured in memory for the demo, but require PostgreSQL persistence for production retention.
- Live monitoring is a synthetic simulator, not a production Kafka/Flink stream.
- Market overlays are deterministic simulated context, not live external market data.
- Rate limiting is documented but not implemented.
- Audit events are demo in-memory events until persistence is added.
- Local demo evidence records, file viewing, upload, and status updates are implemented.
- OCR, production document parsing, and durable file retention workflows are roadmap items.
- Human override is represented as a governance concept, not a persisted workflow yet.

Demo implication: if a judge asks whether the system is production-ready, the correct answer is that the decision-support workflow is demo-ready, while regulated production deployment requires the controls listed in the roadmap.

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
