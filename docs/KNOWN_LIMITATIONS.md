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
- Document upload, OCR, parsing, and file retention workflows are roadmap items.
- Human override is represented as a governance concept, not a persisted workflow yet.

Demo implication: if a judge asks whether the system is production-ready, the correct answer is that the decision-support workflow is demo-ready, while regulated production deployment requires the controls listed in the roadmap.
