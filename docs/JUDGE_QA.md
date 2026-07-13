# Judge Q&A

## Is this making loan decisions?

No. It is decision-support software. It organizes evidence, deterministic score outputs, risk factors, and recommended human actions. Final lending authority stays with authorized bank officers and bank policy.

## Why does Copilot not hallucinate?

Copilot receives a sanitized backend context pack, must cite internal inputs, shows assumptions and confidence, and cannot alter score outputs. If a fact is missing, it surfaces the evidence gap rather than filling it in. Explicit Groq mode fails visibly when unavailable instead of silently returning mock output.

## What does Command Center prove?

`/command-center` shows the officer operating surface: 1000 synthetic MSME files, backend search/filter/sort/pagination, saved views, instant case preview, evidence drawer, Copilot drawer, and monitoring event injection. It is designed to show that only a small subset of the portfolio needs action now.

## What data is real vs synthetic?

All borrower profiles, financial signals, evidence statuses, risk signals, and audit events in this repository are synthetic demo data. No real IDBI, customer, bureau, GST, Udyam, GeM, or Account Aggregator data is included.

## How would this connect to IDBI records?

Production integration would add authenticated adapters for consented account data, core-banking records, document systems, bureau services, GST-like records, Udyam, GeM, and future ULI journeys. The current MVP models those boundaries without adding live integrations.

## Why not just use ChatGPT?

A general chatbot does not own a credit-file workflow, deterministic score trace, evidence map, provider status, audit events, or bank-safe tool boundaries. LendSignal 360 grounds AI in internal backend outputs and keeps numerical credit outputs outside the LLM.

## Can it run with private or open-source models?

Yes. The provider is behind a backend adapter. Groq is optional, mock mode works without keys, and a private OpenAI-compatible or open-source model can replace the provider if it returns the validated schema and follows the same safety contract.

## What is production-ready vs future work?

Demo-ready: local web/API app, Command Center, 1000-profile synthetic scale simulation, deterministic scoring, score history, monitoring simulator, market overlay simulation, Prospect Assist, Credit File, Data Room, viewable demo evidence records, evidence upload/status endpoints, Evidence Map, Credit Copilot provider modes, audit events, tests, Docker files, and CI.

Future production work: authentication, RBAC, PostgreSQL persistence, durable audit and file retention, rate limiting, real integrations, observability, OCR/document parsing, security hardening, and deployment controls.

## Does the market overlay change the credit policy score?

No. The backend returns `policy_score` and `market_adjusted_score` separately. Overlay effects are versioned, cited, and explainable, and the policy score remains the deterministic source of truth.

## What is the business impact?

The product can reduce preparation time for MSME review, improve evidence discipline, make score reasoning easier to explain, help relationship managers request the right records, and give risk teams a clearer trace from source data to human action.

## Which flagship cases are in the demo data?

- `msme_001` Aarav Precision Tools: healthy growth manufacturer with an ITR gap.
- `msme_005` Pragati Design Services: missing ITR and bureau evidence gap.
- `msme_006` Kaveri Trading Co: buyer concentration and collection-delay case.
- `msme_007` Annapurna Foods: seasonal volatility case.
- `msme_008` Metro Fabrication Works: debt stress case.
- `msme_009` Nova Wholesale Links: suspicious revenue spike case.

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
