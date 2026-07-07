# Judge Q&A

## Is this making loan decisions?

No. It is decision-support software. It organizes evidence, deterministic score outputs, risk factors, and recommended human actions. Final lending authority stays with authorized bank officers and bank policy.

## Why does Copilot not hallucinate?

Copilot receives a sanitized backend context pack, must cite internal inputs, shows assumptions and confidence, and cannot alter score outputs. If a fact is missing, it should surface the evidence gap rather than fill it in.

## What data is real vs synthetic?

All borrower profiles, financial signals, evidence statuses, risk signals, and audit events in this repository are synthetic demo data. No real IDBI, customer, bureau, GST, Udyam, GeM, or Account Aggregator data is included.

## How would this connect to IDBI records?

Production integration would add authenticated adapters for consented account data, core-banking records, document systems, bureau services, GST-like records, Udyam, GeM, and future ULI journeys. The current MVP models those boundaries without adding live integrations.

## Why not just use ChatGPT?

A general chatbot does not own a credit-file workflow, deterministic score trace, evidence map, provider status, audit events, or bank-safe tool boundaries. LendSignal 360 grounds AI in internal backend outputs and keeps numerical credit outputs outside the LLM.

## Can it run with private or open-source models?

Yes. The provider is behind a backend adapter. Groq is optional, mock mode works without keys, and a private OpenAI-compatible or open-source model can replace the provider if it returns the validated schema and follows the same safety contract.

## What is production-ready vs future work?

Demo-ready: local web/API app, synthetic data, deterministic scoring, Prospect Assist, Credit File, Data Room, Evidence Map, Credit Copilot provider modes, audit events, tests, Docker files, and CI.

Future production work: authentication, RBAC, PostgreSQL persistence, durable audit retention, rate limiting, real integrations, observability, document upload/parsing, security hardening, and deployment controls.

## What is the business impact?

The product can reduce preparation time for MSME review, improve evidence discipline, make score reasoning easier to explain, help relationship managers request the right records, and give risk teams a clearer trace from source data to human action.

## Which flagship cases are in the demo data?

- `msme_001` Aarav Precision Tools: healthy growth manufacturer with an ITR gap.
- `msme_005` Pragati Design Services: missing ITR and bureau evidence gap.
- `msme_006` Kaveri Trading Co: buyer concentration and collection-delay case.
- `msme_007` Annapurna Foods: seasonal volatility case.
- `msme_008` Metro Fabrication Works: debt stress case.
- `msme_009` Nova Wholesale Links: suspicious revenue spike case.
